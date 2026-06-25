import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Phone, X, Headphones } from 'lucide-react';

const SupportBall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Hello Thambulam Plate Decorations! I would like to inquire about booking your traditional plate decoration services."
    );
    window.open(`https://wa.me/919677015928?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open('tel:9677015928', '_self');
  };

  return (
    <div className="support-ball-container" ref={containerRef}>
      {isOpen && (
        <div className="support-menu glass">
          <div className="support-header">
            <h4>Customer Support</h4>
            <p>Ready to decorate your plates?</p>
          </div>
          
          <button className="support-btn whatsapp" onClick={handleWhatsApp}>
            <MessageCircle size={18} color="#25d366" />
            <span>Chat on WhatsApp</span>
          </button>
          
          <button className="support-btn call" onClick={handleCall}>
            <Phone size={18} color="#3b82f6" />
            <span>Call +91 9677015928</span>
          </button>
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
