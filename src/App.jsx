import { useEffect } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import Navbar from './components/Layout/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Expenses from './components/Expenses/Expenses';
import Debts from './components/Layout/Debts';
import AddExpense from './components/AddExpense/AddExpense';
import HabitsDashboard from './components/Habits/HabitsDashboard';
import './App.css';

function PageRouter() {
  const { activeTab } = useExpenses();
  if (activeTab === 'dashboard') return <Dashboard />;
  if (activeTab === 'expenses')  return <Expenses />;
  if (activeTab === 'debts')     return <Debts />;
  if (activeTab === 'add')       return <AddExpense />;
  if (activeTab === 'habits')    return <HabitsDashboard />;
  return null;
}

function AppContent() {
  const { theme } = useExpenses();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <Navbar />
      <main>
        <PageRouter />
      </main>
    </>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}
