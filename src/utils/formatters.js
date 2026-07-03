export function formatINR(amount) {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function groupByDate(expenses) {
  const groups = {};
  [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
  return groups;
}
