import styles from './MetricCard.module.css';

export default function MetricCard({ label, value, sub, valueColor }) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value} style={valueColor ? { color: valueColor } : {}}>{value}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}
