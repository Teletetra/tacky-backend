import { useMemo } from 'react';
import { CATEGORIES } from '../data/initialExpenses';

export function useAnalytics(expenses) {
  return useMemo(() => {
    // Separate income vs expenses
    const total = expenses
      .filter(e => e.type !== 'income')
      .reduce((s, e) => s + e.amount, 0);

    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((s, e) => s + e.amount, 0);

    const netBalance = totalIncome - total;

    // Category totals for expenses only
    const byCategory = {};
    expenses
      .filter(e => e.type !== 'income')
      .forEach(e => {
        byCategory[e.cat] = (byCategory[e.cat] || 0) + e.amount;
      });
    const categorySorted = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => {
        const catInfo = CATEGORIES[cat] || { label: cat, color: '#888780', icon: '📦' };
        return {
          cat,
          amount,
          label: `${catInfo.icon || ''} ${catInfo.label}`,
          color: catInfo.color,
        };
      });

    // Parse date safely without timezone offset issues
    const parseLocalDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // Daily totals (Income vs Expenses)
    const byDate = {};
    expenses.forEach(e => {
      if (!byDate[e.date]) {
        byDate[e.date] = { income: 0, expense: 0, transactions: [] };
      }
      if (e.type === 'income') {
        byDate[e.date].income += e.amount;
      } else {
        byDate[e.date].expense += e.amount;
      }
      byDate[e.date].transactions.push(e);
    });
    const dailyData = Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => {
        const [, m, d] = date.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLabel = months[parseInt(m) - 1];
        return {
          key: date,
          label: `${parseInt(d)} ${monthLabel}`,
          income: Math.round(data.income),
          expense: Math.round(data.expense),
          amount: Math.round(data.expense), // compatibility fallback
          transactions: data.transactions.sort((a, b) => b.amount - a.amount),
        };
      });

    // Weekly totals (Income vs Expenses)
    const byWeek = {};
    expenses.forEach(e => {
      const date = parseLocalDate(e.date);
      const day = date.getDay(); // 0 is Sunday
      const diff = date.getDate() - day; // Adjust to Sunday
      const sunday = new Date(date.setDate(diff));
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const formatDateStr = (d) => {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      };

      const yyyymmdd = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayStr}`;
      };

      const weekStart = yyyymmdd(sunday);
      const label = `${formatDateStr(sunday)} - ${formatDateStr(saturday)}`;

      if (!byWeek[weekStart]) {
        byWeek[weekStart] = { label, income: 0, expense: 0, transactions: [] };
      }
      if (e.type === 'income') {
        byWeek[weekStart].income += e.amount;
      } else {
        byWeek[weekStart].expense += e.amount;
      }
      byWeek[weekStart].transactions.push(e);
    });
    const weeklyData = Object.entries(byWeek)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({
        key,
        label: data.label,
        income: Math.round(data.income),
        expense: Math.round(data.expense),
        amount: Math.round(data.expense), // compatibility fallback
        transactions: data.transactions.sort((a, b) => b.amount - a.amount),
      }));

    // Monthly totals (Income vs Expenses)
    const byMonth = {};
    expenses.forEach(e => {
      const [year, month] = e.date.split('-');
      const key = `${year}-${month}`;
      const monthName = parseLocalDate(e.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!byMonth[key]) {
        byMonth[key] = { label: monthName, income: 0, expense: 0, transactions: [] };
      }
      if (e.type === 'income') {
        byMonth[key].income += e.amount;
      } else {
        byMonth[key].expense += e.amount;
      }
      byMonth[key].transactions.push(e);
    });
    const monthlyData = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({
        key,
        label: data.label,
        income: Math.round(data.income),
        expense: Math.round(data.expense),
        amount: Math.round(data.expense), // compatibility fallback
        transactions: data.transactions.sort((a, b) => b.amount - a.amount),
      }));

    const uniqueDays = Object.keys(byDate).length;
    const avgPerDay = uniqueDays ? total / uniqueDays : 0;
    const topCategory = categorySorted[0] || null;

    // Pie chart data (Expenses only)
    const pieData = categorySorted.map(c => ({
      name: c.label,
      value: Math.round(c.amount),
      color: c.color,
    }));

    return {
      total,
      totalIncome,
      netBalance,
      byCategory,
      categorySorted,
      dailyData,
      weeklyData,
      monthlyData,
      uniqueDays,
      avgPerDay,
      topCategory,
      pieData,
    };
  }, [expenses]);
}
