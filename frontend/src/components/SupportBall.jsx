import React, { useState, useRef, useEffect } from 'react';
import { X, Headphones, Send } from 'lucide-react';
import { API_URL } from '../utils/api';

const SupportBall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentStep, setCurrentStep] = useState('name'); // name, phone, message, submitting, finished
  
  // Collected fields
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Chat log history
  const [chatLog, setChatLog] = useState([
    { sender: 'bot', text: 'Hello! I can help you request call support from our admin team. What is your name?' }
  ]);
  
  // Active call request reference
  const [localRequest, setLocalRequest] = useState(null);
  
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isOpen]);

  // Load request from localStorage on mount/open
  useEffect(() => {
    const saved = localStorage.getItem('thambulam_call_request');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalRequest(parsed);
        setChatLog([
          { sender: 'bot', text: 'You have an active call support request.' },
          { sender: 'bot', text: `Name: ${parsed.name}` },
          { sender: 'bot', text: `Phone: ${parsed.phone}` },
          { sender: 'bot', text: `Status: ${parsed.status}` }
        ]);
        setCurrentStep('finished');
      } catch (e) {
        console.error(e);
      }
    } else {
      // If no active request, check if logged-in user can pre-fill name/phone
      const storedUser = localStorage.getItem('user');
      if (storedUser && isOpen && currentStep === 'name' && chatLog.length === 1) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.name) {
            setInputText(parsed.name);
          }
        } catch (e) {}
      }
    }
  }, [isOpen]);

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

  // Poll request status from backend
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
            
            // Append status update to chat log
            setChatLog(prev => [
              ...prev,
              { sender: 'bot', text: `⚠️ Request Status Update: ${data.status}` },
              data.status === 'Approved'
                ? { sender: 'bot', text: `Your request has been APPROVED! Admin will call you shortly on ${localRequest.phone}.` }
                : { sender: 'bot', text: 'Your support request has been completed. Thank you!' }
            ]);
          }
        }
      } catch (error) {
        console.error("Error polling request status:", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [localRequest]);

  const submitRequest = async (rName, rPhone, rMessage) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/call-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: rName, phone: rPhone, message: rMessage })
      });
      const data = await res.json();
      if (res.ok) {
        const reqData = {
          id: data.data.id,
          name: rName,
          phone: rPhone,
          status: 'Pending'
        };
        localStorage.setItem('thambulam_call_request', JSON.stringify(reqData));
        setLocalRequest(reqData);
        setChatLog(prev => [
          ...prev.slice(0, -1), // remove 'Submitting request...' bubble
          { sender: 'bot', text: 'Perfect! I have logged your request directly in the Admin Panel.' },
          { sender: 'bot', text: `Status: Pending. Admin will call you back on ${rPhone} soon.` }
        ]);
        setCurrentStep('finished');
      } else {
        setChatLog(prev => [
          ...prev.slice(0, -1),
          { sender: 'bot', text: `Oops! ${data.message || 'Submission failed.'}` },
          { sender: 'bot', text: 'Let\'s try again. What is your name?' }
        ]);
        setCurrentStep('name');
      }
    } catch (err) {
      console.error(err);
      setChatLog(prev => [
        ...prev.slice(0, -1),
        { sender: 'bot', text: 'Connection error. Please check your network and try again.' },
        { sender: 'bot', text: 'What is your name?' }
      ]);
      setCurrentStep('name');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text && currentStep !== 'message') return;

    setInputText('');

    if (currentStep === 'name') {
      setTempName(text);
      setChatLog(prev => [
        ...prev,
        { sender: 'user', text },
        { sender: 'bot', text: `Thanks, ${text}! What phone number can we call you on?` }
      ]);
      // Attempt to pre-fill phone number if user is logged in
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.phone) {
            setInputText(parsed.phone);
          }
        } catch (err) {}
      }
      setCurrentStep('phone');
    } else if (currentStep === 'phone') {
      setTempPhone(text);
      setChatLog(prev => [
        ...prev,
        { sender: 'user', text },
        { sender: 'bot', text: 'Got it. Do you have any extra requirements or notes for the admin? (Type below or click Skip)' }
      ]);
      setCurrentStep('message');
    } else if (currentStep === 'message') {
      const msgText = text || 'No extra requirements';
      setChatLog(prev => [
        ...prev,
        { sender: 'user', text: msgText },
        { sender: 'bot', text: 'Submitting request...' }
      ]);
      setCurrentStep('submitting');
      submitRequest(tempName, tempPhone, text);
    }
  };

  const handleSkipMessage = () => {
    setInputText('');
    setChatLog(prev => [
      ...prev,
      { sender: 'user', text: 'Skipped extra notes' },
      { sender: 'bot', text: 'Submitting request...' }
    ]);
    setCurrentStep('submitting');
    submitRequest(tempName, tempPhone, '');
  };

  const handleReset = () => {
    localStorage.removeItem('thambulam_call_request');
    setLocalRequest(null);
    setChatLog([
      { sender: 'bot', text: 'Hello! I can help you request call support from our admin team. What is your name?' }
    ]);
    
    // Pre-fill name if user logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) {
          setInputText(parsed.name);
        }
      } catch (err) {}
    }
    setCurrentStep('name');
  };

  return (
    <div className="support-ball-container" ref={containerRef}>
      {isOpen && (
        <div className="support-menu glass support-chat-menu">
          <div className="support-header">
            <h4>Support Assistant</h4>
            <p>We schedule call support requests.</p>
          </div>
          
          <div className="chat-log-container">
            {chatLog.map((msg, index) => (
              <div key={index} className={`chat-bubble-wrapper ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          {currentStep !== 'submitting' && (
            <div className="chat-input-area-wrapper">
              {currentStep === 'message' && (
                <button 
                  type="button" 
                  onClick={handleSkipMessage} 
                  className="chat-skip-btn"
                >
                  Skip extra notes
                </button>
              )}
              {currentStep === 'finished' ? (
                <button 
                  type="button" 
                  onClick={handleReset} 
                  className="support-reset-btn"
                  style={{ margin: 0 }}
                >
                  Request New Callback
                </button>
              ) : (
                <form onSubmit={handleSend} className="chat-input-form">
                  <input 
                    type={currentStep === 'phone' ? 'tel' : 'text'}
                    placeholder={
                      currentStep === 'name' ? 'Type your name...' :
                      currentStep === 'phone' ? 'Type your phone number...' :
                      'Type any notes/messages...'
                    }
                    className="chat-input-field"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    required={currentStep !== 'message'}
                    autoFocus
                  />
                  <button type="submit" className="chat-send-btn">
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
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
