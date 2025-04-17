from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template
from Backend.db import connect_db
from flask_socketio import emit, join_room, leave_room
import time
import os
# Create blueprint
bp = Blueprint("chat", __name__, url_prefix="/chat")

# This will be set by the app when the blueprint is registered
socketio = None

def init_socketio(socket_instance):
    """Initialize the socketio instance from the main app"""
    global socketio
    socketio = socket_instance

def require_auth():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
    return None

# Main chat page route
@bp.route('/')
def chat_index():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    # Render the chat template
    return render_template('chat.html')

# --- Direct Messages --- 
@bp.route("/send_message", methods=["POST"])
def send_message():
    auth = require_auth()
    if auth: return auth
    
    data = request.get_json()
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, message, time)
        VALUES (?, ?, ?, datetime('now'))
    """, (session['user_id'], data['receiver_id'], data['message']))
    conn.commit()
    return jsonify({"message": "Message sent"}), 200

@bp.route("/get_messages/<int:receiver_id>", methods=["GET"])
def get_messages(receiver_id):
    auth = require_auth()
    if auth: return auth
    
    cursor = connect_db().cursor()
    cursor.execute("""
        SELECT sender_id, receiver_id, message, time FROM messages 
        WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
        ORDER BY time ASC
    """, (session['user_id'], receiver_id, receiver_id, session['user_id']))
    return jsonify(cursor.fetchall()), 200

# --- Groups --- 
@bp.route("/groups", methods=["GET"])
def get_groups():
    auth = require_auth()
    if auth: return auth
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get groups that the user is a member of
    cursor.execute("""
        SELECT g.id, g.group_name, g.admin_id, g.group_picture, 
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count 
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
    """, (session['user_id'],))
    
    groups = []
    for row in cursor.fetchall():
        groups.append({
            'id': row[0],
            'name': row[1],
            'admin_id': row[2],
            'picture': row[3],
            'member_count': row[4],
            'is_admin': row[2] == session['user_id']
        })
    
    conn.close()
    return jsonify(groups), 200

@bp.route("/group/<int:group_id>", methods=["GET"])
def get_group(group_id):
    auth = require_auth()
    if auth: return auth
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Check if user is a member of the group
    cursor.execute("""
        SELECT 1 FROM group_members 
        WHERE group_id = ? AND user_id = ?
    """, (group_id, session['user_id']))
    
    if not cursor.fetchone():
        return jsonify({"message": "Not a member of this group"}), 403
    
    # Get group info
    cursor.execute("""
        SELECT g.id, g.group_name, g.admin_id, g.group_picture,
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM groups g
        WHERE g.id = ?
    """, (group_id,))
    
    group = cursor.fetchone()
    if not group:
        return jsonify({"message": "Group not found"}), 404
    
    # Get group members
    cursor.execute("""
        SELECT u.id, u.username, u.profile_picture, u.name,
               (u.id = g.admin_id) as is_admin
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        JOIN groups g ON gm.group_id = g.id
        WHERE gm.group_id = ?
    """, (group_id,))
    
    members = []
    for row in cursor.fetchall():
        members.append({
            'id': row[0],
            'username': row[1],
            'profile_picture': row[2],
            'name': row[3],
            'is_admin': bool(row[4])
        })
    
    result = {
        'id': group[0],
        'name': group[1],
        'admin_id': group[2],
        'picture': group[3],
        'member_count': group[4],
        'is_admin': group[2] == session['user_id'],
        'members': members
    }
    
    conn.close()
    return jsonify(result), 200

@bp.route("/create_group", methods=["POST"])
def create_group():
    auth = require_auth()
    if auth: return auth
    
    # Handle multipart/form-data requests (for group image upload)
    if request.content_type and 'multipart/form-data' in request.content_type:
        group_name = request.form.get('group_name')
        member_ids = request.form.getlist('member_ids')
        group_description = request.form.get('description', '')
        group_picture = None
        
        # Handle uploaded image
        if 'group_picture' in request.files:
            file = request.files['group_picture']
            if file and file.filename:
                # Generate a secure filename
                filename = f"group_{int(time.time())}_{session['user_id']}_{file.filename}"
                filepath = os.path.join('uploads/group_images', filename)
                file.save(filepath)
                group_picture = filename
    else:
        # Handle JSON requests
        data = request.get_json()
        group_name = data.get('group_name')
        member_ids = data.get('member_ids', [])
        group_description = data.get('description', '')
        group_picture = None
    
    if not group_name:
        return jsonify({"message": "Group name is required"}), 400
        
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Start a transaction
        conn.execute("BEGIN TRANSACTION")
        
        # Create the group
        cursor.execute("""
            INSERT INTO groups (group_name, admin_id, group_picture, description)
            VALUES (?, ?, ?, ?)
        """, (group_name, session['user_id'], group_picture, group_description))
        
        group_id = cursor.lastrowid
        
        # Add the creator as a member
        cursor.execute("""
            INSERT INTO group_members (group_id, user_id)
            VALUES (?, ?)
        """, (group_id, session['user_id']))
        
        # Add all selected members
        for member_id in member_ids:
            if int(member_id) != session['user_id']:  # Skip if it's the creator (already added)
                cursor.execute("""
                    INSERT INTO group_members (group_id, user_id)
                    VALUES (?, ?)
                """, (group_id, member_id))
        
        # Get the creator's username for notifications
        cursor.execute("SELECT username FROM users WHERE id = ?", (session['user_id'],))
        creator_username = cursor.fetchone()[0]
        
        conn.commit()
        
        # Send notifications to all members
        if socketio:
            for member_id in member_ids:
                if int(member_id) != session['user_id']:  # Don't notify yourself
                    notification = {
                        'type': 'added_to_group',
                        'group_id': group_id,
                        'group_name': group_name,
                        'added_by': creator_username,
                        'message': f"{creator_username} added you to the group '{group_name}'"
                    }
                    socketio.emit('notification', notification, room=str(member_id))
        
        return jsonify({
            "group_id": group_id,
            "message": "Group created successfully",
            "member_count": len(member_ids) + 1  # +1 for the creator
        }), 200
        
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        return jsonify({"message": f"Failed to create group: {str(e)}"}), 500
        
    finally:
        conn.close()

@bp.route("/add_to_group", methods=["POST"])
def add_to_group():
    auth = require_auth()
    if auth: return auth
    
    data = request.get_json()
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)",
                   (data['group_id'], data['user_id']))
    conn.commit()
    return jsonify({"message": "User added to group"}), 200

@bp.route("/send_group_message", methods=["POST"])
def send_group_message():
    auth = require_auth()
    if auth: return auth
    
    data = request.get_json()
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO group_messages (group_id, sender_id, message, time)
        VALUES (?, ?, ?, datetime('now'))
    """, (data['group_id'], session['user_id'], data['message']))
    conn.commit()
    return jsonify({"message": "Group message sent"}), 200

@bp.route("/get_group_messages/<int:group_id>", methods=["GET"])
def get_group_messages(group_id):
    auth = require_auth()
    if auth: return auth
    
    cursor = connect_db().cursor()
    cursor.execute("""
        SELECT sender_id, message, time FROM group_messages 
        WHERE group_id = ? ORDER BY time ASC
    """, (group_id,))
    return jsonify(cursor.fetchall()), 200

# --- Contacts --- 
@bp.route("/contacts", methods=["GET"])
def get_contacts():
    auth = require_auth()
    if auth: return auth
    
    cursor = connect_db().cursor()
    cursor.execute("""
        SELECT contact_id, display_name FROM contacts WHERE user_id = ?
    """, (session['user_id'],))
    return jsonify(cursor.fetchall()), 200

@bp.route("/add_contact", methods=["POST"])
def add_contact():
    auth = require_auth()
    if auth: return auth
    
    data = request.get_json()
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Start a transaction
        conn.execute("BEGIN TRANSACTION")
        
        # Add the contact to the current user's contacts
        cursor.execute("""
            INSERT OR IGNORE INTO contacts (user_id, contact_id, display_name)
            VALUES (?, ?, ?)
        """, (session['user_id'], data['contact_id'], data.get('display_name')))
        
        # Also add the current user to the contact's contacts list (bidirectional relationship)
        cursor.execute("""
            INSERT OR IGNORE INTO contacts (user_id, contact_id, display_name)
            VALUES (?, ?, NULL)
        """, (data['contact_id'], session['user_id']))
        
        # Get the current user's info for notifications
        cursor.execute("SELECT username FROM users WHERE id = ?", (session['user_id'],))
        current_username = cursor.fetchone()[0]
        
        # Commit the transaction
        conn.commit()
        
        # Emit a real-time notification to the other user if they're online
        if socketio:
            notification = {
                'type': 'contact_added',
                'user_id': session['user_id'],
                'username': current_username,
                'message': f"{current_username} added you as a contact"
            }
            socketio.emit('notification', notification, room=str(data['contact_id']))
        
        return jsonify({"message": "Contact added"}), 200
    
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        return jsonify({"message": f"Failed to add contact: {str(e)}"}), 500
        
    finally:
        conn.close()

# --- User Info ---
@bp.route("/user_info", methods=["GET"])
def get_user_info():
    auth = require_auth()
    if auth: return auth
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get all users except the current user
    cursor.execute("""
        SELECT id, username, profile_picture, name FROM users
        WHERE id != ?
    """, (session['user_id'],))
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'username': row[1],
            'profile_picture': row[2],
            'name': row[3]
        })
    
    conn.close()
    return jsonify(users), 200

# --- User Search ---
@bp.route("/search_users", methods=["GET"])
def search_users():
    auth = require_auth()
    if auth: return auth
    
    search_term = request.args.get('term', '')
    if not search_term:
        return jsonify([]), 200
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Search for users by username or email
    cursor.execute("""
        SELECT id, username, email, profile_picture, name FROM users
        WHERE (username LIKE ? OR email LIKE ?) AND id != ?
    """, (f"%{search_term}%", f"%{search_term}%", session['user_id']))
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'username': row[1],
            'email': row[2],
            'profile_picture': row[3],
            'name': row[4]
        })
    
    conn.close()
    return jsonify(users), 200

# --- Socket.IO event handlers ---
def register_socket_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
        if 'user_id' in session:
            user_id = session['user_id']
            print(f'User {user_id} connected')
            # Join a room with the user's ID
            join_room(str(user_id))
        else:
            print('Anonymous user connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('join')
    def handle_join(data):
        room = data.get('room')
        if not room:
            return
        
        # Get username if available
        username = None
        if 'username' in session:
            username = session['username']
        
        # Join the room
        join_room(str(room))
        print(f'Client joined room: {room}')
        
        # Check if this is a group room
        if isinstance(room, str) and room.startswith('group_'):
            group_id = room.split('_')[1]
            print(f'User {username} joined group room: {group_id}')
            
            # Notify others in the group that this user has joined
            if username:
                emit('user_joined_group', {
                    'username': username,
                    'user_id': session.get('user_id'),
                    'group_id': group_id,
                    'timestamp': time.time()
                }, room=room, include_self=False)
        
        # If we have the username, emit a status update to notify others
        elif username:
            emit('user_status', {
                'username': username,
                'status': 'online'
            }, broadcast=True, include_self=False)

    @socketio.on('leave')
    def handle_leave(data):
        room = data.get('room')
        if room:
            leave_room(room)
            print(f'Client left room: {room}')

    @socketio.on('send_message')
    def handle_message(data):
        # Get sender info from session
        sender_id = session.get('user_id')
        sender_username = session.get('username')
        
        # Get message details from data
        receiver_username = data.get('receiver_username')
        receiver_id = data.get('receiver_id')
        message = data.get('message')
        group_id = data.get('group_id')
        timestamp = data.get('timestamp', '')
        message_id = data.get('message_id', str(int(time.time())) + str(sender_id))
        
        print(f"Message from {sender_username}({sender_id}) to {receiver_username if receiver_username else 'Group '+str(group_id)}): {message}")
        
        if not sender_id:
            return {'status': 'error', 'message': 'Not authenticated'}
        
        if not message:
            return {'status': 'error', 'message': 'No message provided'}
        
        try:
            # Handle different types of messages
            if group_id:
                # Group message
                room = f'group_{group_id}'
                
                # Store the message in the database
                conn = connect_db()
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO group_messages (group_id, sender_id, message, time)
                    VALUES (?, ?, ?, datetime('now'))
                """, (group_id, sender_id, message))
                
                conn.commit()
                conn.close()
                
                # Emit message to the entire group room
                emit('new_message', {
                    'sender_id': sender_id,
                    'sender_username': sender_username,
                    'message': message,
                    'group_id': group_id,
                    'timestamp': timestamp,
                    'message_id': message_id
                }, room=room)
                
                return {'status': 'success', 'message': 'Group message sent'}
            
            elif receiver_username or receiver_id:
                # Direct message - find the best room to emit to
                target_room = None
                
                # Prioritize receiver_id if available
                if receiver_id:
                    target_room = str(receiver_id)
                # Otherwise use username
                elif receiver_username:
                    # Look up the user ID from username
                    conn = connect_db()
                    cursor = conn.cursor()
                    
                    cursor.execute("SELECT id FROM users WHERE username = ?", (receiver_username,))
                    result = cursor.fetchone()
                    
                    if result:
                        receiver_id = result[0]
                        target_room = str(receiver_id)
                    
                    conn.close()
                
                if not target_room:
                    return {'status': 'error', 'message': 'Could not determine recipient'}
                
                # Store the message in the database
                conn = connect_db()
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO messages (sender_id, receiver_id, message, time)
                    VALUES (?, ?, ?, datetime('now'))
                """, (sender_id, receiver_id, message))
                
                conn.commit()
                conn.close()
                
                # Send to the recipient
                message_data = {
                    'sender_id': sender_id,
                    'sender_username': sender_username,
                    'receiver_id': receiver_id,
                    'message': message,
                    'timestamp': timestamp,
                    'message_id': message_id
                }
                
                print(f"Emitting to room: {target_room}")
                emit('new_message', message_data, room=target_room)
                
                # Also notify the sender for UI update confirmation
                emit('message_sent', {
                    'receiver_id': receiver_id,
                    'receiver_username': receiver_username,
                    'message': message,
                    'timestamp': timestamp,
                    'message_id': message_id
                }, room=str(sender_id))
                
                return {'status': 'success', 'message': 'Direct message sent', 'message_id': message_id}
            
            else:
                return {'status': 'error', 'message': 'No receiver specified'}
        
        except Exception as e:
            print(f'Error sending message: {str(e)}')
            return {'status': 'error', 'message': str(e)}

    @socketio.on('update_message_status')
    def handle_status_update(data):
        """Handle status updates for messages and broadcast to relevant users"""
        try:
            # Extract data
            message_id = data.get('message_id')
            status = data.get('status', 'read')  # Default to 'read'
            chat_id = data.get('chat_id')  # This could be user_id or group_id
            chat_type = data.get('chat_type', 'direct')  # 'direct' or 'group'
            
            # Sender info (the one updating the status)
            updater_id = session.get('user_id')
            updater_username = session.get('username')
            
            if not message_id or not chat_id or not updater_id:
                print(f"Missing data for status update: {data}")
                return {'status': 'error', 'message': 'Incomplete data for status update'}
                
            # For direct messages, notify the sender
            if chat_type == 'direct':
                # The chat_id should be the sender of the original message
                sender_room = str(chat_id)
                
                # Emit status update to the original message sender
                emit('message_status', {
                    'message_id': message_id,
                    'status': status,
                    'chat_id': updater_id,  # The updater (recipient) is the chat_id from sender's perspective
                    'updated_by': updater_username,
                    'timestamp': time.time()
                }, room=sender_room)
                
                print(f"Emitted status update to room {sender_room} for message {message_id}: {status}")
                
            elif chat_type == 'group':
                # For group messages, notify all group members
                room = f'group_{chat_id}'
                
                emit('message_status', {
                    'message_id': message_id,
                    'status': status,
                    'chat_id': chat_id,
                    'updated_by': updater_username,
                    'timestamp': time.time()
                }, room=room, include_self=False)
                
                print(f"Emitted group status update to room {room} for message {message_id}: {status}")
                
            return {'status': 'success', 'message': 'Status update broadcast sent'}
            
        except Exception as e:
            print(f"Error processing status update: {str(e)}")
            return {'status': 'error', 'message': str(e)}