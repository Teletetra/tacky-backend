import os
import uuid
import logging
from datetime import datetime, date
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from database import habits_collection, logs_collection, expenses_collection, debts_collection, check_db_connection
from models import (
    HabitCreate, HabitUpdate, HabitInDB,
    DailyLogCreate, DailyLogInDB,
    ExpenseCreate, DebtCreate
)
from scheduler import start_scheduler, reset_expired_streaks

# Setup Logger
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Actions
    logger.info("Initializing application startup hooks...")
    # Verify Database Connection
    db_connected = await check_db_connection()
    if db_connected:
        logger.info("Successfully connected to MongoDB.")
    else:
        logger.error("Failed to connect to MongoDB. API may not function correctly.")
        
    # Start APScheduler
    app.state.scheduler = start_scheduler()
    yield
    # Shutdown Actions
    logger.info("Shutting down background scheduler...")
    app.state.scheduler.shutdown()

app = FastAPI(
    title="Life OS Habit Tracker API",
    description="Backend API for tracking daily personal habits powered by FastAPI and MongoDB Cloud",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ROUTES ---

@app.get("/api/health")
async def health_check():
    db_connected = await check_db_connection()
    return {
        "status": "healthy",
        "database": "connected" if db_connected else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/habits")
async def get_habits(local_date: Optional[str] = Query(None, description="The user's local date in YYYY-MM-DD format")):
    if not local_date:
        local_date = date.today().isoformat()
        
    try:
        current_date = datetime.strptime(local_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid local_date format. Use YYYY-MM-DD.")
        
    habits = []
    cursor = habits_collection.find()
    async for habit_doc in cursor:
        habit_id = habit_doc["_id"]
        
        # Dynamic check and reset streak if they missed check-in yesterday
        if habit_doc.get("last_checkin_date"):
            try:
                last_date = datetime.strptime(habit_doc["last_checkin_date"], "%Y-%m-%d").date()
                days_diff = (current_date - last_date).days
                
                limit = 1
                freq = habit_doc.get("target_frequency", "Daily")
                if freq == "Weekly":
                    limit = 7
                elif freq == "Monthly":
                    limit = 30
                    
                if days_diff > limit:
                    # Streak is broken, update it to 0
                    habit_doc["current_streak"] = 0
                    await habits_collection.update_one(
                        {"_id": habit_id},
                        {"$set": {"current_streak": 0}}
                    )
            except Exception as e:
                logger.error(f"Error executing dynamic streak check for {habit_id}: {e}")
                
        # Check if checked in for the requested date (local_date)
        log_today = await logs_collection.find_one({
            "habit_id": habit_id,
            "date": local_date
        })
        
        # Model mapping
        habit_doc["id"] = habit_id
        habit_doc["completed_today"] = log_today is not None
        if log_today:
            log_today["id"] = log_today["_id"]
        habit_doc["today_log"] = log_today
        
        habits.append(habit_doc)
        
    return habits

@app.post("/api/habits", status_code=status.HTTP_201_CREATED)
async def create_habit(habit: HabitCreate):
    habit_id = str(uuid.uuid4())
    habit_doc = habit.dict()
    habit_doc["_id"] = habit_id
    habit_doc["current_streak"] = 0
    habit_doc["longest_streak"] = 0
    habit_doc["last_checkin"] = None
    habit_doc["last_checkin_date"] = None
    habit_doc["created_at"] = datetime.utcnow()
    
    # Adjust for custom defaults based on tracking_type
    if habit.tracking_type == "negative":
        habit_doc["is_negative"] = True
        
    await habits_collection.insert_one(habit_doc)
    habit_doc["id"] = habit_id
    return habit_doc

@app.put("/api/habits/{habit_id}/checkin")
async def checkin_habit(habit_id: str, log_data: DailyLogCreate):
    habit = await habits_collection.find_one({"_id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    log_date_str = log_data.date
    try:
        checkin_date = datetime.strptime(log_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    status_completed = log_data.status
    
    # Calculate streak updates
    current_streak = habit.get("current_streak", 0)
    longest_streak = habit.get("longest_streak", 0)
    last_date_str = habit.get("last_checkin_date")
    
    if status_completed:
        if not last_date_str:
            # First check-in ever
            current_streak = 1
        elif last_date_str == log_date_str:
            # Already checked in for this date; maintain current streak
            pass
        else:
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
            days_diff = (checkin_date - last_date).days
            
            limit = 1
            if habit.get("target_frequency") == "Weekly":
                limit = 7
            elif habit.get("target_frequency") == "Monthly":
                limit = 30
                
            if days_diff <= 0:
                # Logging a past date, does not progress forward streak
                pass
            elif days_diff <= limit:
                # Sequential check-in
                current_streak += 1
            else:
                # Missed check-in window, streak restarts
                current_streak = 1
    else:
        # Marked as failed/not completed (e.g. anger outbursts > 0, relapsed)
        current_streak = 0
        
    longest_streak = max(current_streak, longest_streak)
    
    # Fields to update on Habit Config
    update_fields = {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_checkin": datetime.utcnow(),
        "last_checkin_date": log_date_str
    }
    
    # Gym progresive overload tracking
    if log_data.weight is not None and log_data.weight > habit.get("max_weight", 0.0):
        update_fields["max_weight"] = log_data.weight
    if log_data.reps is not None and log_data.reps > habit.get("max_reps", 0):
        update_fields["max_reps"] = log_data.reps
        
    # Yatharth Geeta reading tracker progression
    if log_data.chapter is not None and log_data.chapter > habit.get("current_chapter", 0):
        update_fields["current_chapter"] = log_data.chapter
        
    await habits_collection.update_one(
        {"_id": habit_id},
        {"$set": update_fields}
    )
    
    # Upsert daily log (deterministic _id based on habit and date to prevent duplicate checks)
    log_id = f"{habit_id}_{log_date_str}"
    log_doc = {
        "_id": log_id,
        "habit_id": habit_id,
        "date": log_date_str,
        "status": status_completed,
        "notes": log_data.notes or "",
        "time_spent_minutes": log_data.time_spent_minutes,
        "weight": log_data.weight,
        "reps": log_data.reps,
        "chapter": log_data.chapter,
        "negative_count": log_data.negative_count,
        "logged_at": datetime.utcnow()
    }
    
    await logs_collection.replace_one(
        {"_id": log_id},
        log_doc,
        upsert=True
    )
    
    updated_habit = await habits_collection.find_one({"_id": habit_id})
    updated_habit["id"] = updated_habit["_id"]
    return {
        "habit": updated_habit,
        "log": log_doc
    }

@app.delete("/api/habits/{habit_id}")
async def delete_habit(habit_id: str):
    res = await habits_collection.delete_one({"_id": habit_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    # Cascade delete all logs associated with this habit
    await logs_collection.delete_many({"habit_id": habit_id})
    return {"message": "Habit and associated logs deleted successfully"}

@app.get("/api/habits/{habit_id}/logs")
async def get_habit_logs(habit_id: str):
    logs = []
    cursor = logs_collection.find({"habit_id": habit_id}).sort("date", -1)
    async for log in cursor:
        log["id"] = log["_id"]
        logs.append(log)
    return logs

@app.post("/api/scheduler/trigger")
async def trigger_scheduler(target_date: Optional[str] = Query(None, description="The test target date in YYYY-MM-DD format")):
    t_date = None
    if target_date:
        try:
            t_date = datetime.strptime(target_date, "%Y-%m-%d").date()
          
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
            
    updated = await reset_expired_streaks(t_date)
    return {
        "message": "Streak evaluation executed successfully",
        "updated_habits_count": updated
    }

# --- EXPENSE ROUTES ---
@app.get("/api/expenses")
async def get_expenses():
    expenses = []
    cursor = expenses_collection.find()
    async for doc in cursor:
        doc["id"] = doc.pop("_id")
        expenses.append(doc)
    return expenses

@app.post("/api/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(expense: ExpenseCreate):
    expense_id = str(uuid.uuid4())
    doc = expense.dict()
    doc["_id"] = expense_id
    await expenses_collection.insert_one(doc)
    doc["id"] = expense_id
    return doc

@app.put("/api/expenses/{expense_id}")
async def update_expense(expense_id: str, expense: ExpenseCreate):
    doc = expense.dict()
    res = await expenses_collection.update_one({"_id": expense_id}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    doc["id"] = expense_id
    return doc

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    res = await expenses_collection.delete_one({"_id": expense_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# --- DEBT ROUTES ---
@app.get("/api/debts")
async def get_debts():
    debts = []
    cursor = debts_collection.find()
    async for doc in cursor:
        doc["id"] = doc.pop("_id")
        debts.append(doc)
    return debts

@app.post("/api/debts", status_code=status.HTTP_201_CREATED)
async def create_debt(debt: DebtCreate):
    debt_id = str(uuid.uuid4())
    doc = debt.dict()
    doc["_id"] = debt_id
    await debts_collection.insert_one(doc)
    doc["id"] = debt_id
    return doc

@app.put("/api/debts/{debt_id}")
async def update_debt(debt_id: str, debt: DebtCreate):
    doc = debt.dict()
    res = await debts_collection.update_one({"_id": debt_id}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    doc["id"] = debt_id
    return doc

@app.delete("/api/debts/{debt_id}")
async def delete_debt(debt_id: str):
    res = await debts_collection.delete_one({"_id": debt_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    return {"message": "Debt deleted successfully"}


