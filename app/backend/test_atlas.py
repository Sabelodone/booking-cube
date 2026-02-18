from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    try:
        mongo_url = os.getenv("MONGO_URL")
        # Hide password in output
        safe_url = mongo_url.replace(mongo_url.split('@')[0].split('//')[1], '***:***')
        print(f"🔌 Testing connection to: {safe_url}")
        
        # Connect
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.getenv("DB_NAME", "tutorhub")]
        
        # Ping
        await db.command("ping")
        print("✅ Successfully connected to MongoDB Atlas!")
        
        # List collections
        collections = await db.list_collection_names()
        print(f"📚 Collections in database: {collections}")
        
        # Count documents
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"   {collection}: {count} documents")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())