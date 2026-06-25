import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './components/Splash';
import SupportBall from './components/SupportBall';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import { API_URL, getAuthHeaders } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login state on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        
        try {
          // Verify with server in the background
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: getAuthHeaders(),
          });
          
          if (res.ok) {
            const data = await res.json();
            setUser({
              name: data.name,
              email: data.email,
              phone: data.phone,
              isAdmin: data.isAdmin,
            });
            localStorage.setItem('user', JSON.stringify(data));
          } else {
            // Token expired or invalid
            handleLogout();
          }
        } catch (error) {
          console.error('Session check failed:', error);
          // Keep local state on network error, don't force logout immediately
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      isAdmin: userData.isAdmin,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <Splash />;
  }

  return (
    <BrowserRouter>
      {/* Splash Screen on load */}
      <Splash />
      
      <Routes>
        <Route path="/" element={<Home user={user} handleLogout={handleLogout} />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to={user.isAdmin ? "/admin" : "/"} replace /> : <Login handleLoginSuccess={handleLoginSuccess} />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/" replace /> : <Signup handleLoginSuccess={handleLoginSuccess} />} 
        />
        <Route path="/orders" element={<Orders user={user} />} />
        <Route 
          path="/admin" 
          element={user && user.isAdmin ? <AdminDashboard user={user} handleLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating Support widget available on all views */}
      <SupportBall />
    </BrowserRouter>
  );
}

export default App;
