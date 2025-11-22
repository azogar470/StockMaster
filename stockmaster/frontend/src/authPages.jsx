import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from './apiClient';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <div className="auth-links">
        <Link to="/signup">Sign up</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button type="submit">Create Account</button>
      </form>
      <div className="auth-links">
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleRequest(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/request-otp', { email });
      setMessage(`OTP generated (demo): ${res.otp}`);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password updated. You can now log in.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <h1>Reset Password</h1>
      {step === 'request' ? (
        <form onSubmit={handleRequest} className="auth-form">
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          {error && <div className="error">{error}</div>}
          {message && <div className="info">{message}</div>}
          <button type="submit">Request OTP</button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="auth-form">
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          {error && <div className="error">{error}</div>}
          {message && <div className="info">{message}</div>}
          <button type="submit">Reset Password</button>
        </form>
      )}
      <div className="auth-links">
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}
