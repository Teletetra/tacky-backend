# 💰 Kharcha — Expense Tracker

A React expense tracker preloaded with your June 2025 spending data.

## Project Structure

```
expense-tracker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx          # Top nav with tab switching
│   │   │   └── Navbar.module.css
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx       # Bar chart, pie chart, metrics
│   │   │   ├── Dashboard.module.css
│   │   │   ├── MetricCard.jsx      # Reusable stat card
│   │   │   ├── MetricCard.module.css
│   │   │   ├── CategoryBars.jsx    # Horizontal category bars
│   │   │   └── CategoryBars.module.css
│   │   ├── Expenses/
│   │   │   ├── Expenses.jsx        # List grouped by date
│   │   │   ├── Expenses.module.css
│   │   │   ├── ExpenseRow.jsx      # Single expense row with delete
│   │   │   └── ExpenseRow.module.css
│   │   └── AddExpense/
│   │       ├── AddExpense.jsx      # Form to add new expenses
│   │       └── AddExpense.module.css
│   ├── context/
│   │   └── ExpenseContext.js       # Global state via useReducer
│   ├── data/
│   │   └── initialExpenses.js      # Your June 2025 data + CATEGORIES
│   ├── hooks/
│   │   └── useAnalytics.js         # Derived analytics (memoized)
│   ├── utils/
│   │   └── formatters.js           # formatINR, formatDate, groupByDate
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## Quick Start

```bash
cd expense-tracker
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Dashboard** — 4 metric cards, daily bar chart, category horizontal bars, doughnut pie chart
- **Expenses** — all entries grouped by date, deletable per row
- **Add Expense** — form with date, amount, description, category
- **Global state** — `useReducer` + Context API (no Redux needed)
- **CSS Modules** — scoped styles, no className collisions
- **Recharts** — for all charts

## Extending

- **Persist data**: swap `initialExpenses` with `localStorage` read in `ExpenseContext.js`
- **Month filter**: add a month selector in `Expenses.jsx` and filter in `useAnalytics`
- **Export CSV**: add a button in `Expenses.jsx` that serializes `expenses` array
