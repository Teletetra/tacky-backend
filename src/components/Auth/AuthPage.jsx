import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { login, register, loading, error, setError } = useAuth();

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setValidationError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    // Basic Validation
    if (!username.trim() || !password) {
      setValidationError('All fields are required.');
      return;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (isLogin) {
      await login(username.trim(), password);
    } else {
      await register(username.trim(), password);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.decorativeBlob1}></div>
      <div className={styles.decorativeBlob2}></div>

      <div className={styles.authCard}>
        <div className={styles.brandSection}>
          <div className={styles.logo}>💰</div>
          <h1 className={styles.title}>Kharcha</h1>
          <p className={styles.subtitle}>Your Personal Finance & Habit Companion</p>
        </div>

        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeBtn} ${isLogin ? styles.activeMode : ''}`}
            onClick={() => !isLogin && handleToggleMode()}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`${styles.modeBtn} ${!isLogin ? styles.activeMode : ''}`}
            onClick={() => isLogin && handleToggleMode()}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {(validationError || error) && (
            <div className={styles.alert}>
              <span>⚠️</span>
              <p>{validationError || error}</p>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              className={styles.input}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className={`${styles.submitBtn} ${loading ? styles.loadingBtn : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner}></span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.footerText}>
          {isLogin ? (
            <p>
              New here?{' '}
              <span className={styles.link} onClick={handleToggleMode}>
                Create an account
              </span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span className={styles.link} onClick={handleToggleMode}>
                Sign in instead
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
