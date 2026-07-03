import { useState, useEffect } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import styles from './EditExpenseModal.module.css';

export default function EditExpenseModal({ expense, onClose, onSave }) {
  const { categories } = useExpenses();
  const [form, setForm] = useState({
    date: '',
    amount: '',
    desc: '',
    cat: '',
    type: 'expense',
    recurring: false,
    interval: 'monthly',
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date,
        amount: expense.amount.toString(),
        desc: expense.desc,
        cat: expense.cat,
        type: expense.type || 'expense',
        recurring: expense.recurring || false,
        interval: expense.interval && expense.interval !== 'none' ? expense.interval : 'monthly',
      });
    }
  }, [expense]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => {
      const updated = { ...f, [field]: val };
      if (field === 'type') {
        const available = Object.entries(categories).filter(([, cat]) => cat.type === val);
        updated.cat = available[0]?.[0] || 'other';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.amount || !form.desc) {
      setMsg({ type: 'error', text: 'Please fill all fields.' });
      return;
    }
    onSave({
      id: expense.id,
      date: form.date,
      amount: parseFloat(form.amount),
      desc: form.desc,
      cat: form.cat,
      type: form.type,
      recurring: form.recurring,
      interval: form.recurring ? form.interval : 'none',
    });
    onClose();
  };

  if (!expense) return null;

  const filteredCategories = Object.entries(categories).filter(([, cat]) => cat.type === form.type);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.heading}>Edit transaction</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Transaction Type Toggle */}
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${form.type === 'expense' ? styles.expenseActive : ''}`}
            onClick={() => set('type')({ target: { value: 'expense' } })}
          >
            Expense
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${form.type === 'income' ? styles.incomeActive : ''}`}
            onClick={() => set('type')({ target: { value: 'income' } })}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input type="date" className={styles.input} value={form.date} onChange={set('date')} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Amount (₹)</label>
              <input type="number" className={styles.input} placeholder="0" value={form.amount} onChange={set('amount')} required step="any" />
            </div>
            <div className={`${styles.field} ${styles.full}`}>
              <label className={styles.label}>Description</label>
              <input type="text" className={styles.input} placeholder="e.g. Metro, lunch, groceries…" value={form.desc} onChange={set('desc')} required />
            </div>
            <div className={`${styles.field} ${styles.full}`}>
              <label className={styles.label}>Category</label>
              <select className={styles.input} value={form.cat} onChange={set('cat')}>
                {filteredCategories.map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Repeatable Settings */}
          <div className={styles.repeatBox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={form.recurring}
                onChange={set('recurring')}
              />
              <span>Make this a repeatable transaction</span>
            </label>

            {form.recurring && (
              <div className={styles.repeatIntervalSelect}>
                <span className={styles.label}>Repeats:</span>
                <select className={styles.inputMini} value={form.interval} onChange={set('interval')}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn}>Save changes</button>
          </div>
        </form>
        {msg && (
          <p className={`${styles.msg} ${msg.type === 'error' ? styles.error : styles.success}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
