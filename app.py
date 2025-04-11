from flask import Flask, render_template, redirect, url_for, session
import os
from datetime import timedelta

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

if __name__ == '__main__':
    app.debug = True  # Enable debug mode
    app.config['TEMPLATES_AUTO_RELOAD'] = True  # Enable template auto-reloading
    app.run(debug=True, use_reloader=True)  # Enable auto-reloader 