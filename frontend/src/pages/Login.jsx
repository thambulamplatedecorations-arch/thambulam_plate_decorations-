import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../utils/api';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';

const Login = ({ handleLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save token and user details to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          isAdmin: data.isAdmin,
        }));
        
        handleLoginSuccess(data);

        // Redirect based on role
        if (data.isAdmin) {
          navigate('/admin');
        } else {
          // If there's a saved booking, send them back to the Home page booking section
          const savedCalc = localStorage.getItem('saved_calc');
          if (savedCalc) {
            navigate('/#booking');
          } else {
            navigate('/');
          }
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to the authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass auth-card">
        <Link to="/" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to place orders and track delivery</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="calc-form-group">
            <label htmlFor="email"><Mail size={12} style={{marginRight: '4px', verticalAlign:'middle'}}/> Email Address</label>
            <input
              type="email"
              id="email"
              className="calc-input"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="calc-form-group">
            <label htmlFor="password"><Lock size={12} style={{marginRight: '4px', verticalAlign:'middle'}}/> Password</label>
            <input
              type="password"
              id="password"
              className="calc-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="calc-book-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogIn size={18} />
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
