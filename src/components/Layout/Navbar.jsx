import { useExpenses } from '../../context/ExpenseContext';
import styles from './Navbar.module.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expenses',  label: 'Expenses',  icon: '📋' },
  { id: 'debts',     label: 'Debts',     icon: '🤝' },
  { id: 'add',       label: 'Add',       icon: '➕' },
  { id: 'habits',    label: 'Habits',    icon: '🎯' },
];

export default function Navbar() {
  const { activeTab, setTab, theme, setTheme } = useExpenses();

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>💰 Kharcha</div>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className={styles.icon}>{t.icon}</span>
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.themeSelector}>
        <button
          className={`${styles.themeBtn} ${theme === 'white' ? styles.themeActive : ''}`}
          onClick={() => setTheme('white')}
          title="Light Theme"
          aria-label="Light theme"
        >
          ☀️
        </button>
        <button
          className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeActive : ''}`}
          onClick={() => setTheme('dark')}
          title="Dark Theme"
          aria-label="Dark theme"
        >
          🌙
        </button>
        <button
          className={`${styles.themeBtn} ${theme === 'purple' ? styles.themeActive : ''}`}
          onClick={() => setTheme('purple')}
          title="Purple Theme"
          aria-label="Purple theme"
        >
          🔮
        </button>
      </div>
    </nav>
  );
}
