from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
import os
from Backend.db import connect_db
from Backend.auth import is_authenticated

bp = Blueprint("user", __name__, url_prefix="/api/user")

UPLOAD_FOLDER = 'uploads/profile_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/profile', methods=['GET'])
def get_profile():
    if not is_authenticated():
        return jsonify({"message": "Not authenticated"}), 401

    user_id = session.get('user_id')
    conn = connect_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT username, name, profile_picture, info
            FROM users
            WHERE id = ?
        """, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify({
            "username": user[0],
            "name": user[1] or "",
            "profile_picture": user[2],
            "bio": user[3] or ""
        }), 200

    finally:
        cursor.close()
        conn.close()

@bp.route('/update-profile', methods=['POST'])
def update_profile():
    if not is_authenticated():
        return jsonify({"message": "Not authenticated"}), 401

    user_id = session.get('user_id')
    data = request.get_json()
    
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    if 'bio' in data:
        updates['info'] = data['bio']

    if not updates:
        return jsonify({"message": "No updates provided"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    try:
        set_clause = ', '.join(f"{k} = ?" for k in updates.keys())
        query = f"UPDATE users SET {set_clause} WHERE id = ?"
        values = list(updates.values()) + [user_id]
        
        cursor.execute(query, values)
        conn.commit()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Failed to update profile: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@bp.route('/update-profile-picture', methods=['POST'])
def update_profile_picture():
    if not is_authenticated():
        return jsonify({"message": "Not authenticated"}), 401

    if 'profile_picture' not in request.files:
        return jsonify({"message": "No file provided"}), 400

    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"message": "File type not allowed"}), 400

    user_id = session.get('user_id')
    filename = secure_filename(f"{user_id}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    conn = connect_db()
    cursor = conn.cursor()

    try:
        # Save the file
        file.save(filepath)

        # Update database
        cursor.execute("""
            UPDATE users
            SET profile_picture = ?
            WHERE id = ?
        """, (filename, user_id))
        conn.commit()

        return jsonify({
            "message": "Profile picture updated successfully",
            "success": True,
            "filename": filename
        }), 200

    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        conn.rollback()
        return jsonify({"message": f"Failed to update profile picture: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close() 