import { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import styles from './AddExpense.module.css';

const today = new Date().toISOString().split('T')[0];

const PRESET_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];
const PRESET_EMOJIS = ['🍔', '🚗', '💸', '📱', '🛒', '🛍️', '💼', '💻', '📈', '💵', '🏠', '🍕', '🎬', '💊', '✈️', '🏷️'];

export default function AddExpense() {
  const { addExpense, categories, addCategory } = useExpenses();
  const [form, setForm] = useState({
    date: today,
    amount: '',
    desc: '',
    cat: 'transport',
    type: 'expense',
    recurring: false,
    interval: 'monthly',
  });
  const [msg, setMsg] = useState(null);

  // Custom Category State
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCat, setCustomCat] = useState({ label: '', color: '#3B82F6', icon: '🏷️' });

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => {
      const updated = { ...f, [field]: val };
      // Auto-set category if type changed to ensure it exists for that type
      if (field === 'type') {
        const available = Object.entries(categories).filter(([, cat]) => cat.type === val);
        updated.cat = available[0]?.[0] || 'other';
      }
      return updated;
    });
  };

  const handleCreateCategory = () => {
    if (!customCat.label.trim()) return;
    const catId = 'custom_' + customCat.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    addCategory({
      id: catId,
      label: customCat.label.trim(),
      color: customCat.color,
      icon: customCat.icon,
      type: form.type,
    });
    setForm(f => ({ ...f, cat: catId }));
    setCustomCat({ label: '', color: '#3B82F6', icon: '🏷️' });
    setShowCustomCat(false);
  };

  const handleSubmit = () => {
    if (!form.date || !form.amount || !form.desc) {
      setMsg({ type: 'error', text: 'Please fill all fields.' });
      return;
    }
    addExpense({
      date: form.date,
      amount: parseFloat(form.amount),
      desc: form.desc,
      cat: form.cat,
      type: form.type,
      recurring: form.recurring,
      interval: form.recurring ? form.interval : 'none',
    });
    setForm(f => ({
      ...f,
      amount: '',
      desc: '',
      recurring: false,
    }));
    setMsg({ type: 'success', text: `${form.type === 'income' ? 'Income' : 'Expense'} added!` });
    setTimeout(() => setMsg(null), 2000);
  };

  // Filter categories by type (expense/income)
  const filteredCategories = Object.entries(categories).filter(([, cat]) => cat.type === form.type);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.heading}>New transaction</h2>

        {/* Transaction Type Segmented Toggle */}
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

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <input type="date" className={styles.input} value={form.date} onChange={set('date')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Amount (₹)</label>
            <input type="number" className={styles.input} placeholder="0" value={form.amount} onChange={set('amount')} />
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>Description</label>
            <input type="text" className={styles.input} placeholder="e.g. Salary, groceries, movie ticket…" value={form.desc} onChange={set('desc')} />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <div className={styles.categoryLabelRow}>
              <label className={styles.label}>Category</label>
              <button
                type="button"
                className={styles.addCategoryLink}
                onClick={() => setShowCustomCat(!showCustomCat)}
              >
                {showCustomCat ? 'Cancel' : '+ Custom Category'}
              </button>
            </div>
            {!showCustomCat && (
              <select className={styles.input} value={form.cat} onChange={set('cat')}>
                {filteredCategories.map(([key, { label, icon }]) => (
                  <option key={key} value={key}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Inline custom category creator */}
        {showCustomCat && (
          <div className={styles.customCatBox}>
            <h4 className={styles.customCatTitle}>Create custom category</h4>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Category name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Gym, Rent, Side Hustle"
                  value={customCat.label}
                  onChange={(e) => setCustomCat(c => ({ ...c, label: e.target.value }))}
                />
              </div>

              {/* Color picker */}
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Category color</label>
                <div className={styles.colorsGrid}>
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorDot} ${customCat.color === color ? styles.colorDotActive : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCustomCat(c => ({ ...c, color }))}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={customCat.color}
                    onChange={(e) => setCustomCat(c => ({ ...c, color: e.target.value }))}
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Emoji selector */}
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Category icon (emoji)</label>
                <div className={styles.emojisGrid}>
                  {PRESET_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`${styles.emojiDot} ${customCat.icon === emoji ? styles.emojiDotActive : ''}`}
                      onClick={() => setCustomCat(c => ({ ...c, icon: emoji }))}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              className={styles.customCatSaveBtn}
              onClick={handleCreateCategory}
            >
              Add Category
            </button>
          </div>
        )}

        {/* Repeatable settings */}
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

        <button className={styles.btn} onClick={handleSubmit}>Add transaction</button>

        {msg && (
          <p className={`${styles.msg} ${msg.type === 'error' ? styles.error : styles.success}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
