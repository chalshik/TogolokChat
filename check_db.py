import sqlite3

def main():
    try:
        # Connect to the database
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()
        
        # Get table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables in the database:", [table[0] for table in tables])
        
        # Get users table structure
        cursor.execute("PRAGMA table_info(users);")
        columns = cursor.fetchall()
        print("\nUsers table columns:")
        for col in columns:
            print(f"Column {col[0]}: {col[1]} ({col[2]})")
        
        # Check if required columns exist
        has_name = any(col[1] == 'name' for col in columns)
        has_profile_picture = any(col[1] == 'profile_picture' for col in columns)
        
        print(f"\nHas 'name' column: {has_name}")
        print(f"Has 'profile_picture' column: {has_profile_picture}")
        
        # Check if any users exist
        cursor.execute("SELECT * FROM users LIMIT 5;")
        users = cursor.fetchall()
        print(f"\nNumber of users: {len(users)}")
        
        if users:
            print("\nUser sample (first 5):")
            for user in users:
                print(user)
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main() 