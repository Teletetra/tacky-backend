import { useEffect } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Expenses from './components/Expenses/Expenses';
import Debts from './components/Layout/Debts';
import AddExpense from './components/AddExpense/AddExpense';
import HabitsDashboard from './components/Habits/HabitsDashboard';
import AuthPage from './components/Auth/AuthPage';
import './App.css';

function PageRouter() {
  const { activeTab } = useExpenses();
  if (activeTab === 'dashboard') return <Dashboard />;
  if (activeTab === 'expenses') return <Expenses />;
  if (activeTab === 'debts') return <Debts />;
  if (activeTab === 'add') return <AddExpense />;
  if (activeTab === 'habits') return <HabitsDashboard />;
  return null;
}

function AppContent() {
  const { theme } = useExpenses();
  const { user, loading } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ fontWeight: '500', fontSize: '15px', color: 'var(--text-secondary)' }}>Loading your dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

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
    <AuthProvider>
      <ExpenseProvider>
        <AppContent />
      </ExpenseProvider>
    </AuthProvider>
  );
}
// sj