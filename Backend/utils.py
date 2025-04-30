"""
Utility functions shared across the application
"""
import os

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
PROFILE_PHOTOS_FOLDER = os.path.join(UPLOAD_FOLDER, 'profile_photos')
DIRECT_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'direct_images')
GROUP_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'group_images')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    """Check if a filename has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size(filepath):
    """Get the size of a file safely"""
    try:
        return os.path.getsize(filepath)
    except OSError:
        return 0 