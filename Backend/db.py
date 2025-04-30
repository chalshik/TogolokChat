import sqlite3
import os

def connect_db():
    conn = sqlite3.connect('chat.db')
    return conn

def execute_sql_file(cursor, filename):
    """Execute SQL statements from a file"""
    try:
        with open(filename, 'r') as f:
            sql_script = f.read()
            cursor.executescript(sql_script)
        print(f"Executed SQL script: {filename}")
    except Exception as e:
        print(f"Error executing {filename}: {e}")

def create_tables():
    db = connect_db()
    cursor = db.cursor()
    
    # Execute the main schema file
    schema_path = os.path.join('Backend', 'migrations', 'schema.sql')
    
    # If schema.sql doesn't exist in migrations, create it
    if not os.path.exists(schema_path):
        # Use the existing schema.sql or create it from the current code
        original_schema_path = os.path.join('Backend', 'schema.sql')
        if os.path.exists(original_schema_path):
            # Copy the content to migrations directory
            os.makedirs(os.path.dirname(schema_path), exist_ok=True)
            with open(original_schema_path, 'r') as original:
                with open(schema_path, 'w') as new:
                    new.write(original.read())
        else:
            # Create the schema.sql file with the current hardcoded schema
            os.makedirs(os.path.dirname(schema_path), exist_ok=True)
            with open(schema_path, 'w') as f:
                f.write('''-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    security_question TEXT NOT NULL,
    secret_word TEXT NOT NULL,
    name TEXT,
    profile_picture TEXT,
    info TEXT
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    is_edited INTEGER DEFAULT 0,
    delivered_at DATETIME,
    read_at DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL,
    admin_id INTEGER NOT NULL,
    group_picture TEXT,
    description TEXT
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Group messages table
CREATE TABLE IF NOT EXISTS group_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    time TEXT NOT NULL,
    is_edited INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Group message status table
CREATE TABLE IF NOT EXISTS group_message_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'sent',
    delivered_at TEXT,
    read_at TEXT,
    UNIQUE (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES group_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Banned users table
CREATE TABLE IF NOT EXISTS banned (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    display_name TEXT,
    UNIQUE (user_id, contact_id),
    CHECK (user_id <> contact_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group photos table
CREATE TABLE IF NOT EXISTS group_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    photo TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Profile photos table
CREATE TABLE IF NOT EXISTS profile_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    photo TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group sended photos table
CREATE TABLE IF NOT EXISTS group_sended_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    photo TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Real names table
CREATE TABLE IF NOT EXISTS real_names (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_user_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (reporter_id, reported_user_id),
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Direct photos table
CREATE TABLE IF NOT EXISTS direct_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    photo TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
''')
    
    # Execute the schema file
    execute_sql_file(cursor, schema_path)
    
    # Apply all migration files in order (except schema.sql)
    migrations_dir = os.path.join('Backend', 'migrations')
    if os.path.exists(migrations_dir):
        migration_files = [f for f in os.listdir(migrations_dir) 
                          if f.endswith('.sql') and f != 'schema.sql']
        # Sort files to ensure they're applied in the correct order
        migration_files.sort()
        
        for migration_file in migration_files:
            execute_sql_file(cursor, os.path.join(migrations_dir, migration_file))
    
    db.commit()
    db.close()
