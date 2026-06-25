import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../utils/api';
import { Mail, Lock, UserPlus, Phone, User as UserIcon, ArrowLeft } from 'lucide-react';

const Signup = ({ handleLoginSuccess }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (phone.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
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

        // Redirect: check if they have a saved booking form, if yes, redirect to home booking
        const savedCalc = localStorage.getItem('saved_calc');
        if (savedCalc) {
          navigate('/#booking');
        } else {
          navigate('/');
        }
      } else {
        setError(data.message || 'Registration failed. Try again.');
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
          <h2>Create Account</h2>
          <p>Sign up to place plate decoration orders</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="calc-form-group">
            <label htmlFor="name"><UserIcon size={12} style={{marginRight: '4px', verticalAlign:'middle'}}/> Full Name</label>
            <input
              type="text"
              id="name"
              className="calc-input"
              placeholder="Your Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <label htmlFor="phone"><Phone size={12} style={{marginRight: '4px', verticalAlign:'middle'}}/> Mobile Number</label>
            <input
              type="tel"
              id="phone"
              className="calc-input"
              placeholder="e.g. 9677015928"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="calc-form-group">
            <label htmlFor="password"><Lock size={12} style={{marginRight: '4px', verticalAlign:'middle'}}/> Password</label>
            <input
              type="password"
              id="password"
              className="calc-input"
              placeholder="Min 6 characters"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="calc-book-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <UserPlus size={18} />
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
