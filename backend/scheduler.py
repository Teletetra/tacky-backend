import logging
from datetime import datetime, date
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import habits_collection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reset_expired_streaks(target_date: date = None):
    """
    Evaluates all habits with a recorded check-in date. If the elapsed days
    between the target_date (defaults to today) and the last check-in exceed
    the allowed frequency limit, reset current_streak to 0.
    """
    if target_date is None:
        target_date = date.today()
        
    logger.info(f"Resetting expired streaks relative to target date: {target_date.isoformat()}")
    
    cursor = habits_collection.find({"last_checkin_date": {"$ne": None}})
    updated_count = 0
    
    async for habit in cursor:
        try:
            last_date = datetime.strptime(habit["last_checkin_date"], "%Y-%m-%d").date()
            days_diff = (target_date - last_date).days
            
            limit = 1
            freq = habit.get("target_frequency", "Daily")
            if freq == "Weekly":
                limit = 7
            elif freq == "Monthly":
                limit = 30
                
            if days_diff > limit:
                logger.info(f"Streak broken for '{habit['name']}' (Last check-in: {habit['last_checkin_date']}, limit: {limit} days, diff: {days_diff} days)")
                await habits_collection.update_one(
                    {"_id": habit["_id"]},
                    {"$set": {"current_streak": 0}}
                )
                updated_count += 1
        except Exception as e:
            logger.error(f"Error processing streak for habit {habit.get('_id')}: {e}")
            
    logger.info(f"Streak reset job complete. Updated {updated_count} habits.")
    return updated_count

def start_scheduler():
    scheduler = AsyncIOScheduler()
    # Runs everyday at midnight server time to reset status
    scheduler.add_job(
        reset_expired_streaks,
        trigger="cron",
        hour=0,
        minute=0,
        id="streak_reset_daily"
    )
    scheduler.start()
    logger.info("APScheduler initialized to run daily streak resets at midnight.")
    return scheduler
