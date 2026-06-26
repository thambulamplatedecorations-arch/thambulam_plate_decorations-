import React, { useState, useRef, useEffect } from 'react';
import { X, Headphones, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL } from '../utils/api';

const SupportBall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Local request state
  const [localRequest, setLocalRequest] = useState(null);
  
  const containerRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('thambulam_call_request');
    if (saved) {
      try {
        setLocalRequest(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll status from backend if there is an active request
  useEffect(() => {
    if (!localRequest || localRequest.status === 'Completed') return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/call-requests/status?phone=${localRequest.phone}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== localRequest.status) {
            const updated = { ...localRequest, status: data.status };
            setLocalRequest(updated);
            localStorage.setItem('thambulam_call_request', JSON.stringify(updated));
          }
        }
      } catch (error) {
        console.error("Error polling request status", error);
      }
    };

    // Check immediately, then poll every 10 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [localRequest]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Name and Phone are required.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/call-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, message })
      });
      const data = await res.json();
      if (res.ok) {
        const reqData = {
          id: data.data.id,
          name,
          phone,
          status: 'Pending'
        };
        setLocalRequest(reqData);
        localStorage.setItem('thambulam_call_request', JSON.stringify(reqData));
        setName('');
        setPhone('');
        setMessage('');
      } else {
        setError(data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('thambulam_call_request');
    setLocalRequest(null);
    setError('');
  };

  return (
    <div className="support-ball-container" ref={containerRef}>
      {isOpen && (
        <div className="support-menu glass support-form-menu">
          <div className="support-header">
            <h4>Request Call Support</h4>
            <p>Enter details and admin will call you.</p>
          </div>
          
          {localRequest ? (
            <div className="support-status-view">
              {localRequest.status === 'Pending' && (
                <div className="status-box pending">
                  <div className="spinner-mini" style={{ margin: '0 auto 12px auto' }}></div>
                  <h5>Request Pending</h5>
                  <p>We've sent your request. Admin will review and approve soon.</p>
                </div>
              )}
              {localRequest.status === 'Approved' && (
                <div className="status-box approved">
                  <CheckCircle2 size={32} color="var(--primary-gold)" style={{ margin: '0 auto 12px auto' }} />
                  <h5>Request Approved!</h5>
                  <p>Admin approved your request and will call you shortly on <strong>{localRequest.phone}</strong>.</p>
                </div>
              )}
              {localRequest.status === 'Completed' && (
                <div className="status-box completed">
                  <CheckCircle2 size={32} color="var(--emerald)" style={{ margin: '0 auto 12px auto' }} />
                  <h5>Query Completed</h5>
                  <p>Your call support request has been completed. Thank you!</p>
                  <button onClick={handleReset} className="support-reset-btn">
                    Request New Call
                  </button>
                </div>
              )}
              {localRequest.status !== 'Completed' && (
                <button onClick={handleReset} className="support-cancel-btn">
                  Cancel Request
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="support-form">
              {error && (
                <div className="support-error">
                  <AlertCircle size={14} style={{ marginRight: '4px' }} />
                  {error}
                </div>
              )}
              <div className="support-form-group">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="support-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="support-form-group">
                <input 
                  type="tel" 
                  placeholder="Your Phone Number" 
                  className="support-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="support-form-group">
                <textarea 
                  placeholder="Message (Optional)" 
                  className="support-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="support-submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={14} style={{ marginRight: '6px' }} />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
      
      <button 
        className="support-ball-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Support Contact"
      >
        {isOpen ? <X size={26} /> : <Headphones size={26} />}
      </button>
    </div>
  );
};

export default SupportBall;
