import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

async def fix_database():
    try:
        # Connect
        mongo_url = os.getenv("MONGO_URL")
        db_name = os.getenv("DB_NAME", "tutorhub")
        
        logger.info(f"Connecting to {db_name}...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Check connection
        await db.command("ping")
        logger.info("✅ Connected to MongoDB")
        
        # Required collections
        required_collections = ["users", "sessions", "bookings", "payments", "password_reset_tokens"]
        
        # Get existing collections
        existing = await db.list_collection_names()
        logger.info(f"Existing collections: {existing}")
        
        # Create missing collections
        for collection in required_collections:
            if collection not in existing:
                await db.create_collection(collection)
                logger.info(f"✅ Created collection: {collection}")
                
                # Create indexes
                if collection == "users":
                    await db.users.create_index("email", unique=True)
                    await db.users.create_index("id")
                    logger.info("✅ Created indexes for users")
                elif collection == "sessions":
                    await db.sessions.create_index("id")
                elif collection == "bookings":
                    await db.bookings.create_index("id")
        
        # Verify
        final_collections = await db.list_collection_names()
        logger.info(f"✅ All collections ready: {final_collections}")
        
        # Create a test user
        test_user = await db.users.find_one({"email": "test@example.com"})
        if not test_user:
            # Import here to avoid circular imports
            import bcrypt
            import uuid
            from datetime import datetime, timezone
            
            hashed = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = {
                "id": str(uuid.uuid4()),
                "email": "test@example.com",
                "full_name": "Test User",
                "grade": "12",
                "phone": "0712345678",
                "hashed_password": hashed,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user)
            logger.info("✅ Created test user: test@example.com / test123")
        
        logger.info("🎉 Database is ready!")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(fix_database())