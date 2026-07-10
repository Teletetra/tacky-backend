import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialExpenses, CATEGORIES } from '../data/initialExpenses';
import { apiFetch } from '../utils/auth';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext(null);

let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/api';
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'SET_DEBTS':
      return { ...state, debts: action.payload };
    case 'ADD':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'DELETE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) };
    case 'EDIT':
      return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'ADD_CATEGORY':
      return { ...state, categories: { ...state.categories, [action.payload.id]: action.payload } };
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };
    case 'DELETE_DEBT':
      return { ...state, debts: state.debts.filter(d => d.id !== action.id) };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    default:
      return state;
  }
}

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    expenses: [], // Loaded from DB
    categories: JSON.parse(localStorage.getItem('kharcha-categories')) || CATEGORIES,
    debts: [], // Loaded from DB
    activeTab: 'dashboard',
    theme: localStorage.getItem('kharcha-theme') || 'purple',
  });

  const { user } = useAuth();

  // Fetch initial data from MongoDB via FastAPI when user state changes
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_EXPENSES', payload: [] });
      dispatch({ type: 'SET_DEBTS', payload: [] });
      return;
    }

    apiFetch(`${API_BASE}/expenses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => dispatch({ type: 'SET_EXPENSES', payload: data }))
      .catch(err => console.error("Error fetching expenses:", err));

    apiFetch(`${API_BASE}/debts`)
      .then(res => res.ok ? res.json() : [])
      .then(data => dispatch({ type: 'SET_DEBTS', payload: data }))
      .catch(err => console.error("Error fetching debts:", err));
  }, [user]);

  // Sync remaining local config to localStorage
  useEffect(() => {
    localStorage.setItem('kharcha-categories', JSON.stringify(state.categories));
  }, [state.categories]);

  useEffect(() => {
    localStorage.setItem('kharcha-theme', state.theme);
  }, [state.theme]);

  // Async Actions mapped to Backend
  const addExpense = async (expense) => {
    try {
      const res = await apiFetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'ADD', payload: data });
      }
    } catch (err) { console.error(err); }
  };

  const deleteExpense = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch({ type: 'DELETE', id });
      }
    } catch (err) { console.error(err); }
  };

  const editExpense = async (expense) => {
    try {
      const res = await apiFetch(`${API_BASE}/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'EDIT', payload: data });
      }
    } catch (err) { console.error(err); }
  };

  const addCategory = (category) => dispatch({ type: 'ADD_CATEGORY', payload: category });

  const addDebt = async (debt) => {
    try {
      const res = await apiFetch(`${API_BASE}/debts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debt)
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'ADD_DEBT', payload: data });
      }
    } catch (err) { console.error(err); }
  };

  const deleteDebt = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE}/debts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch({ type: 'DELETE_DEBT', id });
      }
    } catch (err) { console.error(err); }
  };

  const toggleDebtPaid = async (id) => {
    try {
      const debt = state.debts.find(d => d.id === id);
      if (!debt) return;
      const res = await apiFetch(`${API_BASE}/debts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...debt, isPaid: !debt.isPaid })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({
          type: 'SET_DEBTS',
          payload: state.debts.map(d => d.id === id ? data : d)
        });
      }
    } catch (err) { console.error(err); }
  };

  const setTab = (tab) => dispatch({ type: 'SET_TAB', tab });
  const setTheme = (theme) => dispatch({ type: 'SET_THEME', theme });

  return (
    <ExpenseContext.Provider value={{
      ...state,
      addExpense,
      deleteExpense,
      editExpense,
      addCategory,
      addDebt,
      deleteDebt,
      toggleDebtPaid,
      setTab,
      setTheme,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  return useContext(ExpenseContext);
}
