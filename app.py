from flask import Flask, render_template, redirect, url_for, session, send_from_directory, request, jsonify
import os
from datetime import timedelta
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import time
from werkzeug.utils import secure_filename

# Import blueprints
from Backend.auth import bp as auth_bp, is_authenticated
from Backend.chat import bp as chat_bp
from Backend.settings import bp as settings_bp

# Initialize database
from Backend.db import create_tables, connect_db

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_togolok_chat')  # Set secret key for sessions
app.permanent_session_lifetime = timedelta(days=7)  # Set session lifetime

# Initialize SocketIO with explicit configuration
socketio = SocketIO(app, 
                   cors_allowed_origins="*", 
                   async_mode='threading',
                   logger=True, 
                   engineio_logger=True)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(settings_bp, url_prefix='/api')

# Create required directories if they don't exist
os.makedirs('uploads/profile_photos', exist_ok=True)
os.makedirs('uploads/direct_images', exist_ok=True)
os.makedirs('uploads/group_images', exist_ok=True)

# Ensure database tables exist
create_tables()

# Serve the chat application page (requires authentication)
@app.route('/chat')
def chat():
    if not is_authenticated():
        return redirect(url_for('index'))
    return render_template('chat.html')

# Serve the main application
@app.route('/')
def index():
    if is_authenticated():
        return redirect(url_for('chat'))
    return render_template('index.html')

# Add a test route
@app.route('/test')
def test():
    return render_template('test.html')

# Add a test route specifically for create group sidebar
@app.route('/test-create-group')
def test_create_group():
    print("Serving test-create-group with real contacts if available")
    # Get the current user ID from session
    user_id = session.get('user_id')
    if not user_id:
        print("No user_id in session, trying to get one from the database for testing")
        # Try to get any user from the database for testing
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users LIMIT 1")
        result = cursor.fetchone()
        if result:
            user_id = result[0]
            print(f"Using user_id {user_id} for contact query")
        conn.close()
    
    if user_id:
        # Get all contacts for this user
        conn = connect_db()
        cursor = conn.cursor()
        
        # Get contacts with user IDs and names
        cursor.execute('''
            SELECT c.contact_id as user_id, u.username as name 
            FROM contacts c
            JOIN users u ON c.contact_id = u.id
            WHERE c.user_id = ?
        ''', (user_id,))
        
        contacts = []
        for row in cursor.fetchall():
            contacts.append({
                'user_id': row[0],
                'name': row[1],
                'avatar_url': '/static/images/contact_logo.png'  # Default avatar
            })
        
        conn.close()
        
        print(f"Found {len(contacts)} real contacts for user {user_id}")
        
        # If no contacts found for the user, add some example contacts for testing
        if not contacts:
            print("No contacts found, adding fallback contacts")
            contacts = [
                {'user_id': 'user1', 'name': 'Эмил Агай (тест)', 'avatar_url': '/static/images/contact_logo.png'},
                {'user_id': 'user2', 'name': 'Мунара Эжеке (тест)', 'avatar_url': '/static/images/contact_logo.png'},
                {'user_id': 'user3', 'name': 'Улан Агай (тест)', 'avatar_url': '/static/images/contact_logo.png'}
            ]
    else:
        # For testing, create some dummy contacts
        print("Using dummy test contacts")
        contacts = [
            {'user_id': 'user1', 'name': 'Эмил Агай (тест)', 'avatar_url': '/static/images/contact_logo.png'},
            {'user_id': 'user2', 'name': 'Мунара Эжеке (тест)', 'avatar_url': '/static/images/contact_logo.png'},
            {'user_id': 'user3', 'name': 'Улан Агай (тест)', 'avatar_url': '/static/images/contact_logo.png'}
        ]
    
    # Render template with contacts data
    return render_template('_sidebar_create_group.html', contacts=contacts)

# Serve sidebar templates
@app.route('/templates/_sidebar_<filename>.html')
def serve_sidebar_template(filename):
    print(f"Serving sidebar template: _sidebar_{filename}.html with filename: {filename}")
    try:
        # Handle template name with hyphens
        template_filename = filename.replace('-', '_')
        print(f"Converted filename to: {template_filename}")
        
        # Special case for create group template
        if template_filename == 'create_group':
            print("Processing create_group template")
            # Get the current user ID from session
            user_id = session.get('user_id')
            if not user_id:
                return "Not authenticated", 401
                
            # Get all contacts for this user
            conn = connect_db()
            cursor = conn.cursor()
            
            # Get contacts with user IDs and names
            cursor.execute('''
                SELECT c.contact_id as user_id, u.username as name 
                FROM contacts c
                JOIN users u ON c.contact_id = u.id
                WHERE c.user_id = ?
            ''', (user_id,))
            
            contacts = []
            for row in cursor.fetchall():
                contacts.append({
                    'user_id': row[0],
                    'name': row[1],
                    'avatar_url': '/static/images/contact_logo.png'  # Default avatar
                })
                
            conn.close()
            print(f"Found {len(contacts)} contacts for user {user_id}")
            
            # Render template with contacts data
            return render_template('_sidebar_create_group.html', contacts=contacts)
        else:
            # Default rendering for other templates
            return render_template(f'_sidebar_{template_filename}.html')
    except Exception as e:
        print(f"Error serving template: {str(e)}")
        return f"Template not found: _sidebar_{filename}.html", 404

# Serve static files from the uploads directory
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    # Extract the directory part from the filename
    directory = os.path.dirname(filename)
    base_filename = os.path.basename(filename)
    
    # Check if the directory exists
    if directory and os.path.exists(directory):
        return send_from_directory(directory, base_filename)
    
    # Try as static file if directory doesn't exist
    try:
        return app.send_static_file(f'uploads/{filename}')
    except:
        # If not found as static file, look in our specific upload directories
        if 'profile_photos' in filename:
            return send_from_directory('uploads/profile_photos', base_filename)
        elif 'direct_images' in filename:
            return send_from_directory('uploads/direct_images', base_filename)
        elif 'group_images' in filename:
            return send_from_directory('uploads/group_images', base_filename)
        else:
            return f"File not found: {filename}", 404

@app.route('/uploads/profile_photos/<filename>')
def serve_profile_photo(filename):
    return send_from_directory('uploads/profile_photos', filename)

@app.route('/uploads/direct_images/<filename>')
def serve_direct_image(filename):
    return send_from_directory('uploads/direct_images', filename)

@app.route('/uploads/group_images/<filename>')
def serve_group_image(filename):
    return send_from_directory('uploads/group_images', filename)

# Serve favicon.ico
@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('images/logo.png')

# Socket.IO event handlers
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
    
    # If we have the username, emit a status update to notify others
    if username:
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
    
    print(f"Message from {sender_username}({sender_id}) to {receiver_username}({receiver_id}): {message}")
    
    if not sender_id:
        return {'status': 'error', 'message': 'Not authenticated'}
    
    if not message:
        return {'status': 'error', 'message': 'No message provided'}
    
    try:
        # Handle different types of messages
        if group_id:
            # Group message
            room = f'group_{group_id}'
            
            # Emit message to the entire group room
            emit('new_message', {
                'sender_id': sender_id,
                'sender_username': sender_username,
                'message': message,
                'group_id': group_id,
                'timestamp': timestamp
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
            
            # Send to the recipient
            message_data = {
                'sender_id': sender_id,
                'sender_username': sender_username,
                'message': message,
                'timestamp': timestamp
            }
            
            print(f"Emitting to room: {target_room}")
            emit('new_message', message_data, room=target_room)
            
            # Also notify the sender for UI update confirmation
            emit('message_sent', {
                'receiver_id': receiver_id,
                'receiver_username': receiver_username,
                'message': message,
                'timestamp': timestamp
            }, room=str(sender_id))
            
            return {'status': 'success', 'message': 'Direct message sent'}
        
        else:
            return {'status': 'error', 'message': 'No receiver specified'}
    
    except Exception as e:
        print(f'Error sending message: {str(e)}')
        return {'status': 'error', 'message': str(e)}

@app.route('/api/create-group', methods=['POST'])
def create_group():
    """Create a new group chat"""
    # Check if user is authenticated
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
    try:
        # Get user ID from session
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': 'User ID not found in session'}), 401
            
        # Get form data
        data = request.get_json() or {}
        group_name = data.get('group_name')
        if not group_name:
            return jsonify({'success': False, 'error': 'Group name is required'}), 400
        
        # Get and validate member IDs
        member_ids_json = data.get('member_ids')
        if not member_ids_json:
            return jsonify({'success': False, 'error': 'No members selected'}), 400
        
        try:
            if isinstance(member_ids_json, str):
                member_ids = json.loads(member_ids_json)
            else:
                member_ids = member_ids_json
        except json.JSONDecodeError:
            return jsonify({'success': False, 'error': 'Invalid member IDs format'}), 400
        
        # Ensure current user is included in member IDs
        if user_id not in member_ids:
            member_ids.append(user_id)
        
        # Connect to database
        conn = connect_db()
        cursor = conn.cursor()
        
        # Create the group
        cursor.execute(
            "INSERT INTO groups (group_name, admin_id) VALUES (?, ?)",
            (group_name, user_id)
        )
        group_id = cursor.lastrowid
        
        # Add members to the group
        for member_id in member_ids:
            try:
                # Convert to int to ensure it's a valid ID
                member_id = int(member_id)
                # Check if user exists
                cursor.execute("SELECT id FROM users WHERE id = ?", (member_id,))
                if cursor.fetchone():
                    cursor.execute(
                        "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
                        (group_id, member_id)
                    )
            except (ValueError, TypeError):
                print(f"Invalid member ID: {member_id}")
                continue  # Skip invalid IDs
        
        # Process avatar if provided
        group_picture = None
        if 'avatar' in request.files and request.files['avatar'].filename:
            avatar_file = request.files['avatar']
            allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
            if avatar_file and '.' in avatar_file.filename and avatar_file.filename.rsplit('.', 1)[1].lower() in allowed_extensions:
                filename = secure_filename(f"group_{group_id}_{int(time.time())}.{avatar_file.filename.rsplit('.', 1)[1].lower()}")
                avatar_path = os.path.join('uploads', 'group_images', filename)
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(avatar_path), exist_ok=True)
                
                # Save the image
                avatar_file.save(avatar_path)
                group_picture = f"/uploads/group_images/{filename}"
                
                # Update group with avatar path
                cursor.execute(
                    "UPDATE groups SET group_picture = ? WHERE id = ?",
                    (group_picture, group_id)
                )
        
        # Commit changes to database
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Group created successfully',
            'group_id': group_id
        })
        
    except Exception as e:
        print(f"Error creating group: {str(e)}")
        # Rollback if there was a connection
        try:
            conn.rollback()
            conn.close()
        except:
            pass
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.debug = True  # Enable debug mode
    app.config['TEMPLATES_AUTO_RELOAD'] = True  # Enable template auto-reloading
    # Allow connections from any IP and disable verification
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=5000, 
        debug=True,
        allow_unsafe_werkzeug=True  # Only use in development!
    ) 