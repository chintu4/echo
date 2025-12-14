import os
import pymysql
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT', '3306'))  # Default to 3306 if not set
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

# Ensure required environment variables are set
if DB_HOST is None or DB_USER is None or DB_PASSWORD is None or DB_NAME is None:
    raise ValueError("Missing required database environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME")
# Narrow types for static type checkers
assert DB_HOST is not None
assert DB_USER is not None
assert DB_PASSWORD is not None
assert DB_NAME is not None

def test_database_connection():
    try:
        # Establish connection
        connection = pymysql.connect(
            host=str(DB_HOST),
            port=DB_PORT,
            user=str(DB_USER),
            password=str(DB_PASSWORD),
            database=str(DB_NAME)
        )
        print("Database connection successful!")
        
        # Test with a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT  1;")
            result = cursor.fetchone()
            print(f"Query result: {result}")
        
        # Close connection
        connection.close()
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    test_database_connection()