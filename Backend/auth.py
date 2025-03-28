from flask import Blueprint, request, jsonify
from Backend.db import connect_db

# Create blueprint with a unique name
bp = Blueprint("auth", __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()  
    conn = connect_db()
    cursor = conn.cursor()

    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    keyword = data.get('keyword')

    if not email or not username or not password or not keyword:
        return jsonify({'message': 'All fields are required!'}), 400
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    x = cursor.fetchone()

    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    y = cursor.fetchone()

    if x:
        return jsonify({"message": "User with this email already registered"}), 400
    if y:
        return jsonify({"message": "Username already exists"}), 400

    cursor.execute("INSERT INTO users (username, email, keyword, password) VALUES (?, ?, ?, ?)", (username, email, keyword, password))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "User registered successfully"}), 200

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()  # Get JSON data from the request body
    conn = connect_db()
    cursor = conn.cursor()

    # Get values from the JSON data
    username = data.get("username")
    email = data.get("email")
    password = data.get('password')

    if not email and not username:
        return jsonify({"message": "Email or Username is required!"}), 400
    if not password:
        return jsonify({"message": "Password is required!"}), 400

    # Login using email
    if email:
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 400
        stored_password = user[3]  # Assuming password is stored at index 3
        if stored_password != password:  
            return jsonify({"message": "Incorrect password"}), 400

    # Login using username
    elif username:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 400
        stored_password = user[3]  # Assuming password is stored at index 3
        if stored_password != password:
            return jsonify({"message": "Incorrect password"}), 400

    return jsonify({"message": "Login successful", "username": username or user[1], "token": "dummy-token"}), 200

# Password Reset Endpoint
@bp.route('/reset_password', methods=['POST'])
def reset_password():
    data = request.get_json()  # Get JSON data from the request body
    conn = connect_db()
    cursor = conn.cursor()

    email = data.get('email')
    keyword = data.get('keyword')
    new_password = data.get('new_password')
    if not email or not keyword or not new_password:
        return jsonify({'message': 'Email, keyword, and new password are required!'}), 400
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"message": "User not found"}), 400
    stored_keyword = user[4]  

    if stored_keyword != keyword:
        return jsonify({"message": "Incorrect keyword"}), 400
    cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, email))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Password reset successful"}), 200