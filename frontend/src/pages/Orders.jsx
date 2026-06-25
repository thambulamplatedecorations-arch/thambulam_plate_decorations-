import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL, getAuthHeaders } from '../utils/api';
import { Calendar, Clock, MapPin, ShoppingBag, ArrowLeft, RefreshCw } from 'lucide-react';

const Orders = ({ user }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to retrieve orders.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="orders-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Link to="/" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-gold)', fontFamily: 'var(--font-serif)' }}>My Plate Decoration Bookings</h2>
        </div>
        <button onClick={fetchOrders} className="nav-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }} title="Refresh">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gold)' }}>Loading your orders...</div>
      ) : error ? (
        <div className="auth-error" style={{ maxWidth: '600px', margin: '0 auto' }}>{error}</div>
      ) : orders.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <ShoppingBag size={48} style={{ color: 'var(--primary-gold)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '12px', color: 'var(--text-white)' }}>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-gray)', marginBottom: '24px' }}>
            Calculate and choose your plate decoration packages directly from our interactive planner.
          </p>
          <Link to="/#booking" className="calc-book-btn" style={{ display: 'inline-block', width: 'auto', padding: '12px 30px' }}>
            Calculate & Book Plates
          </Link>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="glass order-card">
              <div className="order-header">
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>ORDER ID:</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-gold)', marginLeft: '6px', fontFamily: 'monospace' }}>{order._id}</span>
                </div>
                <span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span>
              </div>

              <div className="order-details-grid">
                <div className="order-detail-item">
                  <label>Package Selected</label>
                  <p>{order.packageName}</p>
                </div>
                <div className="order-detail-item">
                  <label>Plate Count</label>
                  <p>{order.plateCount} Plates</p>
                </div>
                <div className="order-detail-item">
                  <label>Event Date & Time</label>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem' }}>
                    <Calendar size={14} color="var(--primary-gold)" />
                    {formatDate(order.eventDate)}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                    <Clock size={12} />
                    {formatTime(order.eventDate)}
                  </p>
                </div>
                <div className="order-detail-item">
                  <label>Total Price</label>
                  <p className="price">₹{order.price}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '16px', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', display: 'block' }}>
                    <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Delivery Venue
                  </span>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-white)', marginTop: '4px' }}>{order.address}</p>
                </div>
                {order.notes && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', display: 'block' }}>Special Notes</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', fontStyle: 'italic', marginTop: '4px' }}>
                      "{order.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
