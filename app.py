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
    if room:
        join_room(room)
        print(f'Client joined room: {room}')
        emit('status', {'message': f'A user has joined the room {room}'}, room=room)

@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    if room:
        leave_room(room)
        print(f'Client left room: {room}')

@socketio.on('send_message')
def handle_message(data):
    sender_id = session.get('user_id')
    receiver_id = data.get('receiver_id')
    message = data.get('message')
    group_id = data.get('group_id')
    
    if not sender_id:
        return {'status': 'error', 'message': 'Not authenticated'}
    
    if not message:
        return {'status': 'error', 'message': 'No message provided'}
    
    try:
        # Handle different types of messages
        if group_id:
            # Group message
            room = f'group_{group_id}'
            # Store message in database
            # This is handled by the existing endpoint
            emit('new_message', {
                'sender_id': sender_id,
                'message': message,
                'group_id': group_id,
                'timestamp': data.get('timestamp', '')
            }, room=room)
            return {'status': 'success', 'message': 'Group message sent'}
        
        elif receiver_id:
            # Direct message
            # Store message in database
            # This is handled by the existing endpoint
            emit('new_message', {
                'sender_id': sender_id,
                'message': message,
                'timestamp': data.get('timestamp', '')
            }, room=str(receiver_id)) # Send to receiver's room
            
            # Also notify the sender for UI update confirmation
            emit('message_sent', {
                'receiver_id': receiver_id,
                'message': message,
                'timestamp': data.get('timestamp', '')
            }, room=str(sender_id))
            
            return {'status': 'success', 'message': 'Direct message sent'}
        
        else:
            return {'status': 'error', 'message': 'No receiver or group specified'}
    
    except Exception as e:
        print(f'Error sending message: {str(e)}')
        return {'status': 'error', 'message': str(e)}

if __name__ == '__main__':
    app.debug = True  # Enable debug mode
    app.config['TEMPLATES_AUTO_RELOAD'] = True  # Enable template auto-reloading
    socketio.run(app, debug=True) 