from flask import Flask, render_template, redirect, url_for, session, send_from_directory, request, jsonify 
import os
from datetime import timedelta
from flask_socketio import SocketIO

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
           static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_togolok_chat')  # Set secret key for sessions
app.permanent_session_lifetime = timedelta(days=7)  # Set session lifetime

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
app.register_blueprint(settings_bp, url_prefix='/api')
app.register_blueprint(user_bp)  # Register the user blueprint

# Create required directories if they don't exist
os.makedirs('uploads/profile_photos', exist_ok=True)
os.makedirs('uploads/direct_images', exist_ok=True)
os.makedirs('uploads/group_images', exist_ok=True)

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
        return render_template('chat.html')  # Render chat.html directly
    return render_template('index.html')

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

# Serve placeholder images for profile pictures
@app.route('/api/placeholder/<int:width>/<int:height>')
def serve_placeholder(width, height):
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

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors by returning the index page for non-API routes"""
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