import { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { groupByDate, formatDate, formatINR } from '../../utils/formatters';
import ExpenseRow from './ExpenseRow';
import EditExpenseModal from './EditExpenseModal';
import styles from './Expenses.module.css';

export default function Expenses() {
  const { expenses, deleteExpense, editExpense, categories, addExpense } = useExpenses();
  const [editingExpense, setEditingExpense] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Recurring panel state
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);
  const [postMsg, setPostMsg] = useState(null);

  // Filter logic
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || e.cat === filterCat;
    const matchesType = filterType === 'all' || 
      (filterType === 'expense' ? e.type !== 'income' : e.type === 'income');
    return matchesSearch && matchesCat && matchesType;
  });

  // Calculate totals for current selection
  const totalExpenses = filteredExpenses
    .filter(e => e.type !== 'income')
    .reduce((s, e) => s + e.amount, 0);

  const totalIncome = filteredExpenses
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);

  const netTotal = totalIncome - totalExpenses;

  const groups = groupByDate(filteredExpenses);

  // Find all repeatable items
  const recurringTemplates = expenses.filter(e => e.recurring && e.interval && e.interval !== 'none');

  const handlePostInstance = (item) => {
    addExpense({
      date: new Date().toISOString().split('T')[0],
      amount: item.amount,
      desc: `${item.desc} (Auto-posted)`,
      cat: item.cat,
      type: item.type || 'expense',
      recurring: false,
    });
    setPostMsg(`Successfully posted instance: "${item.desc}"!`);
    setTimeout(() => setPostMsg(null), 3000);
  };

  return (
    <div className={styles.page}>
      {/* Search and Filters Bar */}
      <div className={styles.filtersCard}>
        <div className={styles.searchRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="🔍 Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className={`${styles.recurringToggleBtn} ${recurringTemplates.length > 0 ? styles.hasItems : ''}`}
            onClick={() => setShowRecurringPanel(!showRecurringPanel)}
          >
            🔁 Recurring ({recurringTemplates.length})
          </button>
        </div>

        <div className={styles.filterOptions}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Type</label>
            <select className={styles.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Category</label>
            <select className={styles.select} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label} ({cat.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toast notification for posted instance */}
      {postMsg && <div className={styles.toast}>{postMsg}</div>}

      {/* Collapsible Recurring items panel */}
      {showRecurringPanel && (
        <div className={styles.recurringPanel}>
          <div className={styles.recurringPanelHeader}>
            <h4 className={styles.recurringPanelTitle}>🔁 Repeatable Templates</h4>
            <span className={styles.recurringPanelSub}>Click "Post" to generate a transaction for today.</span>
          </div>
          {recurringTemplates.length === 0 ? (
            <p className={styles.noRecurringText}>No repeatable transactions found. Create one in the Add tab!</p>
          ) : (
            <div className={styles.recurringList}>
              {recurringTemplates.map(item => {
                const catInfo = categories[item.cat] || { label: item.cat, icon: '🏷️' };
                return (
                  <div key={item.id} className={styles.recurringRow}>
                    <div className={styles.recurringInfo}>
                      <span className={styles.recurringDesc}>{item.desc}</span>
                      <span className={styles.recurringMeta}>
                        {catInfo.icon} {catInfo.label} • {item.interval}
                      </span>
                    </div>
                    <div className={styles.recurringActionGroup}>
                      <span className={item.type === 'income' ? styles.incomeAmt : styles.expenseAmt}>
                        {item.type === 'income' ? '+' : '-'} {formatINR(item.amount)}
                      </span>
                      <button
                        className={styles.postBtn}
                        onClick={() => handlePostInstance(item)}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary totals */}
      <div className={styles.totalBar}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Income</span>
          <span className={styles.totalValIncome}>{formatINR(totalIncome)}</span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Expenses</span>
          <span className={styles.totalValExpense}>{formatINR(totalExpenses)}</span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Net Balance</span>
          <span className={`${styles.totalValNet} ${netTotal >= 0 ? styles.netPositive : styles.netNegative}`}>
            {netTotal >= 0 ? '+' : ''}{formatINR(netTotal)}
          </span>
        </div>
      </div>

      {/* Transactions List */}
      {Object.keys(groups).length === 0 ? (
        <div className={styles.emptyState}>
          <p>No transactions match your search/filter criteria.</p>
        </div>
      ) : (
        Object.entries(groups).map(([date, exps]) => {
          const dayExpenses = exps.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
          const dayIncome = exps.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
          const dayNet = dayIncome - dayExpenses;
          
          return (
            <div key={date} className={styles.group}>
              <div className={styles.dateHeader}>
                <span>{formatDate(date)}</span>
                <span className={`${styles.dayTotal} ${dayNet >= 0 ? styles.dayNetPositive : styles.dayNetNegative}`}>
                  {dayNet >= 0 ? '+' : ''}{formatINR(dayNet)}
                </span>
              </div>
              {exps.map(e => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  onDelete={deleteExpense}
                  onEdit={setEditingExpense}
                />
              ))}
            </div>
          );
        })
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={editExpense}
        />
      )}
    </div>
  );
}
