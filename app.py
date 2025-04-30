from flask import Flask, render_template, redirect, url_for, session, send_from_directory, request, jsonify 
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import timedelta, datetime
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename

# Import utilities
from Backend.utils import (
    allowed_file, get_file_size, 
    UPLOAD_FOLDER, PROFILE_PHOTOS_FOLDER, 
    DIRECT_IMAGES_FOLDER, GROUP_IMAGES_FOLDER,
    ALLOWED_EXTENSIONS, MAX_CONTENT_LENGTH
)

# Import blueprints
from Backend.auth import bp as auth_bp, is_authenticated
from Backend.chat import bp as chat_bp
from Backend.settings import bp as settings_bp
from Backend.user import bp as user_bp

# Initialize database
from Backend.db import create_tables, connect_db

# Create Flask app
app = Flask(__name__, 
           template_folder='Backend/templates',
           static_folder='Backend/static')
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_togolok_chat')  # Set secret key for sessions
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)  # Maximum session lifetime for remember me

# Configure logging
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)  # Create logs directory if it doesn't exist

# Configure logging to file
handler = RotatingFileHandler(
    os.path.join(LOG_DIR, 'app.log'),
    maxBytes=10485760,  # 10MB
    backupCount=5  # Keep 5 backup logs
)
handler.setLevel(logging.INFO)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
app.logger.info('TogolokChat startup')

# File upload configuration - use values from utils
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Initialize SocketIO with explicit configuration
socketio = SocketIO(app, 
                   cors_allowed_origins="*", 
                   async_mode='threading',
                   logger=True, 
                   engineio_logger=True)

# Add this to app.py after creating the socketio instance
from Backend.chat import register_socket_events

# Register socket events from chat blueprint
register_socket_events(socketio)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(chat_bp)  # No url_prefix as it's already defined in the blueprint
app.register_blueprint(settings_bp)
app.register_blueprint(user_bp)  # Register the user blueprint

# Create required directories if they don't exist
os.makedirs(PROFILE_PHOTOS_FOLDER, exist_ok=True)
os.makedirs(DIRECT_IMAGES_FOLDER, exist_ok=True)
os.makedirs(GROUP_IMAGES_FOLDER, exist_ok=True)

# Ensure database tables exist
create_tables()

# Serve favicon.ico to prevent 404 errors
@app.route('/favicon.ico')
def favicon():
    return '', 204  # Return no content

# Serve the main application
@app.route('/')
def index():
    if is_authenticated():
        app.logger.info(f"User {session.get('username')} accessing chat")
        return render_template('chat.html')  # Render chat.html directly
    app.logger.info("Anonymous user accessing login page")
    return render_template('index.html')

# File upload handling
@app.route('/chat/send_file', methods=['POST'])
def handle_file_upload():
    """Handle file uploads from the chat."""
    if 'file' not in request.files:
        app.logger.warning("File upload attempted without a file")
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        app.logger.warning("File upload attempted with empty filename")
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        app.logger.warning(f"File upload attempted with disallowed file type: {file.filename}")
        return jsonify({'success': False, 'message': 'File type not allowed'}), 400
    
    try:
        # Secure the filename and generate a unique name
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save the file
        file.save(filepath)
        file_size = get_file_size(filepath)
        app.logger.info(f"File uploaded: {unique_filename} ({file_size} bytes)")
        
        # Get additional message data
        message = request.form.get('message', '')
        timestamp = request.form.get('timestamp')
        message_id = request.form.get('message_id')
        
        # Determine if it's a group or direct message
        group_id = request.form.get('group_id')
        receiver_id = request.form.get('receiver_id')
        
        # Create file info for the response
        file_info = {
            'name': filename,
            'url': f'/uploads/{unique_filename}',
            'size': file_size
        }
        
        # Prepare message data
        message_data = {
            'success': True,
            'message_id': message_id,
            'timestamp': timestamp,
            'file_info': file_info,
            'message': message,
            'display_message': f'📎 {filename}' + (f': {message}' if message else ''),
            'sender_id': request.form.get('sender_id'),
            'sender_username': request.form.get('sender_username')
        }
        
        if group_id:
            message_data['group_id'] = group_id
            message_data['chat_type'] = 'group'
            # Emit to group room
            socketio.emit('new_message', message_data, room=f'group_{group_id}')
            app.logger.info(f"Group file message sent to group {group_id}")
        else:
            message_data['receiver_id'] = receiver_id
            message_data['chat_type'] = 'direct'
            # Emit to sender and receiver rooms
            socketio.emit('new_message', message_data, room=f'user_{receiver_id}')
            socketio.emit('new_message', message_data, room=f'user_{request.form.get("sender_id")}')
            app.logger.info(f"Direct file message sent from {request.form.get('sender_id')} to {receiver_id}")
        
        return jsonify(message_data)
        
    except Exception as e:
        app.logger.error(f"Error handling file upload: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': 'Error processing file upload'}), 500

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
            return send_from_directory(PROFILE_PHOTOS_FOLDER, base_filename)
        elif 'direct_images' in filename:
            return send_from_directory(DIRECT_IMAGES_FOLDER, base_filename)
        elif 'group_images' in filename:
            return send_from_directory(GROUP_IMAGES_FOLDER, base_filename)
        else:
            app.logger.warning(f"File not found: {filename}")
            return f"File not found: {filename}", 404

# Remove redundant routes that are already covered by settings.py and remove duplicate routes
# Keep only route for serving placeholder images

# Serve placeholder images for profile pictures
@app.route('/api/placeholder/<int:width>/<int:height>')
def serve_placeholder(width, height):
    app.logger.debug(f"Serving placeholder image: {width}x{height}")
    # Create a simple svg placeholder with the requested dimensions
    svg = f'''
    <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#2a3942"/>
        <circle cx="{width/2}" cy="{height/3}" r="{min(width, height)/4}" fill="#8696a0"/>
        <circle cx="{width/2}" cy="{height*0.8}" r="{min(width, height)/2.5}" fill="#8696a0"/>
    </svg>
    '''
    response = app.response_class(
        response=svg,
        status=200,
        mimetype='image/svg+xml'
    )
    return response

# Serve static images from Backend/static/images directory
@app.route('/static/images/<path:filename>')
def serve_static_images(filename):
    app.logger.debug(f"Serving static image: {filename}")
    return send_from_directory(os.path.join(app.root_path, 'Backend/static/images'), filename)

# Add a specific route for Backend/static/images path (for backward compatibility)
@app.route('/Backend/static/images/<path:filename>')
def serve_backend_static_images(filename):
    app.logger.debug(f"Serving backend static image: {filename}")
    return send_from_directory(os.path.join(app.root_path, 'Backend/static/images'), filename)

# Serve language JSON files
@app.route('/languages/<path:filename>')
def serve_language_files(filename):
    app.logger.debug(f"Serving language file: {filename}")
    return send_from_directory(os.path.join(app.root_path, 'languages'), filename)

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors by returning the index page for non-API routes"""
    app.logger.warning(f"404 error for URL: {request.path}")
    # Check if the request path starts with /api or /auth
    if request.path.startswith('/api/') or request.path.startswith('/auth/'):
        return jsonify({"error": "Not found"}), 404
    # For other routes, redirect to the index page
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Get port from environment variables or use default
    port = int(os.environ.get('PORT', 8888))  # Default port 8888
    
    # Set host to 0.0.0.0 to make it accessible on the local network
    host = '0.0.0.0'  # Listen on all network interfaces
    
    # Enable development features
    app.debug = True  # Enable debug mode
    app.config['TEMPLATES_AUTO_RELOAD'] = True  # Enable template auto-reloading
    
    # Log application startup
    app.logger.info(f"Starting TogolokChat on http://{host}:{port}/")
    app.logger.info(f"Debug mode: {app.debug}")
    
    print(f"Starting TogolokChat on http://{host}:{port}/")
    print(f"Access using your local IP address from other devices on the same network")
    
    # Run the application with SocketIO
    socketio.run(
        app, 
        host=host, 
        port=port, 
        debug=True,
        allow_unsafe_werkzeug=True  # Only use in development!
    )