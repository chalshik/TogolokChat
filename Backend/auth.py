from flask import Blueprint, request, jsonify, session, redirect, url_for
from Backend.db import connect_db

# Create blueprint with a unique name and URL prefix
bp = Blueprint("auth", __name__, url_prefix='/auth')

# Helper function to check if user is logged in
def is_authenticated():
    return 'user_id' in session

@bp.route('/check_auth', methods=['GET'])
def check_auth():
    if is_authenticated():
        return jsonify({"authenticated": True, "username": session.get('username')}), 200
    return jsonify({"authenticated": False}), 401

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()  
    conn = None
    cursor = None
    
    try:
        conn = connect_db()
        cursor = conn.cursor()

        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        security_question = data.get('security_question')
        secret_word = data.get('secret_word')

        if not email or not username or not password or not security_question or not secret_word:
            return jsonify({'message': 'All fields are required!'}), 400

        # Check if email exists - better column-specific query
        cursor.execute("SELECT COUNT(*) FROM users WHERE email = ?", (email,))
        email_count = cursor.fetchone()[0]
        
        # Check if username exists - better column-specific query
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = ?", (username,))
        username_count = cursor.fetchone()[0]

        if email_count > 0:
            return jsonify({"message": "User with this email already registered"}), 409
        if username_count > 0:
            return jsonify({"message": "Username already exists"}), 409

        # Insert new user
        cursor.execute("""
            INSERT INTO users (username, email, password, security_question, secret_word) 
            VALUES (?, ?, ?, ?, ?)
        """, (username, email, password, security_question, secret_word))
        conn.commit()
        
        # Get the user's ID for the session
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user_id = cursor.fetchone()[0]
        
        # Automatically log in the user by setting session variables
        session['user_id'] = user_id
        session['username'] = username
        session['email'] = email
        session.permanent = True
        
        return jsonify({
            "message": "User registered successfully",
            "username": username,
            "user_id": user_id,
            "email": email
        }), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"message": "Registration failed: " + str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
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
        
        # In users table, password is at index 2 (after id, username)
        stored_password = user[2]
        if stored_password != password:  
            return jsonify({"message": "Incorrect password"}), 400
        username = user[1]  # Get username from user record

    # Login using username
    elif username:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 400
        
        # In users table, password is at index 2 (after id, username)
        stored_password = user[2]
        if stored_password != password:
            return jsonify({"message": "Incorrect password"}), 400

    # Store user info in session
    session['user_id'] = user[0]
    session['username'] = user[1]
    session['email'] = user[3]  # Email is at index 3
    session.permanent = True

    return jsonify({
        "message": "Login successful", 
        "username": user[1], 
        "user_id": user[0],
        "email": user[3]
    }), 200

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

@bp.route('/logout', methods=['POST'])
def logout():
    print('Logout route called. Current session:', session)
    
    # Clear all session data
    for key in list(session.keys()):
        session.pop(key, None)
    
    # Force clear the session
    session.clear()
    
    print('Session after logout:', session)
    
    # Return success response
    return jsonify({"message": "Logout successful"}), 200

# Add a favicon route to handle the 404 error
@bp.route('/favicon.ico')
def favicon():
    return '', 204  # No content response