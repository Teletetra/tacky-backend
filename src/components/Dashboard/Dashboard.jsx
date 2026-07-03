import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { useExpenses } from '../../context/ExpenseContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatINR } from '../../utils/formatters';
import MetricCard from './MetricCard';
import CategoryBars from './CategoryBars';
import ExpenseRow from '../Expenses/ExpenseRow';
import EditExpenseModal from '../Expenses/EditExpenseModal';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { expenses, deleteExpense, editExpense, theme } = useExpenses();
  const {
    total,
    totalIncome,
    netBalance,
    categorySorted,
    dailyData,
    weeklyData,
    monthlyData,
    uniqueDays,
    avgPerDay,
    topCategory,
    pieData,
  } = useAnalytics(expenses);

  const [filterType, setFilterType] = useState('days');
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const chartData = useMemo(() => {
    if (filterType === 'days') return dailyData;
    if (filterType === 'weeks') return weeklyData;
    return monthlyData;
  }, [filterType, dailyData, weeklyData, monthlyData]);

  const selectedPeriod = useMemo(() => {
    return chartData.find(d => d.key === selectedPeriodKey);
  }, [chartData, selectedPeriodKey]);

  const hasSelection = selectedPeriodKey !== null;

  // Theme-aware colors
  const expenseBarColor = theme === 'purple' ? '#a855f7' : theme === 'dark' ? '#3b82f6' : '#378ADD';
  const incomeBarColor = '#10b981';

  return (
    <div className={styles.page}>
      {/* Metric cards */}
      <div className={styles.metricGrid}>
        <MetricCard label="Total Spent" value={formatINR(total)} sub="June 2025" />
        <MetricCard label="Total Income" value={formatINR(totalIncome)} sub="June 2025" valueColor="#10b981" />
        <MetricCard
          label="Net Balance"
          value={(netBalance >= 0 ? '+' : '-') + ' ' + formatINR(Math.abs(netBalance))}
          sub="June 2025"
          valueColor={netBalance >= 0 ? '#10b981' : '#f43f5e'}
        />
        <MetricCard label="Daily Average (Spent)" value={formatINR(avgPerDay)} sub={`over ${uniqueDays} days`} />
        <MetricCard
          label="Top Category (Spent)"
          value={topCategory?.label || '—'}
          sub={topCategory ? formatINR(topCategory.amount) : ''}
        />
      </div>

      {/* Spending bar chart with day/week/month filter */}
      <section className={styles.section}>
        <div className={styles.chartHeader}>
          <h3 className={styles.sectionTitle}>
            {filterType === 'days' ? 'Daily' : filterType === 'weeks' ? 'Weekly' : 'Monthly'} Cash Flow
          </h3>
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterBtn} ${filterType === 'days' ? styles.active : ''}`}
              onClick={() => { setFilterType('days'); setSelectedPeriodKey(null); }}
            >
              Days
            </button>
            <button
              className={`${styles.filterBtn} ${filterType === 'weeks' ? styles.active : ''}`}
              onClick={() => { setFilterType('weeks'); setSelectedPeriodKey(null); }}
            >
              Weeks
            </button>
            <button
              className={`${styles.filterBtn} ${filterType === 'months' ? styles.active : ''}`}
              onClick={() => { setFilterType('months'); setSelectedPeriodKey(null); }}
            >
              Months
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
              formatter={v => `₹${v.toLocaleString('en-IN')}`}
            />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            
            <Bar
              dataKey="income"
              name="Income"
              radius={[4, 4, 0, 0]}
              onClick={(payload) => {
                if (payload && payload.key) {
                  setSelectedPeriodKey(prev => prev === payload.key ? null : payload.key);
                }
              }}
            >
              {chartData.map((entry, index) => {
                const isSelected = entry.key === selectedPeriodKey;
                const fill = hasSelection ? (isSelected ? incomeBarColor : 'var(--border-color)') : incomeBarColor;
                return (
                  <Cell
                    key={`cell-inc-${index}`}
                    fill={fill}
                    style={{ transition: 'fill 0.2s ease' }}
                    cursor="pointer"
                  />
                );
              })}
            </Bar>

            <Bar
              dataKey="expense"
              name="Expense"
              radius={[4, 4, 0, 0]}
              onClick={(payload) => {
                if (payload && payload.key) {
                  setSelectedPeriodKey(prev => prev === payload.key ? null : payload.key);
                }
              }}
            >
              {chartData.map((entry, index) => {
                const isSelected = entry.key === selectedPeriodKey;
                const fill = hasSelection ? (isSelected ? expenseBarColor : 'var(--border-color)') : expenseBarColor;
                return (
                  <Cell
                    key={`cell-exp-${index}`}
                    fill={fill}
                    style={{ transition: 'fill 0.2s ease' }}
                    cursor="pointer"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Selected period transactions */}
        {selectedPeriod ? (
          <div className={styles.transactionsContainer}>
            <div className={styles.transactionsHeader}>
              <div>
                <h4 className={styles.transactionsTitle}>
                  Transactions for {selectedPeriod.label}
                </h4>
                <p className={styles.transactionsSubtitle}>
                  Inflow: {formatINR(selectedPeriod.income)} • Outflow: {formatINR(selectedPeriod.expense)}
                </p>
              </div>
              <button
                className={styles.closeTransactionsBtn}
                onClick={() => setSelectedPeriodKey(null)}
                aria-label="Close transactions list"
              >
                ✕
              </button>
            </div>
            <div className={styles.transactionsList}>
              {selectedPeriod.transactions.map(e => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  onDelete={deleteExpense}
                  onEdit={setEditingExpense}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.chartTip}>💡 Click on a bar to view transactions for that period</p>
        )}
      </section>

      {/* Category bars */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Category Spending Breakdown</h3>
        <CategoryBars categorySorted={categorySorted} total={total} />
      </section>

      {/* Pie chart */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Category Distribution</h3>
        {pieData.length === 0 ? (
          <p className={styles.chartTip}>No expenses logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: 'var(--text-primary)' }}
                formatter={v => `₹${v.toLocaleString('en-IN')}`}
              />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Edit modal */}
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
