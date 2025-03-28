from flask import Blueprint, request, jsonify, send_from_directory
from Backend.db import connect_db
import os
from werkzeug.utils import secure_filename

# Create blueprint with a unique name
bp = Blueprint("settings", __name__)

# Settings for uploads
UPLOAD_FOLDER = 'uploads/profile_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/change_password', methods=['POST'])
def change_password():
    data = request.get_json()
    username = data.get("username")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not username or not old_password or not new_password:
        return jsonify({"message": "All fields (username, old_password, new_password) are required!"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    stored_password = user[0]

    if stored_password != old_password:
        return jsonify({"message": "Incorrect old password"}), 400

    cursor.execute("UPDATE users SET password = ? WHERE username = ?", (new_password, username))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Password changed successfully!"}), 200

@bp.route('/users', methods=['GET'])
def get_all_users():
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email FROM users")
    users = cursor.fetchall()
    
    conn.close()

    user_list = [{"id": user[0], "username": user[1], "email": user[2]} for user in users]

    return jsonify({"users": user_list}), 200

@bp.route('/set_profile_photo', methods=['POST'])
def set_profile_photo():
    username = request.form.get('username')
    if 'photo' not in request.files:
        return jsonify({"message": "No file part"}), 400
    photo = request.files['photo']
    if photo.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if photo and allowed_file(photo.filename):
        # Create directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Save the file securely
        filename = secure_filename(photo.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        photo.save(file_path)

        # Connect to the database
        conn = connect_db()
        cursor = conn.cursor()

        # Get the user ID based on username
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "User not found"}), 404

        user_id = user[0]

        # Update the profile photo path in the database
        cursor.execute("INSERT OR REPLACE INTO profile_photos (user_id, photo) VALUES (?, ?)", (user_id, filename))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Profile photo updated successfully"}), 200

    return jsonify({"message": "Invalid file type. Only images are allowed."}), 400
    
@bp.route('/get_profile_photo', methods=['GET'])
def get_profile_photo():
    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username is required"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    # Get the profile photo file path from the database
    cursor.execute("SELECT p.photo FROM profile_photos p JOIN users u ON p.user_id = u.id WHERE u.username = ?", (username,))
    photo = cursor.fetchone()

    conn.close()

    if not photo:
        return jsonify({"message": "No profile photo found for this user"}), 404

    # Return the file path (relative path to be used for accessing the image)
    photo_path = photo[0]
    return jsonify({"photo_url": f"/uploads/profile_photos/{photo_path}"}), 200

# Serve uploaded profile photos in this Blueprint
@bp.route('/uploads/profile_photos/<filename>')
def uploaded_file(filename):
    return send_from_directory('uploads/profile_photos', filename)