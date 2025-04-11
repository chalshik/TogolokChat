import sqlite3

def connect_db():
    conn = sqlite3.connect('chat.db')
    return conn

def update_tables():
    conn = connect_db()
    cursor = conn.cursor()
    
    print("Updating database schema...")
    
    # Check if 'name' column exists in users table
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    # Add 'name' column if it doesn't exist
    if 'name' not in columns:
        print("Adding 'name' column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN name TEXT")
    else:
        print("'name' column already exists in users table")
    
    # Add 'profile_picture' column if it doesn't exist
    if 'profile_picture' not in columns:
        print("Adding 'profile_picture' column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT")
    else:
        print("'profile_picture' column already exists in users table")
    
    # Check if 'group_picture' column exists in groups table
    cursor.execute("PRAGMA table_info(groups)")
    group_columns = [col[1] for col in cursor.fetchall()]
    
    # Add 'group_picture' column if it doesn't exist
    if 'group_picture' not in group_columns:
        print("Adding 'group_picture' column to groups table...")
        cursor.execute("ALTER TABLE groups ADD COLUMN group_picture TEXT")
    else:
        print("'group_picture' column already exists in groups table")
    
    # Check if 'display_name' column exists in contacts table
    cursor.execute("PRAGMA table_info(contacts)")
    contact_columns = [col[1] for col in cursor.fetchall()]
    
    # Add 'display_name' column if it doesn't exist
    if 'display_name' not in contact_columns:
        print("Adding 'display_name' column to contacts table...")
        cursor.execute("ALTER TABLE contacts ADD COLUMN display_name TEXT")
        # Set default display_name to be the same as username for existing contacts
        cursor.execute('''
            UPDATE contacts 
            SET display_name = (SELECT username FROM users WHERE users.id = contacts.contact_id)
            WHERE display_name IS NULL
        ''')
    else:
        print("'display_name' column already exists in contacts table")
    
    # Set default values for existing users
    print("Setting default values for 'name' column...")
    cursor.execute("UPDATE users SET name = username WHERE name IS NULL")
    
    # Commit changes and close connection
    conn.commit()
    print("Database schema updated successfully!")
    
    # Verify the changes
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    print("Users table columns:", columns)
    
    cursor.execute("PRAGMA table_info(groups)")
    group_columns = [col[1] for col in cursor.fetchall()]
    print("Groups table columns:", group_columns)
    
    cursor.execute("PRAGMA table_info(contacts)")
    contact_columns = [col[1] for col in cursor.fetchall()]
    print("Contacts table columns:", contact_columns)
    
    conn.close()

if __name__ == "__main__":
    update_tables() 