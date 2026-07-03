import { formatINR } from '../../utils/formatters';
import styles from './CategoryBars.module.css';

export default function CategoryBars({ categorySorted, total }) {
  const max = categorySorted[0]?.amount || 1;
  return (
    <div className={styles.wrap}>
      {categorySorted.map(({ cat, label, amount, color }) => (
        <div key={cat} className={styles.row}>
          <span className={styles.label}>{label}</span>
          <div className={styles.barBg}>
            <div
              className={styles.barFill}
              style={{ width: `${(amount / max) * 100}%`, background: color }}
            />
          </div>
          <span className={styles.val}>
            {formatINR(amount)}
            <span className={styles.pct}> {Math.round((amount / total) * 100)}%</span>
          </span>
        </div>
      ))}
    </div>
  );
}
