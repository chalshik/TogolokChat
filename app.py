from flask import Flask, render_template
import os

# Import blueprints
from Backend.auth import bp as auth_bp
from Backend.chat import bp as chat_bp
from Backend.settings import bp as settings_bp

# Initialize database
from Backend.db import create_tables

# Create Flask app
app = Flask(__name__)

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

# Serve the main application
@app.route('/')
def index():
    return render_template('index.html')

# Serve static files from the uploads directory
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return app.send_static_file(f'uploads/{filename}')

if __name__ == '__main__':
    app.debug = True  # Enable debug mode
    app.config['TEMPLATES_AUTO_RELOAD'] = True  # Enable template auto-reloading
    app.run(debug=True, use_reloader=True)  # Enable auto-reloader 