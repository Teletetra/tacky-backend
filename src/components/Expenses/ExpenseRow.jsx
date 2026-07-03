import { useExpenses } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import styles from './ExpenseRow.module.css';

export default function ExpenseRow({ expense, onDelete, onEdit }) {
  const { categories } = useExpenses();
  const cat = categories[expense.cat] || { label: expense.cat, color: '#888780', icon: '🏷' };
  const isIncome = expense.type === 'income';

  return (
    <div className={styles.row}>
      <span className={styles.desc}>{expense.desc}</span>
      <span className={styles.badge} style={{ background: cat.color + '1a', color: cat.color }}>
        {cat.icon} {cat.label}
      </span>
      {expense.recurring && expense.interval && expense.interval !== 'none' && (
        <span className={styles.recurringBadge} title={`Repeats ${expense.interval}`}>
          🔁 {expense.interval}
        </span>
      )}
      <span className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}>
        {isIncome ? '+' : '-'} {formatINR(expense.amount)}
      </span>
      <div className={styles.actions}>
        {onEdit && (
          <button className={styles.edit} onClick={() => onEdit(expense)} aria-label="Edit expense">
            ✏️
          </button>
        )}
        <button className={styles.del} onClick={() => onDelete(expense.id)} aria-label="Delete expense">
          ✕
        </button>
      </div>
    </div>
  );
}
