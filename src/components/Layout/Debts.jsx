import { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { formatINR, formatDate } from '../../utils/formatters';
import styles from './Debts.module.css';

const today = new Date().toISOString().split('T')[0];

export default function Debts() {
  const { debts, addDebt, deleteDebt, toggleDebtPaid } = useExpenses();
  const [form, setForm] = useState({ person: '', amount: '', desc: '', date: today, type: 'borrowed' });
  const [msg, setMsg] = useState(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.person || !form.amount || !form.desc) {
      setMsg({ type: 'error', text: 'Please fill all fields.' });
      return;
    }

    addDebt({
      person: form.person.trim(),
      amount: parseFloat(form.amount),
      desc: form.desc.trim(),
      date: form.date,
      type: form.type,
      isPaid: false,
    });

    setForm({ person: '', amount: '', desc: '', date: today, type: form.type });
    setMsg({ type: 'success', text: 'Debt record added successfully!' });
    setTimeout(() => setMsg(null), 2000);
  };

  const handleSettleDebt = (debt) => {
    toggleDebtPaid(debt.id);
    setMsg({ type: 'success', text: debt.isPaid ? 'Debt marked as active!' : 'Debt marked as settled!' });
    setTimeout(() => setMsg(null), 2000);
  };

  // Metrics
  const pendingDebts = debts.filter(d => !d.isPaid);
  const settledDebts = debts.filter(d => d.isPaid);

  const pendingBorrowed = pendingDebts.filter(d => d.type === 'borrowed' || !d.type);
  const pendingLent = pendingDebts.filter(d => d.type === 'lent');

  const totalBorrowedOutstanding = pendingBorrowed.reduce((sum, d) => sum + d.amount, 0);
  const totalLentOutstanding = pendingLent.reduce((sum, d) => sum + d.amount, 0);
  const totalSettled = settledDebts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>🤝 Debts Tracker</h2>
      <p className={styles.pageSub}>Manage money you owe to others and money others owe to you</p>

      {/* Debt Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.outstandingBorrowedCard}`}>
          <span className={styles.metricLabel}>You Owe (Taken)</span>
          <span className={styles.metricValue}>{formatINR(totalBorrowedOutstanding)}</span>
          <p className={styles.metricSub}>{pendingBorrowed.length} active liabilities</p>
        </div>
        <div className={`${styles.metricCard} ${styles.outstandingLentCard}`}>
          <span className={styles.metricLabel}>Owed to You (Given)</span>
          <span className={styles.metricValue}>{formatINR(totalLentOutstanding)}</span>
          <p className={styles.metricSub}>{pendingLent.length} active assets</p>
        </div>
        <div className={`${styles.metricCard} ${styles.settledCard}`}>
          <span className={styles.metricLabel}>Total Settled</span>
          <span className={styles.metricValue}>{formatINR(totalSettled)}</span>
          <p className={styles.metricSub}>{settledDebts.length} settled logs</p>
        </div>
      </div>

      {/* Main Grid: Form + Lists */}
      <div className={styles.mainGrid}>
        {/* Form Card */}
        <div className={styles.formCard}>
          <h3 className={styles.formHeading}>
            {form.type === 'borrowed' ? 'Record New Borrowing' : 'Record New Lending'}
          </h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Transaction Type</label>
              <div className={styles.typeSelector}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${form.type === 'borrowed' ? styles.typeBtnActiveBorrowed : ''}`}
                  onClick={() => setForm(f => ({ ...f, type: 'borrowed' }))}
                >
                  📥 Took (Borrowed)
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${form.type === 'lent' ? styles.typeBtnActiveLent : ''}`}
                  onClick={() => setForm(f => ({ ...f, type: 'lent' }))}
                >
                  📤 Gave (Lent)
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                {form.type === 'borrowed' ? 'Who did you borrow from?' : 'Who did you lend to?'}
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder={form.type === 'borrowed' ? 'e.g. Rahul, Bank' : 'e.g. Amit, Priya'}
                value={form.person}
                onChange={set('person')}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Amount (₹)</label>
              <input
                type="number"
                className={styles.input}
                placeholder="0"
                value={form.amount}
                onChange={set('amount')}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.date}
                onChange={set('date')}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Purpose / Description</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Metro fare, dinner sharing"
                value={form.desc}
                onChange={set('desc')}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              {form.type === 'borrowed' ? 'Add Borrowed Debt' : 'Add Lent Debt'}
            </button>
          </form>
          {msg && (
            <p className={`${styles.msg} ${msg.type === 'error' ? styles.error : styles.success}`}>
              {msg.text}
            </p>
          )}
        </div>

        {/* Debt lists */}
        <div className={styles.listsContainer}>
          {/* Outstanding Section */}
          <div className={styles.listSection}>
            <h4 className={styles.sectionTitle}>⚠️ Active Debts ({pendingDebts.length})</h4>
            {pendingDebts.length === 0 ? (
              <p className={styles.emptyListText}>No outstanding debts! You are all clear. 🎉</p>
            ) : (
              <div className={styles.debtsList}>
                {pendingDebts.map(d => (
                  <div key={d.id} className={styles.debtRow}>
                    <div className={styles.debtInfo}>
                      <span className={styles.personName}>
                        {d.person}
                        <span className={`${styles.badge} ${d.type === 'lent' ? styles.badgeLent : styles.badgeBorrowed}`}>
                          {d.type === 'lent' ? 'Gave' : 'Took'}
                        </span>
                      </span>
                      <span className={styles.debtDesc}>{d.desc}</span>
                      <span className={styles.debtDate}>{formatDate(d.date)}</span>
                    </div>
                    <div className={styles.debtActions}>
                      <span className={styles.pendingAmount} style={{ color: d.type === 'lent' ? '#10b981' : '#f43f5e' }}>
                        {formatINR(d.amount)}
                      </span>
                      <button
                        className={styles.settleBtn}
                        onClick={() => handleSettleDebt(d)}
                        title="Mark as Settled"
                      >
                        Settle
                      </button>
                      <button
                        className={styles.delBtn}
                        onClick={() => deleteDebt(d.id)}
                        aria-label="Delete debt record"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settled Section */}
          <div className={styles.listSection}>
            <h4 className={styles.sectionTitle}>✅ Settled ({settledDebts.length})</h4>
            {settledDebts.length === 0 ? (
              <p className={styles.emptyListText}>No settled logs yet.</p>
            ) : (
              <div className={styles.debtsList}>
                {settledDebts.map(d => (
                  <div key={d.id} className={`${styles.debtRow} ${styles.settledRow}`}>
                    <div className={styles.debtInfo}>
                      <span className={styles.personName}>
                        {d.person}
                        <span className={`${styles.badge} ${d.type === 'lent' ? styles.badgeLent : styles.badgeBorrowed}`}>
                          {d.type === 'lent' ? 'Gave' : 'Took'}
                        </span>
                      </span>
                      <span className={styles.debtDesc}>{d.desc}</span>
                      <span className={styles.debtDate}>{formatDate(d.date)}</span>
                    </div>
                    <div className={styles.debtActions}>
                      <span className={styles.settledAmount}>
                        {formatINR(d.amount)}
                      </span>
                      <button
                        className={styles.unsettleBtn}
                        onClick={() => toggleDebtPaid(d.id)}
                        title="Mark as Unsettled"
                      >
                        Undo
                      </button>
                      <button
                        className={styles.delBtn}
                        onClick={() => deleteDebt(d.id)}
                        aria-label="Delete debt record"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
