from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class HabitCategory(str, Enum):
    PHYSICAL = "Physical"
    MENTAL = "Mental"
    TECHNICAL = "Technical"
    SPIRITUAL = "Spiritual"

class TargetFrequency(str, Enum):
    DAILY = "Daily"
    WEEKLY = "Weekly"
    MONTHLY = "Monthly"

class TrackingType(str, Enum):
    BINARY = "binary"      # Standard checkmark (Yes/No)
    NEGATIVE = "negative"  # Anger/distraction (0 is success)
    TIMER = "timer"        # Tech study hours / time_spent_minutes
    WORKOUT = "workout"    # Gym progress (weight & reps)
    COUNTER = "counter"    # Yatharth Geeta chapters read

class HabitBase(BaseModel):
    user_id: Optional[str] = None
    name: str
    category: HabitCategory
    target_frequency: TargetFrequency
    tracking_type: TrackingType = TrackingType.BINARY
    is_negative: bool = False
    
    # Optional target configs
    target_time_spent: Optional[int] = None
    
    # Trackers for progressive overload and progress
    current_chapter: Optional[int] = 0
    max_weight: Optional[float] = 0.0
    max_reps: Optional[int] = 0

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[HabitCategory] = None
    target_frequency: Optional[TargetFrequency] = None
    tracking_type: Optional[TrackingType] = None
    target_time_spent: Optional[int] = None
    current_chapter: Optional[int] = None
    max_weight: Optional[float] = None
    max_reps: Optional[int] = None

class HabitInDB(HabitBase):
    id: str = Field(alias="_id")
    current_streak: int = 0
    longest_streak: int = 0
    last_checkin: Optional[datetime] = None  # UTC timestamp
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DailyLogBase(BaseModel):
    user_id: Optional[str] = None
    habit_id: str
    date: str  # Format: YYYY-MM-DD
    status: bool  # True if habit completed (or 0 outbursts for negative habits)
    notes: Optional[str] = ""
    
    # Specialized log inputs
    time_spent_minutes: Optional[int] = None
    weight: Optional[float] = None
    reps: Optional[int] = None
    chapter: Optional[int] = None
    negative_count: Optional[int] = None  # e.g., number of outbursts/relapses

class DailyLogCreate(DailyLogBase):
    pass

class DailyLogInDB(DailyLogBase):
    id: str = Field(alias="_id")
    logged_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ExpenseBase(BaseModel):
    user_id: Optional[str] = None
    date: str
    desc: str
    amount: float
    cat: str
    type: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseInDB(ExpenseBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True

class DebtBase(BaseModel):
    user_id: Optional[str] = None
    person: str
    amount: float
    desc: str
    date: str
    isPaid: bool = False

class DebtCreate(DebtBase):
    pass

class DebtInDB(DebtBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: datetime

    class Config:
        populate_by_name = True

class TokenRefreshRequest(BaseModel):
    refresh_token: str

