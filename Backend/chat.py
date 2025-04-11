from flask import Blueprint, request, jsonify, send_from_directory
from Backend.db import connect_db
from datetime import datetime
import os
from werkzeug.utils import secure_filename

# Create blueprint with a unique name
bp = Blueprint("chat", __name__)

# Create directories for image uploads if they don't exist
UPLOAD_FOLDER_DIRECT = 'uploads/direct_images'
UPLOAD_FOLDER_GROUP = 'uploads/group_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/get_contacts', methods=['GET'])
def get_contacts():
    username = request.args.get('username')

    if not username:
        return jsonify({"message": "Username is required"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Get the user's ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({"message": "User not found"}), 404

    user_id = user[0]

    # Get all contacts for the user
    cursor.execute('''
        SELECT users.username 
        FROM contacts
        JOIN users ON contacts.contact_id = users.id
        WHERE contacts.user_id = ?
    ''', (user_id,))

    contacts = [row[0] for row in cursor.fetchall()]
    
    conn.close()

    return jsonify({"contacts": contacts}), 200

@bp.route('/add_contact', methods=['POST'])
def add_contact():
    data = request.get_json()
    username = data.get('username')
    contact_username = data.get('contact_username')

    # Ensure both fields are provided
    if not username or not contact_username:
        return jsonify({'message': 'Username and contact username are required!'}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Check if both users exist
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    cursor.execute("SELECT * FROM users WHERE username = ?", (contact_username,))
    contact = cursor.fetchone()

    if not user:
        return jsonify({'message': 'User not found'}), 404
    if not contact:
        return jsonify({'message': 'Contact not found'}), 404

    # Check if the contact is already added
    cursor.execute('''
        SELECT * FROM contacts 
        WHERE (user_id = ? AND contact_id = ?) 
        OR (user_id = ? AND contact_id = ?)
    ''', (user[0], contact[0], contact[0], user[0]))
    existing_contact = cursor.fetchone()

    if existing_contact:
        return jsonify({'message': 'These users are already contacts.'}), 400

    # Add the contact to the contacts table
    cursor.execute('''
        INSERT INTO contacts (user_id, contact_id) 
        VALUES (?, ?)
    ''', (user[0], contact[0]))

    # Commit changes and close the connection
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'message': 'Contact added successfully!'}), 200

@bp.route('/create_group', methods=['POST'])
def create_group():
    data = request.get_json()
    username = data.get('username')
    group_name = data.get('group_name')
    usernames_contacts = data.get('usernames_contacts')

    # Ensure required fields are provided
    if not username or not group_name or not usernames_contacts:
        return jsonify({'message': 'Username, group name, and contacts list are required!'}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Check if the admin user exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    admin = cursor.fetchone()

    if not admin:
        return jsonify({'message': 'Admin user not found'}), 404

    # Create the group
    cursor.execute('''
        INSERT INTO groups (group_name, admin_id) 
        VALUES (?, ?)
    ''', (group_name, admin[0]))

    group_id = cursor.lastrowid  # Get the group ID of the newly created group

    # Add the admin to the group members table
    cursor.execute('''
        INSERT INTO group_members (group_id, user_id) 
        VALUES (?, ?)
    ''', (group_id, admin[0]))

    # Check if each contact exists and add them to the group
    for contact_username in usernames_contacts:
        cursor.execute("SELECT * FROM users WHERE username = ?", (contact_username,))
        contact = cursor.fetchone()

        if not contact:
            conn.rollback()  
            return jsonify({'message': f'Contact {contact_username} not found'}), 404

        # Add the contact to the group_members table
        cursor.execute('''
            INSERT INTO group_members (group_id, user_id) 
            VALUES (?, ?)
        ''', (group_id, contact[0]))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': f'Group "{group_name}" created successfully!'}), 200

@bp.route('/delete_group', methods=['POST'])
def delete_group():
    data = request.get_json()
    group_name = data.get('group_name')  # The group name to delete
    username = data.get('username')  # The username of the admin requesting the deletion

    if not group_name or not username:
        return jsonify({'message': 'Group name and admin username are required!'}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Check if the user is the admin of the group
    cursor.execute('''
        SELECT id, admin_id FROM groups WHERE group_name = ?
    ''', (group_name,))
    group = cursor.fetchone()

    if not group:
        return jsonify({'message': 'Group not found!'}), 404

    group_id, admin_id = group

    # Get the user ID of the admin
    cursor.execute('''
        SELECT id FROM users WHERE username = ?
    ''', (username,))
    admin = cursor.fetchone()

    if not admin:
        return jsonify({'message': 'Admin not found!'}), 404

    user_id = admin[0]

    # Check if the user is the admin of the group
    if user_id != admin_id:
        return jsonify({'message': 'You are not the admin of this group!'}), 403

    cursor.execute('''
        DELETE FROM groups WHERE id = ?
    ''', (group_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'message': 'Group and its members deleted successfully'}), 200

@bp.route('/leave_group', methods=['POST'])
def leave_group():
    data = request.get_json()
    username = data.get('username')
    group_id = data.get('group_id')

    if not username or not group_id:
        return jsonify({"message": "Username and group_id are required"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Check if the user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"message": "User not found"}), 404
    user_id = user[0]

    cursor.execute("SELECT * FROM group_members WHERE user_id = ? AND group_id = ?", (user_id, group_id))
    membership = cursor.fetchone()
    if not membership:
        return jsonify({"message": "User is not a member of this group"}), 400

    cursor.execute("SELECT admin_id FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()
    if not group:

        return jsonify({"message": "Group not found"}), 404
    admin_id = group[0]

    if user_id == admin_id:
       
        cursor.execute("SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?", (group_id, user_id))
        other_members = cursor.fetchone()

        if other_members:
            
            new_admin_id = other_members[0]
            cursor.execute("UPDATE groups SET admin_id = ? WHERE id = ?", (new_admin_id, group_id))
        else:
            
            cursor.execute("DELETE FROM groups WHERE id = ?", (group_id,))  

    cursor.execute("DELETE FROM group_members WHERE user_id = ? AND group_id = ?", (user_id, group_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "User left the group successfully"}), 200

@bp.route('/add_contact_to_group', methods=['POST'])
def add_contact_to_group():
    data = request.get_json()
    group_id = data.get("group_id")
    username = data.get("username")  # The user trying to add a contact
    contact_username = data.get("contact_username")  # The contact being added

    if not group_id or not username or not contact_username:
        return jsonify({"message": "All fields (group_id, username, contact_username) are required!"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Check if group exists
    cursor.execute("SELECT admin_id FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()
    if not group:
        return jsonify({"message": "Group not found"}), 404

    # Check if user is admin
    admin_id = group[0]
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    if not user or user[0] != admin_id:
        return jsonify({"message": "Only the group admin can add members"}), 403

    # Get contact user ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (contact_username,))
    contact = cursor.fetchone()
    if not contact:
        return jsonify({"message": "Contact user not found"}), 404

    contact_id = contact[0]

    # Check if contact is already in the group
    cursor.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, contact_id))
    existing_member = cursor.fetchone()
    if existing_member:
        return jsonify({"message": "User is already in the group"}), 400

    # Add contact to group
    cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", (group_id, contact_id))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": f"User '{contact_username}' added to group successfully!"}), 200

@bp.route('/ban_user', methods=['POST'])
def ban_user():
    data = request.get_json()
    username = data.get('username')

    conn = connect_db()
    cursor = conn.cursor()


    cursor.execute("SELECT email FROM users WHERE username = ?", (username,))
    user_data = cursor.fetchone()

    if user_data:
        email = user_data[0]
        cursor.execute("INSERT INTO banned (email) VALUES (?)", (email,))
        conn.commit()
        conn.close()
        return jsonify({"message": f"User {username} has been banned."}), 200
    else:
        conn.close()
        return jsonify({"error": "User not found"}), 404

@bp.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    sender_username = data.get('sender_username')
    receiver_username = data.get('receiver_username')
    message_text = data.get('message')
    
    if not sender_username or not receiver_username or not message_text:
        return jsonify({"message": "Sender username, receiver username, and message are required!"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user IDs
    cursor.execute("SELECT id FROM users WHERE username = ?", (sender_username,))
    sender = cursor.fetchone()
    cursor.execute("SELECT id FROM users WHERE username = ?", (receiver_username,))
    receiver = cursor.fetchone()
    
    if not sender:
        return jsonify({"message": "Sender not found"}), 404
    if not receiver:
        return jsonify({"message": "Receiver not found"}), 404
    
    sender_id = sender[0]
    receiver_id = receiver[0]
    
    # Get current timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Save the message with initial status as 'sent'
    cursor.execute('''
        INSERT INTO messages (sender_id, receiver_id, message, time, status, is_edited)
        VALUES (?, ?, ?, ?, 'sent', 0)
    ''', (sender_id, receiver_id, message_text, timestamp))
    
    message_id = cursor.lastrowid
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({
        "message": "Message sent successfully",
        "message_id": message_id
    }), 200

@bp.route('/get_messages', methods=['GET'])
def get_messages():
    user1_username = request.args.get('user1')
    user2_username = request.args.get('user2')
    
    if not user1_username or not user2_username:
        return jsonify({"message": "Both usernames are required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user IDs
    cursor.execute("SELECT id FROM users WHERE username = ?", (user1_username,))
    user1 = cursor.fetchone()
    cursor.execute("SELECT id FROM users WHERE username = ?", (user2_username,))
    user2 = cursor.fetchone()
    
    if not user1:
        return jsonify({"message": f"User {user1_username} not found"}), 404
    if not user2:
        return jsonify({"message": f"User {user2_username} not found"}), 404
    
    user1_id = user1[0]
    user2_id = user2[0]
    
    # Get messages between the two users
    cursor.execute('''
        SELECT m.id, sender.username as sender, receiver.username as receiver, m.message, m.time
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.time ASC
    ''', (user1_id, user2_id, user2_id, user1_id))
    
    messages = []
    for row in cursor.fetchall():
        messages.append({
            "id": row[0],
            "sender": row[1],
            "receiver": row[2],
            "message": row[3],
            "time": row[4]
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({"messages": messages}), 200

@bp.route('/send_group_message', methods=['POST'])
def send_group_message():
    data = request.get_json()
    sender_username = data.get('sender_username')
    group_id = data.get('group_id')
    message_text = data.get('message')
    
    if not sender_username or not group_id or not message_text:
        return jsonify({"message": "Sender username, group ID, and message are required!"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get sender ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (sender_username,))
    sender = cursor.fetchone()
    
    if not sender:
        return jsonify({"message": "Sender not found"}), 404
    
    sender_id = sender[0]
    
    # Check if group exists
    cursor.execute("SELECT id FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()
    
    if not group:
        return jsonify({"message": "Group not found"}), 404
    
    # Check if sender is a member of the group
    cursor.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, sender_id))
    membership = cursor.fetchone()
    
    if not membership:
        return jsonify({"message": "Sender is not a member of this group"}), 403
    
    # Get current timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Save the group message with is_edited flag
    cursor.execute('''
        INSERT INTO group_messages (group_id, sender_id, message, time, is_edited)
        VALUES (?, ?, ?, ?, 0)
    ''', (group_id, sender_id, message_text, timestamp))
    
    message_id = cursor.lastrowid
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({
        "message": "Group message sent successfully",
        "message_id": message_id
    }), 200

@bp.route('/get_group_messages', methods=['GET'])
def get_group_messages():
    group_id = request.args.get('group_id')
    username = request.args.get('username')
    
    if not group_id or not username:
        return jsonify({"message": "Group ID and username are required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    user_id = user[0]
    
    # Check if group exists
    cursor.execute("SELECT id FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()
    
    if not group:
        return jsonify({"message": "Group not found"}), 404
    
    # Check if user is a member of the group
    cursor.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, user_id))
    membership = cursor.fetchone()
    
    if not membership:
        return jsonify({"message": "User is not a member of this group"}), 403
    
    # Get group messages
    cursor.execute('''
        SELECT gm.id, u.username as sender, gm.message, gm.time
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.time ASC
    ''', (group_id,))
    
    messages = []
    for row in cursor.fetchall():
        messages.append({
            "id": row[0],
            "sender": row[1],
            "message": row[2],
            "time": row[3]
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({"messages": messages}), 200

@bp.route('/get_user_groups', methods=['GET'])
def get_user_groups():
    username = request.args.get('username')
    
    if not username:
        return jsonify({"message": "Username is required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    user_id = user[0]
    
    # Get all groups the user is a member of
    cursor.execute('''
        SELECT g.id, g.group_name, (g.admin_id = ?) as is_admin
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
    ''', (user_id, user_id))
    
    groups = []
    for row in cursor.fetchall():
        groups.append({
            "id": row[0],
            "name": row[1],
            "is_admin": bool(row[2])
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({"groups": groups}), 200

@bp.route('/send_image_message', methods=['POST'])
def send_image_message():
    if 'image' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    sender_username = request.form.get('sender_username')
    receiver_username = request.form.get('receiver_username')
    image = request.files['image']
    
    if image.filename == '':
        return jsonify({"message": "No selected file"}), 400
        
    if not sender_username or not receiver_username:
        return jsonify({"message": "Sender username and receiver username are required!"}), 400
    
    if image and allowed_file(image.filename):
        # Create directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER_DIRECT, exist_ok=True)
        
        # Save the file securely with a unique name
        filename = secure_filename(f"{sender_username}_{receiver_username}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}")
        file_path = os.path.join(UPLOAD_FOLDER_DIRECT, filename)
        image.save(file_path)
        
        conn = connect_db()
        cursor = conn.cursor()
        
        # Get user IDs
        cursor.execute("SELECT id FROM users WHERE username = ?", (sender_username,))
        sender = cursor.fetchone()
        cursor.execute("SELECT id FROM users WHERE username = ?", (receiver_username,))
        receiver = cursor.fetchone()
        
        if not sender:
            return jsonify({"message": "Sender not found"}), 404
        if not receiver:
            return jsonify({"message": "Receiver not found"}), 404
        
        sender_id = sender[0]
        receiver_id = receiver[0]
        
        # Get current timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Save the message with image path
        message_text = f"[IMAGE:{filename}]"
        cursor.execute('''
            INSERT INTO messages (sender_id, receiver_id, message, time)
            VALUES (?, ?, ?, ?)
        ''', (sender_id, receiver_id, message_text, timestamp))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Image sent successfully",
            "image_url": f"/uploads/direct_images/{filename}"
        }), 200
    
    return jsonify({"message": "Invalid file type. Only images are allowed."}), 400

@bp.route('/send_group_image', methods=['POST'])
def send_group_image():
    if 'image' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    sender_username = request.form.get('sender_username')
    group_id = request.form.get('group_id')
    image = request.files['image']
    
    if image.filename == '':
        return jsonify({"message": "No selected file"}), 400
        
    if not sender_username or not group_id:
        return jsonify({"message": "Sender username and group ID are required!"}), 400
    
    if image and allowed_file(image.filename):
        # Create directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER_GROUP, exist_ok=True)
        
        # Save the file securely with a unique name
        filename = secure_filename(f"group_{group_id}_{sender_username}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}")
        file_path = os.path.join(UPLOAD_FOLDER_GROUP, filename)
        image.save(file_path)
        
        conn = connect_db()
        cursor = conn.cursor()
        
        # Get sender ID
        cursor.execute("SELECT id FROM users WHERE username = ?", (sender_username,))
        sender = cursor.fetchone()
        
        if not sender:
            return jsonify({"message": "Sender not found"}), 404
        
        sender_id = sender[0]
        
        # Check if group exists
        cursor.execute("SELECT id FROM groups WHERE id = ?", (group_id,))
        group = cursor.fetchone()
        
        if not group:
            return jsonify({"message": "Group not found"}), 404
        
        # Check if sender is a member of the group
        cursor.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, sender_id))
        membership = cursor.fetchone()
        
        if not membership:
            return jsonify({"message": "Sender is not a member of this group"}), 403
        
        # Get current timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Save the group message with image path
        message_text = f"[IMAGE:{filename}]"
        cursor.execute('''
            INSERT INTO group_messages (group_id, sender_id, message, time)
            VALUES (?, ?, ?, ?)
        ''', (group_id, sender_id, message_text, timestamp))
        
        # Also save to group_sended_photos table for easy retrieval
        cursor.execute('''
            INSERT INTO group_sended_photos (group_id, sender_id, photo)
            VALUES (?, ?, ?)
        ''', (group_id, sender_id, filename))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Image sent successfully to group",
            "image_url": f"/uploads/group_images/{filename}"
        }), 200
    
    return jsonify({"message": "Invalid file type. Only images are allowed."}), 400

@bp.route('/get_direct_images', methods=['GET'])
def get_direct_images():
    user1_username = request.args.get('user1')
    user2_username = request.args.get('user2')
    
    if not user1_username or not user2_username:
        return jsonify({"message": "Both usernames are required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user IDs
    cursor.execute("SELECT id FROM users WHERE username = ?", (user1_username,))
    user1 = cursor.fetchone()
    cursor.execute("SELECT id FROM users WHERE username = ?", (user2_username,))
    user2 = cursor.fetchone()
    
    if not user1:
        return jsonify({"message": f"User {user1_username} not found"}), 404
    if not user2:
        return jsonify({"message": f"User {user2_username} not found"}), 404
    
    user1_id = user1[0]
    user2_id = user2[0]
    
    # Get messages that contain images between the two users
    cursor.execute('''
        SELECT m.id, sender.username as sender, receiver.username as receiver, m.message, m.time
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
        AND m.message LIKE '[IMAGE:%]'
        ORDER BY m.time ASC
    ''', (user1_id, user2_id, user2_id, user1_id))
    
    images = []
    for row in cursor.fetchall():
        # Extract filename from [IMAGE:filename] format
        filename = row[3].replace('[IMAGE:', '').replace(']', '')
        images.append({
            "id": row[0],
            "sender": row[1],
            "receiver": row[2],
            "image_url": f"/uploads/direct_images/{filename}",
            "time": row[4]
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({"images": images}), 200

@bp.route('/get_group_images', methods=['GET'])
def get_group_images():
    group_id = request.args.get('group_id')
    username = request.args.get('username')
    
    if not group_id or not username:
        return jsonify({"message": "Group ID and username are required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    user_id = user[0]
    
    # Check if group exists
    cursor.execute("SELECT id FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()
    
    if not group:
        return jsonify({"message": "Group not found"}), 404
    
    # Check if user is a member of the group
    cursor.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, user_id))
    membership = cursor.fetchone()
    
    if not membership:
        return jsonify({"message": "User is not a member of this group"}), 403
    
    # Get group images
    cursor.execute('''
        SELECT gp.id, u.username as sender, gp.photo, gm.time
        FROM group_sended_photos gp
        JOIN users u ON gp.sender_id = u.id
        JOIN group_messages gm ON gm.group_id = gp.group_id AND gm.sender_id = gp.sender_id AND gm.message LIKE '[IMAGE:%' || gp.photo || '%]'
        WHERE gp.group_id = ?
        ORDER BY gm.time ASC
    ''', (group_id,))
    
    images = []
    for row in cursor.fetchall():
        images.append({
            "id": row[0],
            "sender": row[1],
            "image_url": f"/uploads/group_images/{row[2]}",
            "time": row[3]
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({"images": images}), 200

# Serve uploaded images
@bp.route('/uploads/direct_images/<filename>')
def serve_direct_image(filename):
    return send_from_directory(UPLOAD_FOLDER_DIRECT, filename)

@bp.route('/uploads/group_images/<filename>')
def serve_group_image(filename):
    return send_from_directory(UPLOAD_FOLDER_GROUP, filename)

@bp.route('/edit_message', methods=['POST'])
def edit_message():
    data = request.get_json()
    message_id = data.get('message_id')
    username = data.get('username')
    new_message_text = data.get('new_message')
    
    if not message_id or not username or not new_message_text:
        return jsonify({"message": "Message ID, username, and new message text are required!"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message
    cursor.execute('''
        SELECT m.id, m.sender_id, u.username, m.message 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Check if user is the sender of the message
    if message[2] != username:
        return jsonify({"message": "You can only edit your own messages"}), 403
    
    # Check if the message is an image message
    if message[3].startswith('[IMAGE:'):
        return jsonify({"message": "Cannot edit image messages"}), 400
    
    # Update the message
    cursor.execute('''
        UPDATE messages 
        SET message = ?, is_edited = 1
        WHERE id = ?
    ''', (new_message_text, message_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Message edited successfully"}), 200

@bp.route('/edit_group_message', methods=['POST'])
def edit_group_message():
    data = request.get_json()
    message_id = data.get('message_id')
    username = data.get('username')
    new_message_text = data.get('new_message')
    
    if not message_id or not username or not new_message_text:
        return jsonify({"message": "Message ID, username, and new message text are required!"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message
    cursor.execute('''
        SELECT gm.id, gm.sender_id, u.username, gm.message 
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.id
        WHERE gm.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Check if user is the sender of the message
    if message[2] != username:
        return jsonify({"message": "You can only edit your own messages"}), 403
    
    # Check if the message is an image message
    if message[3].startswith('[IMAGE:'):
        return jsonify({"message": "Cannot edit image messages"}), 400
    
    # Update the message
    cursor.execute('''
        UPDATE group_messages 
        SET message = ?, is_edited = 1
        WHERE id = ?
    ''', (new_message_text, message_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Group message edited successfully"}), 200

@bp.route('/delete_message', methods=['POST'])
def delete_message():
    data = request.get_json()
    message_id = data.get('message_id')
    username = data.get('username')
    
    if not message_id or not username:
        return jsonify({"message": "Message ID and username are required!"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message
    cursor.execute('''
        SELECT m.id, m.sender_id, u.username, m.message 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Check if user is the sender of the message
    if message[2] != username:
        return jsonify({"message": "You can only delete your own messages"}), 403
    
    # If it's an image message, delete the image file
    if message[3].startswith('[IMAGE:'):
        filename = message[3].replace('[IMAGE:', '').replace(']', '')
        file_path = os.path.join(UPLOAD_FOLDER_DIRECT, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # Delete the message
    cursor.execute('DELETE FROM messages WHERE id = ?', (message_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Message deleted successfully"}), 200

@bp.route('/delete_group_message', methods=['POST'])
def delete_group_message():
    data = request.get_json()
    message_id = data.get('message_id')
    username = data.get('username')
    
    if not message_id or not username:
        return jsonify({"message": "Message ID and username are required!"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message and check if user is admin or sender
    cursor.execute('''
        SELECT gm.id, gm.sender_id, u.username, gm.message, gm.group_id, g.admin_id 
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.id
        JOIN groups g ON gm.group_id = g.id
        WHERE gm.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Get the user ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Check if user is the sender of the message or admin of the group
    is_sender = message[2] == username
    is_admin = user[0] == message[5]
    
    if not (is_sender or is_admin):
        return jsonify({"message": "You can only delete your own messages or messages in groups you admin"}), 403
    
    # If it's an image message, delete the image file
    if message[3].startswith('[IMAGE:'):
        filename = message[3].replace('[IMAGE:', '').replace(']', '')
        file_path = os.path.join(UPLOAD_FOLDER_GROUP, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Also delete from group_sended_photos
        cursor.execute('DELETE FROM group_sended_photos WHERE group_id = ? AND sender_id = ? AND photo = ?', 
                       (message[4], message[1], filename))
    
    # Delete the message
    cursor.execute('DELETE FROM group_messages WHERE id = ?', (message_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Group message deleted successfully"}), 200

# Now let's add message delivery status functionality
@bp.route('/update_message_status', methods=['POST'])
def update_message_status():
    data = request.get_json()
    message_id = data.get('message_id')
    status = data.get('status')  # "delivered" or "read"
    username = data.get('username')  # Username of the receiver
    
    if not message_id or not status or not username:
        return jsonify({"message": "Message ID, status, and username are required!"}), 400
    
    if status not in ['delivered', 'read']:
        return jsonify({"message": "Status must be 'delivered' or 'read'"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message
    cursor.execute('''
        SELECT m.id, m.receiver_id, u.username
        FROM messages m
        JOIN users u ON m.receiver_id = u.id
        WHERE m.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Check if user is the receiver of the message
    if message[2] != username:
        return jsonify({"message": "You can only update status for messages you received"}), 403
    
    # Update the status based on progression (never decrease status level)
    if status == 'delivered':
        cursor.execute('''
            UPDATE messages 
            SET status = 'delivered', delivered_at = ?
            WHERE id = ? AND (status IS NULL OR status = 'sent')
        ''', (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), message_id))
    else:  # status == 'read'
        cursor.execute('''
            UPDATE messages 
            SET status = 'read', read_at = ?
            WHERE id = ? AND status IS NOT 'read'
        ''', (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), message_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": f"Message status updated to {status}"}), 200

@bp.route('/update_group_message_status', methods=['POST'])
def update_group_message_status():
    data = request.get_json()
    message_id = data.get('message_id')
    status = data.get('status')  # "delivered" or "read"
    username = data.get('username')  # Username of the reader/group member
    
    if not message_id or not status or not username:
        return jsonify({"message": "Message ID, status, and username are required!"}), 400
    
    if status not in ['delivered', 'read']:
        return jsonify({"message": "Status must be 'delivered' or 'read'"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get user ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    user_id = user[0]
    
    # Get the message and check if user is a member of the group
    cursor.execute('''
        SELECT gm.id, gm.group_id, gm.sender_id
        FROM group_messages gm
        WHERE gm.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Check if user is a member of the group
    cursor.execute('''
        SELECT id 
        FROM group_members 
        WHERE group_id = ? AND user_id = ?
    ''', (message[1], user_id))
    
    membership = cursor.fetchone()
    
    if not membership:
        return jsonify({"message": "You must be a member of the group to update message status"}), 403
    
    # Don't update status for your own messages
    if message[2] == user_id:
        return jsonify({"message": "No need to update status for your own messages"}), 400
    
    # Check if status record already exists
    cursor.execute('''
        SELECT id, status 
        FROM group_message_status 
        WHERE message_id = ? AND user_id = ?
    ''', (message_id, user_id))
    
    status_record = cursor.fetchone()
    
    # Update or insert the status
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if status_record:
        # Only update if new status is higher than current
        if (status_record[1] == 'delivered' and status == 'read') or status_record[1] is None:
            if status == 'delivered':
                cursor.execute('''
                    UPDATE group_message_status 
                    SET status = 'delivered', delivered_at = ?
                    WHERE id = ?
                ''', (timestamp, status_record[0]))
            else:  # status == 'read'
                cursor.execute('''
                    UPDATE group_message_status 
                    SET status = 'read', read_at = ?
                    WHERE id = ?
                ''', (timestamp, status_record[0]))
    else:
        # Insert new status record
        if status == 'delivered':
            cursor.execute('''
                INSERT INTO group_message_status (message_id, user_id, status, delivered_at)
                VALUES (?, ?, 'delivered', ?)
            ''', (message_id, user_id, timestamp))
        else:  # status == 'read'
            cursor.execute('''
                INSERT INTO group_message_status (message_id, user_id, status, delivered_at, read_at)
                VALUES (?, ?, 'read', ?, ?)
            ''', (message_id, user_id, timestamp, timestamp))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": f"Group message status updated to {status}"}), 200

@bp.route('/get_message_status', methods=['GET'])
def get_message_status():
    message_id = request.args.get('message_id')
    
    if not message_id:
        return jsonify({"message": "Message ID is required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message status
    cursor.execute('''
        SELECT m.id, m.status, m.delivered_at, m.read_at, 
               sender.username as sender, receiver.username as receiver
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE m.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    status_info = {
        "id": message[0],
        "status": message[1] or "sent",
        "delivered_at": message[2],
        "read_at": message[3],
        "sender": message[4],
        "receiver": message[5]
    }
    
    cursor.close()
    conn.close()
    
    return jsonify({"status": status_info}), 200

@bp.route('/get_group_message_status', methods=['GET'])
def get_group_message_status():
    message_id = request.args.get('message_id')
    
    if not message_id:
        return jsonify({"message": "Message ID is required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get the message
    cursor.execute('''
        SELECT gm.id, u.username as sender, g.group_name
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.id
        JOIN groups g ON gm.group_id = g.id
        WHERE gm.id = ?
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    # Get the status for all group members
    cursor.execute('''
        SELECT u.username, gms.status, gms.delivered_at, gms.read_at
        FROM group_message_status gms
        JOIN users u ON gms.user_id = u.id
        WHERE gms.message_id = ?
    ''', (message_id,))
    
    statuses = []
    for row in cursor.fetchall():
        statuses.append({
            "username": row[0],
            "status": row[1] or "sent",
            "delivered_at": row[2],
            "read_at": row[3]
        })
    
    # Also get members who haven't seen the message yet
    cursor.execute('''
        SELECT u.username
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        JOIN group_messages msg ON msg.group_id = gm.group_id
        LEFT JOIN group_message_status gms ON gms.message_id = msg.id AND gms.user_id = gm.user_id
        WHERE msg.id = ? AND gms.id IS NULL AND gm.user_id != msg.sender_id
    ''', (message_id,))
    
    for row in cursor.fetchall():
        statuses.append({
            "username": row[0],
            "status": "sent",
            "delivered_at": None,
            "read_at": None
        })
    
    result = {
        "id": message[0],
        "sender": message[1],
        "group_name": message[2],
        "member_statuses": statuses
    }
    
    cursor.close()
    conn.close()
    
    return jsonify({"status": result}), 200

@bp.route('/api/potential-contacts', methods=['GET'])
def api_potential_contacts():
    # Get the current user ID from the session
    from flask import session
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({"message": "Not authenticated", "users": []}), 401

    # Get search query if provided
    query = request.args.get('query', '')
    search_condition = ''
    search_params = [user_id, user_id]
    
    conn = connect_db()
    cursor = conn.cursor()

    try:
        # If search query provided, add condition to filter by it
        if query and len(query) >= 2:
            search_param = f"%{query}%"
            search_condition = "AND (username LIKE ? OR email LIKE ? OR name LIKE ?)"
            search_params.extend([search_param, search_param, search_param])
        
        # Get all users except the current user and those already in contacts
        sql_query = f'''
            SELECT id, username, email, name, profile_picture FROM users 
            WHERE id != ? AND id NOT IN (
                SELECT contact_id FROM contacts WHERE user_id = ?
            ) {search_condition}
            LIMIT 20
        '''
        
        cursor.execute(sql_query, search_params)
        
        user_rows = cursor.fetchall()
        
        # Format users
        users = []
        for row in user_rows:
            user_id, username, email, name, profile_picture = row
            
            avatar = f"/uploads/profile_photos/{profile_picture}" if profile_picture else "/static/images/contact_logo.png"
            
            users.append({
                "id": user_id,
                "username": username,
                "email": email,
                "name": name or username,
                "avatar": avatar
            })
        
        return jsonify({"users": users}), 200
    
    except Exception as e:
        return jsonify({"error": str(e), "users": []}), 500
    
    finally:
        conn.close()

@bp.route('/api/add-contact', methods=['POST'])
def api_add_contact():
    # Get the current user ID from the session
    from flask import session
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "Not authenticated"}), 401
    
    data = request.get_json()
    contact_id = data.get('contact_id')
    display_name = data.get('display_name')
    
    if not contact_id:
        return jsonify({"success": False, "message": "Contact ID is required"}), 400
    
    # Convert to int if it's a string
    try:
        contact_id = int(contact_id)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid contact ID"}), 400
    
    # Don't allow adding yourself
    if int(user_id) == contact_id:
        return jsonify({"success": False, "message": "Cannot add yourself as a contact"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Check if the contact exists
    cursor.execute("SELECT * FROM users WHERE id = ?", (contact_id,))
    contact = cursor.fetchone()
    
    if not contact:
        conn.close()
        return jsonify({"success": False, "message": "Contact not found"}), 404
    
    # Check if already a contact
    cursor.execute('''
        SELECT * FROM contacts 
        WHERE user_id = ? AND contact_id = ?
    ''', (user_id, contact_id))
    
    existing = cursor.fetchone()
    
    if existing:
        conn.close()
        return jsonify({"success": False, "message": "Already a contact"}), 400
    
    # Add the contact
    try:
        # Use provided display_name or username as fallback
        if not display_name:
            cursor.execute("SELECT username FROM users WHERE id = ?", (contact_id,))
            username_row = cursor.fetchone()
            display_name = username_row[0] if username_row else "Unknown"
        
        cursor.execute('''
            INSERT INTO contacts (user_id, contact_id, display_name) 
            VALUES (?, ?, ?)
        ''', (user_id, contact_id, display_name))
        
        # Also add the reverse relationship (bi-directional contacts)
        # Use the username of the current user as the display name for the reverse contact
        cursor.execute("SELECT username FROM users WHERE id = ?", (user_id,))
        current_username = cursor.fetchone()[0]
        
        cursor.execute('''
            INSERT INTO contacts (user_id, contact_id, display_name) 
            VALUES (?, ?, ?)
        ''', (contact_id, user_id, current_username))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Contact added successfully"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success": False, "message": f"Error adding contact: {str(e)}"}), 500

@bp.route('/api/contacts', methods=['GET'])
def api_contacts():
    from flask import session
    # Get the current user ID from the session
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    conn = connect_db()
    cursor = conn.cursor()

    try:
        # Get user's contacts
        cursor.execute('''
            SELECT c.contact_id, u.username, u.email, u.profile_picture, c.display_name
            FROM contacts c
            JOIN users u ON c.contact_id = u.id
            WHERE c.user_id = ?
        ''', (user_id,))
        
        contacts_data = cursor.fetchall()
        
        # Process the contacts data
        contacts = []
        for contact in contacts_data:
            contact_id, username, email, profile_picture, display_name = contact
            
            # Check for the latest message between users (if any)
            cursor.execute('''
                SELECT message, time 
                FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                ORDER BY time DESC
                LIMIT 1
            ''', (user_id, contact_id, contact_id, user_id))
            
            last_message_data = cursor.fetchone()
            last_message = None
            last_message_time = None
            
            if last_message_data:
                last_message = last_message_data[0]
                last_message_time = last_message_data[1]
            
            # Check for unread messages
            cursor.execute('''
                SELECT COUNT(*) 
                FROM messages 
                WHERE sender_id = ? AND receiver_id = ? AND status = 'delivered'
            ''', (contact_id, user_id))
            
            unread_count = cursor.fetchone()[0]
            
            # Use actual profile picture or default
            avatar_url = f'/uploads/profile_photos/{profile_picture}' if profile_picture else '/static/images/contact_logo.png'
            
            contacts.append({
                'id': contact_id,
                'username': username,
                'name': display_name or username,  # Use display_name if available, otherwise username
                'email': email,
                'is_group': False,
                'avatar_url': avatar_url,
                'last_message': last_message,
                'last_message_time': last_message_time,
                'unread_count': unread_count
            })
        
        # Also get user's groups
        cursor.execute('''
            SELECT g.id, g.group_name, g.group_picture
            FROM group_members gm
            JOIN groups g ON gm.group_id = g.id
            WHERE gm.user_id = ?
        ''', (user_id,))
        
        groups_data = cursor.fetchall()
        
        # Process the groups data
        for group in groups_data:
            group_id, group_name, group_picture = group
            
            # Check for the latest message in the group (if any)
            cursor.execute('''
                SELECT gm.message, gm.time, u.username
                FROM group_messages gm
                JOIN users u ON gm.sender_id = u.id
                WHERE gm.group_id = ?
                ORDER BY gm.time DESC
                LIMIT 1
            ''', (group_id,))
            
            last_message_data = cursor.fetchone()
            last_message = None
            last_message_time = None
            
            if last_message_data:
                last_message = f"{last_message_data[2]}: {last_message_data[0]}"
                last_message_time = last_message_data[1]
            
            # Check for unread messages in the group for this user
            cursor.execute('''
                SELECT COUNT(*) 
                FROM group_messages gm
                LEFT JOIN group_message_status gms ON gm.id = gms.message_id AND gms.user_id = ?
                WHERE gm.group_id = ? AND (gms.status = 'delivered' OR gms.status IS NULL)
                AND gm.sender_id != ?
            ''', (user_id, group_id, user_id))
            
            unread_count = cursor.fetchone()[0]
            
            # Use actual group picture or default
            avatar_url = f'/uploads/group_images/{group_picture}' if group_picture else '/static/images/group_icon.png'
            
            contacts.append({
                'id': group_id,
                'name': group_name,
                'is_group': True,
                'avatar_url': avatar_url,
                'last_message': last_message,
                'last_message_time': last_message_time,
                'unread_count': unread_count
            })
        
        return jsonify(contacts), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        conn.close()

@bp.route('/api/search-users', methods=['GET'])
def api_search_users():
    """Search for users by username or email"""
    from flask import session
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({"message": "Not authenticated", "users": []}), 401
    
    # Get the search query
    query = request.args.get('query', '')
    if not query or len(query) < 2:
        return jsonify({"message": "Search query too short", "users": []}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Search users by username or email
        search_param = f"%{query}%"
        cursor.execute('''
            SELECT id, username, email, name, profile_picture FROM users 
            WHERE (username LIKE ? OR email LIKE ? OR name LIKE ?) 
            AND id != ? 
            AND id NOT IN (
                SELECT contact_id FROM contacts WHERE user_id = ?
            )
        ''', (search_param, search_param, search_param, user_id, user_id))
        
        user_rows = cursor.fetchall()
        
        # Format users
        users = []
        for row in user_rows:
            user_id, username, email, name, profile_picture = row
            
            avatar = f"/uploads/profile_photos/{profile_picture}" if profile_picture else "/static/images/contact_logo.png"
            
            users.append({
                "id": user_id,
                "username": username,
                "email": email,
                "name": name,
                "avatar": avatar
            })
        
        return jsonify({"users": users}), 200
    
    except Exception as e:
        return jsonify({"error": str(e), "users": []}), 500
    
    finally:
        conn.close()

@bp.route('/api/update-contact-name', methods=['POST'])
def api_update_contact_name():
    """Update the display name of a contact"""
    from flask import session
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "Not authenticated"}), 401
    
    data = request.get_json()
    contact_id = data.get('contact_id')
    display_name = data.get('display_name')
    
    if not contact_id or not display_name:
        return jsonify({"success": False, "message": "Contact ID and display name are required"}), 400
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Check if the contact exists
        cursor.execute("SELECT * FROM contacts WHERE user_id = ? AND contact_id = ?", (user_id, contact_id))
        contact = cursor.fetchone()
        
        if not contact:
            return jsonify({"success": False, "message": "Contact not found"}), 404
        
        # Update the contact's display name in the users table
        cursor.execute('''
            UPDATE contacts 
            SET display_name = ? 
            WHERE user_id = ? AND contact_id = ?
        ''', (display_name, user_id, contact_id))
        
        conn.commit()
        
        return jsonify({"success": True, "message": "Contact name updated successfully"}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"Error updating contact name: {str(e)}"}), 500
    
    finally:
        conn.close()
        