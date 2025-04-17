from flask import Blueprint, request, jsonify, session
from Backend.db import connect_db

bp = Blueprint("auth", __name__, url_prefix="/auth")


def is_authenticated():
    return "user_id" in session


@bp.route("/check_auth", methods=["GET"])
def check_auth():
    if is_authenticated():
        return jsonify({
            "authenticated": True,
            "username": session.get("username")
        }), 200
    return jsonify({"authenticated": False}), 401


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    required_fields = ["email", "username", "password", "security_question", "secret_word"]

    if not all(data.get(field) for field in required_fields):
        return jsonify({"message": "All fields are required!"}), 400

    try:
        conn = connect_db()
        cursor = conn.cursor()

        # Check for existing email or username
        cursor.execute("SELECT 1 FROM users WHERE email = ? OR username = ?", (data["email"], data["username"]))
        if cursor.fetchone():
            return jsonify({"message": "Email or Username already exists"}), 409

        # Register new user
        cursor.execute("""
            INSERT INTO users (username, email, password, security_question, secret_word) 
            VALUES (?, ?, ?, ?, ?)
        """, (data["username"], data["email"], data["password"], data["security_question"], data["secret_word"]))
        conn.commit()

        user_id = cursor.lastrowid
        session.update({
            "user_id": user_id,
            "username": data["username"],
            "email": data["email"]
        })
        session.permanent = True

        return jsonify({
            "message": "User registered successfully",
            "username": data["username"],
            "user_id": user_id,
            "email": data["email"]
        }), 200

    except Exception as e:
        return jsonify({"message": f"Registration failed: {e}"}), 500

    finally:
        cursor.close()
        conn.close()


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not (email or username) or not password:
        return jsonify({"message": "Username/Email and Password are required"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    try:
        if email:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        else:
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))

        user = cursor.fetchone()
        if not user or user[2] != password:  # Index 2 is password
            return jsonify({"message": "Invalid credentials"}), 400

        session.update({
            "user_id": user[0],
            "username": user[1],
            "email": user[3]
        })
        session.permanent = True

        return jsonify({
            "message": "Login successful",
            "username": user[1],
            "user_id": user[0],
            "email": user[3]
        }), 200

    finally:
        cursor.close()
        conn.close()


@bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email")
    secret_word = data.get("keyword") or data.get("secret_word")
    new_password = data.get("new_password")

    if not all([email, secret_word, new_password]):
        return jsonify({"message": "Email, secret word, and new password required"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT secret_word FROM users WHERE email = ?", (email,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"message": "User not found"}), 404
        if result[0] != secret_word:
            return jsonify({"message": "Incorrect secret word"}), 400

        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, email))
        conn.commit()
        return jsonify({"message": "Password reset successful"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Password reset failed: {e}"}), 500

    finally:
        cursor.close()
        conn.close()


@bp.route("/get-security-question", methods=["POST"])
def get_security_question():
    email = request.get_json().get("email")
    if not email:
        return jsonify({"message": "Email is required"}), 400

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT security_question FROM users WHERE email = ?", (email,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if result:
        return jsonify({"security_question": result[0]}), 200
    return jsonify({"message": "User not found"}), 404


@bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200


@bp.route("/favicon.ico")
def favicon():
    return "", 204
