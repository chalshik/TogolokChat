from flask import Flask, render_template, redirect, url_for, session
import os
from datetime import timedelta
from flask_socketio import SocketIO, emit, join_room, leave_room

# Import blueprints
from Backend.auth import bp as auth_bp, is_authenticated
from Backend.chat import bp as chat_bp
from Backend.settings import bp as settings_bp

# Initialize database
from Backend.db import create_tables

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
app.register_blueprint(settings_bp)

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

# Serve sidebar templates
@app.route('/templates/_sidebar_<filename>.html')
def serve_sidebar_template(filename):
    print(f"Serving sidebar template: _sidebar_{filename}.html")
    try:
        template = render_template(f'_sidebar_{filename}.html')
        return template
    except Exception as e:
        print(f"Error serving template: {str(e)}")
        return f"Template not found: _sidebar_{filename}.html", 404

# Serve static files from the uploads directory
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return app.send_static_file(f'uploads/{filename}')

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