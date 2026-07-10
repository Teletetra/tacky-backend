import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Render deployment environments can have standard MongoDB URIs
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/life_os")

client = AsyncIOMotorClient(MONGODB_URI)

# If a database is specified in the URI, use it; otherwise default to "life_os"
try:
    db = client.get_default_database()
except Exception:
    db = client["life_os"]

habits_collection = db["habits"]
logs_collection = db["logs"]
expenses_collection = db["expenses"]
debts_collection = db["debts"]
users_collection = db["users"]
refresh_tokens_collection = db["refresh_tokens"]

async def check_db_connection():
    try:
        # The ping command is cheap and checks if the client is connected
        await db.command("ping")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False
