import React, { useState, useEffect, useCallback } from 'react';
import styles from './HabitsDashboard.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:10000/api';

const getLocalDateString = (dateObj = new Date()) => {
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffset).toISOString().split('T')[0];
};

const CATEGORIES = ['Physical', 'Mental', 'Technical', 'Spiritual'];
const CATEGORY_ICONS = {
  Physical: '💪',
  Mental: '🧠',
  Technical: '💻',
  Spiritual: '🧘',
};

export default function HabitsDashboard() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [habits, setHabits] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [statusText, setStatusText] = useState('Connecting...');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [selectedHabit, setSelectedHabit] = useState(null);
  
  // History State
  const [historyLogs, setHistoryLogs] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState(null);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/habits?local_date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
        setStatusText('Connected');
      } else {
        setStatusText('API Error');
      }
    } catch (err) {
      console.error(err);
      setStatusText('Offline');
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchHabits();
    const interval = setInterval(fetchHabits, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchHabits]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleDeleteHabit = async (habitId, name) => {
    if (!window.confirm(`Delete habit "${name}" and all its history?`)) return;
    try {
      await fetch(`${API_BASE}/habits/${habitId}`, { method: 'DELETE' });
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const openHistory = async (habit) => {
    setSelectedHabit(habit);
    setCalendarMonth(new Date().getMonth());
    setCalendarYear(new Date().getFullYear());
    setSelectedCalendarDateStr(null);
    try {
      const res = await fetch(`${API_BASE}/habits/${habit.id}/logs`);
      if (res.ok) {
        setHistoryLogs(await res.json());
        setShowHistoryModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completed_today).length;
  const maxStreakAll = totalHabits > 0 ? Math.max(...habits.map(h => h.longest_streak || 0)) : 0;
  const consistency = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const filteredHabits = filterCategory === 'all' 
    ? habits 
    : habits.filter(h => h.category === filterCategory);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.dateControl}>
          <button onClick={handlePrevDay} className={styles.navBtn}>◀</button>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className={styles.dateInput}
          />
          <button onClick={handleNextDay} className={styles.navBtn}>▶</button>
        </div>
        <div className={`${styles.status} ${statusText === 'Connected' ? styles.statusOk : styles.statusErr}`}>
          <span className={styles.statusDot}></span>
          {statusText}
        </div>
      </header>

      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Habits</div>
          <div className={styles.statValue}>{totalHabits}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Completed Today</div>
          <div className={styles.statValue}>{completedToday} / {totalHabits}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Max Streak</div>
          <div className={styles.statValue}>{maxStreakAll} <span className={styles.flame}>🔥</span></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Consistency</div>
          <div className={styles.statValue}>{consistency}%</div>
        </div>
      </section>

      <section className={styles.controlsRow}>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filterCategory === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`${styles.filterBtn} ${filterCategory === cat ? styles.activeFilter : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>➕ Add Habit</button>
      </section>

      <section className={styles.grid}>
        {filteredHabits.length === 0 ? (
          <div className={styles.emptyState}>No habits found for this filter. Start by adding one!</div>
        ) : (
          filteredHabits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit}
              onCheckIn={() => { setSelectedHabit(habit); setShowCheckinModal(true); }}
              onHistory={() => openHistory(habit)}
              onDelete={() => handleDeleteHabit(habit.id, habit.name)}
            />
          ))
        )}
      </section>

      {/* Modals */}
      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onRefresh={fetchHabits} />}
      {showCheckinModal && selectedHabit && (
        <CheckInModal 
          habit={selectedHabit} 
          date={selectedDate}
          onClose={() => setShowCheckinModal(false)} 
          onRefresh={fetchHabits} 
        />
      )}
      {showHistoryModal && selectedHabit && (
        <HistoryModal 
          habit={selectedHabit}
          logs={historyLogs}
          month={calendarMonth}
          year={calendarYear}
          setMonth={setCalendarMonth}
          setYear={setCalendarYear}
          selectedDateStr={selectedCalendarDateStr}
          setSelectedDateStr={setSelectedCalendarDateStr}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------
// Sub-Components
// ---------------------------------

function HabitCard({ habit, onCheckIn, onHistory, onDelete }) {
  const isCompleted = habit.completed_today;
  const log = habit.today_log || {};
  let statusSummary = isCompleted ? 'Completed' : '';
  
  if (isCompleted) {
    if (habit.tracking_type === 'workout') statusSummary = `Logged: ${log.weight||0}kg × ${log.reps||0} reps`;
    else if (habit.tracking_type === 'timer') statusSummary = `Spent: ${log.time_spent_minutes||0} mins`;
    else if (habit.tracking_type === 'counter') statusSummary = `Finished Ch. ${log.chapter||0}`;
    else if (habit.tracking_type === 'negative') statusSummary = log.status ? '0 Outbursts!' : `${log.negative_count||0} relapses`;
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>{CATEGORY_ICONS[habit.category]} {habit.category}</span>
        <div className={styles.cardActions}>
          <button onClick={onHistory} title="History">📅</button>
          <button onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>
      
      <h3 className={styles.habitTitle}>{habit.name}</h3>
      
      <div className={styles.streakBar}>
        <div className={styles.streakItem}>
          <span className={styles.streakVal}>{habit.current_streak||0}</span>
          <span className={styles.streakLbl}>Streak 🔥</span>
        </div>
        <div className={styles.streakItem}>
          <span className={styles.streakVal}>{habit.longest_streak||0}</span>
          <span className={styles.streakLbl}>Longest</span>
        </div>
        <div className={styles.streakItem}>
          <span className={styles.streakLbl}>{habit.target_frequency}</span>
        </div>
      </div>
      
      <div className={styles.checkinArea}>
        {isCompleted ? (
          <button className={`${styles.checkinBtn} ${styles.btnSuccess}`} onClick={onCheckIn}>
            ✅ {statusSummary}
          </button>
        ) : (
          <button className={styles.checkinBtn} onClick={onCheckIn}>
            ✏️ Log Check-In
          </button>
        )}
        {isCompleted && log.notes && <div className={styles.notesExcerpt}>📝 {log.notes}</div>}
      </div>
    </div>
  );
}

function AddHabitModal({ onClose, onRefresh }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Physical');
  const [frequency, setFrequency] = useState('Daily');
  const [trackingType, setTrackingType] = useState('binary');
  const [targetTime, setTargetTime] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, category, target_frequency: frequency, tracking_type: trackingType,
          target_time_spent: targetTime ? parseInt(targetTime) : null
        })
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert('Failed to add habit');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add New Habit</h2>
          <button onClick={onClose}>❌</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Habit Name</label>
            <input required type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Reading, Gym..." />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Frequency</label>
              <select value={frequency} onChange={e=>setFrequency(e.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Tracking Method</label>
            <select value={trackingType} onChange={e=>setTrackingType(e.target.value)}>
              <option value="binary">Simple Checkmark</option>
              <option value="negative">Negative Habit (Outbursts/Relapses)</option>
              <option value="timer">Time Tracker (Minutes)</option>
              <option value="workout">Gym/Workout (Weight & Reps)</option>
              <option value="counter">Counter (Chapters / Count)</option>
            </select>
          </div>
          {trackingType === 'timer' && (
            <div className={styles.formGroup}>
              <label>Daily Target (Minutes)</label>
              <input type="number" min="1" value={targetTime} onChange={e=>setTargetTime(e.target.value)} />
            </div>
          )}
          <button type="submit" className={styles.submitBtn}>Create Habit</button>
        </form>
      </div>
    </div>
  );
}

function CheckInModal({ habit, date, onClose, onRefresh }) {
  const log = habit.today_log || {};
  const [status, setStatus] = useState(log.status !== undefined ? log.status : true);
  const [notes, setNotes] = useState(log.notes || '');
  
  // Specific fields
  const [negativeCount, setNegativeCount] = useState(log.negative_count || 0);
  const [timeSpent, setTimeSpent] = useState(log.time_spent_minutes || '');
  const [weight, setWeight] = useState(log.weight || habit.max_weight || '');
  const [reps, setReps] = useState(log.reps || habit.max_reps || '');
  const [chapter, setChapter] = useState(log.chapter || habit.current_chapter || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalStatus = true;
    if (habit.tracking_type === 'binary') finalStatus = status;
    else if (habit.tracking_type === 'negative') finalStatus = (parseInt(negativeCount) === 0);
    else if (habit.tracking_type === 'timer') finalStatus = (parseInt(timeSpent) > 0);
    else if (habit.tracking_type === 'workout') finalStatus = (parseFloat(weight) > 0 && parseInt(reps) > 0);
    else if (habit.tracking_type === 'counter') finalStatus = (parseInt(chapter) > 0);

    try {
      const res = await fetch(`${API_BASE}/habits/${habit.id}/checkin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habit.id, date: date, status: finalStatus, notes,
          negative_count: parseInt(negativeCount) || null,
          time_spent_minutes: parseInt(timeSpent) || null,
          weight: parseFloat(weight) || null, reps: parseInt(reps) || null,
          chapter: parseInt(chapter) || null
        })
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else alert('Checkin failed');
    } catch(err) { console.error(err); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Log Entry for {date}</h2>
          <button onClick={onClose}>❌</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {habit.tracking_type === 'binary' && (
            <div className={styles.formGroupRow}>
              <input type="checkbox" checked={status} onChange={e=>setStatus(e.target.checked)} />
              <label>Complete for today</label>
            </div>
          )}
          {habit.tracking_type === 'negative' && (
            <div className={styles.formGroup}>
              <label>Number of Outbursts/Relapses</label>
              <input type="number" min="0" required value={negativeCount} onChange={e=>setNegativeCount(e.target.value)} />
            </div>
          )}
          {habit.tracking_type === 'timer' && (
            <div className={styles.formGroup}>
              <label>Minutes Spent</label>
              <input type="number" min="0" required value={timeSpent} onChange={e=>setTimeSpent(e.target.value)} />
            </div>
          )}
          {habit.tracking_type === 'workout' && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Weight</label>
                <input type="number" step="0.1" min="0" required value={weight} onChange={e=>setWeight(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Reps</label>
                <input type="number" min="0" required value={reps} onChange={e=>setReps(e.target.value)} />
              </div>
            </div>
          )}
          {habit.tracking_type === 'counter' && (
            <div className={styles.formGroup}>
              <label>Chapter / Count</label>
              <input type="number" min="0" required value={chapter} onChange={e=>setChapter(e.target.value)} />
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label>Notes (Optional)</label>
            <textarea rows="3" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="How did it go?"></textarea>
          </div>
          <button type="submit" className={styles.submitBtn}>Save Log</button>
        </form>
      </div>
    </div>
  );
}

function HistoryModal({ habit, logs, month, year, setMonth, setYear, selectedDateStr, setSelectedDateStr, onClose }) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayStr = getLocalDateString();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const mPad = String(month + 1).padStart(2, '0');
    const dPad = String(d).padStart(2, '0');
    days.push(`${year}-${mPad}-${dPad}`);
  }

  const selectedLog = selectedDateStr ? logs.find(l => l.date === selectedDateStr) : null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{habit.name} History</h2>
            <p className={styles.subtitle}>Max Streak: {habit.longest_streak}</p>
          </div>
          <button onClick={onClose}>❌</button>
        </div>

        <div className={styles.calendarNav}>
          <button onClick={handlePrev}>◀</button>
          <strong>{monthNames[month]} {year}</strong>
          <button onClick={handleNext}>▶</button>
        </div>

        <div className={styles.calendarWeekdays}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(w => <div key={w}>{w}</div>)}
        </div>
        
        <div className={styles.calendarGrid}>
          {days.map((dateStr, idx) => {
            if (!dateStr) return <div key={idx} className={styles.calCellEmpty}></div>;
            
            const log = logs.find(l => l.date === dateStr);
            let stateClass = '';
            if (log) stateClass = log.status ? styles.calCellSuccess : styles.calCellFail;
            const isToday = dateStr === todayStr ? styles.calCellToday : '';
            const isSelected = dateStr === selectedDateStr ? styles.calCellSelected : '';

            return (
              <div 
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`${styles.calCell} ${stateClass} ${isToday} ${isSelected}`}
              >
                {parseInt(dateStr.split('-')[2])}
              </div>
            );
          })}
        </div>

        <div className={styles.detailsCard}>
          {!selectedDateStr ? (
            <div className={styles.detailsEmpty}>Click a highlighted day to view details</div>
          ) : (
            <>
              <div className={styles.detailsHeader}>
                <strong>{new Date(selectedDateStr).toLocaleDateString()}</strong>
                <span className={selectedLog?.status ? styles.badgeSuccess : styles.badgeFail}>
                  {selectedLog ? (selectedLog.status ? 'Completed' : 'Missed/Failed') : 'No Log'}
                </span>
              </div>
              {selectedLog && (
                <div className={styles.detailsBody}>
                  {habit.tracking_type === 'workout' && <div><strong>Weight/Reps:</strong> {selectedLog.weight||0}kg × {selectedLog.reps||0}</div>}
                  {habit.tracking_type === 'timer' && <div><strong>Time:</strong> {selectedLog.time_spent_minutes||0} mins</div>}
                  {habit.tracking_type === 'counter' && <div><strong>Chapter:</strong> {selectedLog.chapter||0}</div>}
                  {habit.tracking_type === 'negative' && <div><strong>Outbursts:</strong> {selectedLog.negative_count||0}</div>}
                  {selectedLog.notes && <div className={styles.detailsNote}>📝 {selectedLog.notes}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
