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
    security_question = data.get('security_question')
    secret_word = data.get('secret_word')

    if not email or not username or not password or not security_question or not secret_word:
        return jsonify({'message': 'All fields are required!'}), 400

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    x = cursor.fetchone()

    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    y = cursor.fetchone()

    if x:
        return jsonify({"message": "User with this email already registered"}), 409
    if y:
        return jsonify({"message": "Username already exists"}), 409

    try:
        cursor.execute("""
            INSERT INTO users (username, email, password, security_question, secret_word) 
            VALUES (?, ?, ?, ?, ?)
        """, (username, email, password, security_question, secret_word))
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Registration failed: " + str(e)}), 500
    finally:
        cursor.close()
        conn.close()

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
@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    conn = connect_db()
    cursor = conn.cursor()

    email = data.get('email')
    secret_word = data.get('keyword')  # Using 'keyword' for backward compatibility
    new_password = data.get('new_password')

    if not email or not secret_word or not new_password:
        return jsonify({'message': 'Email, secret word, and new password are required!'}), 400

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"message": "User not found"}), 404

    stored_secret = user[5]  # Index of secret_word in users table

    if stored_secret != secret_word:
        return jsonify({"message": "Incorrect secret word"}), 400

    try:
        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, email))
        conn.commit()
        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Password reset failed: " + str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@bp.route('/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({'message': 'Username is required'}), 400
        
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if user:
        return jsonify({'message': 'Username exists'}), 200
    return jsonify({'message': 'Username available'}), 404

@bp.route('/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
        
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if user:
        return jsonify({'message': 'Email exists'}), 200
    return jsonify({'message': 'Email available'}), 404

@bp.route('/get-security-question', methods=['POST'])
def get_security_question():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
        
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT security_question FROM users WHERE email = ?", (email,))
    result = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if result:
        return jsonify({'security_question': result[0]}), 200
    return jsonify({'message': 'User not found'}), 404