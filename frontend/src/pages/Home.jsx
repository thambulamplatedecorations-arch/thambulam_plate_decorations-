import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ScrollAnimation from '../components/ScrollAnimation';
import { API_URL, getAuthHeaders } from '../utils/api';
import { Calendar, Clock, MapPin, Phone, Mail, User as UserIcon, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-react';

const Home = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  
  // Calculator States
  const [packageType, setPackageType] = useState('ONLY DECORATION'); // ONLY DECORATION or WITH PRODUCT + DECORATION
  const [plates, setPlates] = useState(5); // 5, 7, 11, 13, 15
  const [price, setPrice] = useState(1995);
  
  // Form States
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [customerName, setCustomerName] = useState(user ? user.name : '');
  const [customerPhone, setCustomerPhone] = useState(user ? user.phone : '');
  const [customerEmail, setCustomerEmail] = useState(user ? user.email : '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  // Catalog State
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Pricing configurations from the poster
  const pricingData = {
    'ONLY DECORATION': {
      5: 1995,
      7: 2093,
      11: 2739,
      13: 3237,
      15: 3735
    },
    'WITH PRODUCT + DECORATION': {
      5: 3495,
      7: 4193,
      11: 6039,
      13: 7137,
      15: 8235
    }
  };

  // Update price when type or plate count changes
  useEffect(() => {
    if (pricingData[packageType] && pricingData[packageType][plates]) {
      setPrice(pricingData[packageType][plates]);
    }
  }, [packageType, plates]);

  // Load calculator state from localStorage if user just logged in
  useEffect(() => {
    const savedCalc = localStorage.getItem('saved_calc');
    if (savedCalc) {
      try {
        const parsed = JSON.parse(savedCalc);
        setPackageType(parsed.packageType || 'ONLY DECORATION');
        setPlates(parsed.plates || 5);
        setEventDate(parsed.eventDate || '');
        setEventTime(parsed.eventTime || '');
        setAddress(parsed.address || '');
        setNotes(parsed.notes || '');
        localStorage.removeItem('saved_calc'); // clear it
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync user details on user prop change
  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phone);
      setCustomerEmail(user.email);
    }
  }, [user]);

  // Fetch services/photos from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      // Save current booking form details to localStorage and redirect to login
      const calcData = { packageType, plates, eventDate, eventTime, address, notes };
      localStorage.setItem('saved_calc', JSON.stringify(calcData));
      setMessage({ text: 'Please login or create an account to finalize your booking.', type: 'error' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!eventDate || !eventTime || !address || !customerPhone || !customerName) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    // Combine eventDate and eventTime into a single ISO Date string
    const combinedEventDate = new Date(`${eventDate}T${eventTime}`);

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packageName: packageType,
          plateCount: plates,
          price,
          eventDate: combinedEventDate.toISOString(),
          customerName,
          customerPhone,
          customerEmail,
          address,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'Order placed successfully! Redirecting to your orders...', type: 'success' });
        // Clear fields
        setEventDate('');
        setEventTime('');
        setAddress('');
        setNotes('');
        setTimeout(() => navigate('/orders'), 2000);
      } else {
        setMessage({ text: data.message || 'Failed to place order. Try again.', type: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Unable to connect to the server. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Navigation Header */}
      <header>
        <div className="nav-container">
          <Link to="/" className="logo">✨ Thambulam Plate Decorations</Link>
          <ul className="nav-links">
            <li><a href="#scrollytelling" className="nav-link">Home</a></li>
            <li><a href="#booking" className="nav-link">Packages</a></li>
            <li><a href="#gallery" className="nav-link">Gallery</a></li>
            {user ? (
              <>
                {user.isAdmin ? (
                  <li><Link to="/admin" className="nav-link"><LayoutDashboard size={16} style={{marginRight: '4px', verticalAlign: 'middle'}}/>Admin Panel</Link></li>
                ) : (
                  <li><Link to="/orders" className="nav-link"><ShoppingBag size={16} style={{marginRight: '4px', verticalAlign: 'middle'}}/>My Orders</Link></li>
                )}
                <li>
                  <button onClick={handleLogout} className="nav-btn secondary" style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <LogOut size={14} /> Log Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="nav-link">Sign In</Link></li>
                <li><Link to="/signup" className="nav-btn">Sign Up</Link></li>
              </>
            )}
          </ul>
        </div>
      </header>

      {/* Hero Canvas section */}
      <ScrollAnimation />

      {/* Poster Pricing Overview Section */}
      <section className="container" style={{ padding: '80px 24px' }}>
        <div className="section-title-wrapper">
          <h2 className="section-title">Traditional Theme Packages</h2>
          <p className="section-subtitle">Engagement • Wedding • Baby Shower • Special Functions</p>
        </div>

        <div className="glass poster-theme-card">
          <h3 style={{ textAlign: 'center', color: 'var(--text-gold)', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>
            Traditional Themes Available
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-gray)', fontSize: '0.95rem', maxWidth: '800px', margin: '0 auto 24px auto' }}>
            Choose from a wide variety of handcrafted layouts, floral displays, rotating wheels, and premium quality designs tailored to your cultural traditions. We guarantee follow-on-time delivery.
          </p>

          <div className="poster-prices-grid">
            <div>
              <h4 className="price-table-title">Only Decoration Price</h4>
              <div className="price-row">
                <span className="plates">5 Plates</span>
                <span className="rate">× ₹399</span>
                <span className="total">₹1995</span>
              </div>
              <div className="price-row">
                <span className="plates">7 Plates</span>
                <span className="rate">× ₹299</span>
                <span className="total">₹2093</span>
              </div>
              <div className="price-row">
                <span className="plates">11 Plates</span>
                <span className="rate">× ₹249</span>
                <span className="total">₹2739</span>
              </div>
              <div className="price-row">
                <span className="plates">13 Plates</span>
                <span className="rate">× ₹249</span>
                <span className="total">₹3237</span>
              </div>
              <div className="price-row">
                <span className="plates">15 Plates</span>
                <span className="rate">× ₹249</span>
                <span className="total">₹3735</span>
              </div>
            </div>

            <div>
              <h4 className="price-table-title">With Product + Decoration Price</h4>
              <div className="price-row">
                <span className="plates">5 Plates</span>
                <span className="rate">× ₹699</span>
                <span className="total">₹3495</span>
              </div>
              <div className="price-row">
                <span className="plates">7 Plates</span>
                <span className="rate">× ₹599</span>
                <span className="total">₹4193</span>
              </div>
              <div className="price-row">
                <span className="plates">11 Plates</span>
                <span className="rate">× ₹549</span>
                <span className="total">₹6039</span>
              </div>
              <div className="price-row">
                <span className="plates">13 Plates</span>
                <span className="rate">× ₹549</span>
                <span className="total">₹7137</span>
              </div>
              <div className="price-row">
                <span className="plates">15 Plates</span>
                <span className="rate">× ₹549</span>
                <span className="total">₹8235</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form and Calculator Section */}
      <section className="container" id="booking" style={{ paddingBottom: '80px' }}>
        <div className="section-title-wrapper">
          <h2 className="section-title">Order Booking & Price Calculator</h2>
          <p className="section-subtitle">Select your package, calculate estimated costs, and place your order request.</p>
        </div>

        <div className="calc-grid">
          {/* Left Form */}
          <form className="glass" style={{ padding: '32px' }} onSubmit={handleBookingSubmit}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-gold)', fontFamily: 'var(--font-serif)' }}>Order Details</h3>
            
            {message.text && (
              <div className={message.type === 'error' ? 'auth-error' : 'badge completed'} style={{ width: '100%', padding: '12px', marginBottom: '20px', display: 'block', textAlign: 'center' }}>
                {message.text}
              </div>
            )}

            <div className="calc-form-group">
              <label>Package Type</label>
              <div className="calc-radio-group">
                <div 
                  className={`calc-radio-label ${packageType === 'ONLY DECORATION' ? 'active' : ''}`}
                  onClick={() => setPackageType('ONLY DECORATION')}
                >
                  <span className="calc-radio-title">Only Decoration</span>
                  <span className="calc-radio-desc">We decorate your plates</span>
                </div>
                <div 
                  className={`calc-radio-label ${packageType === 'WITH PRODUCT + DECORATION' ? 'active' : ''}`}
                  onClick={() => setPackageType('WITH PRODUCT + DECORATION')}
                >
                  <span className="calc-radio-title">Product + Decoration</span>
                  <span className="calc-radio-desc">We provide plates + decorate</span>
                </div>
              </div>
            </div>

            <div className="calc-form-group">
              <label htmlFor="plates">Number of Plates</label>
              <select 
                id="plates" 
                className="calc-select" 
                value={plates}
                onChange={(e) => setPlates(Number(e.target.value))}
              >
                <option value={5}>5 Plates</option>
                <option value={7}>7 Plates</option>
                <option value={11}>11 Plates</option>
                <option value={13}>13 Plates</option>
                <option value={15}>15 Plates</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="calc-form-group">
                <label htmlFor="event-date"><Calendar size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Event Date</label>
                <input 
                  type="date" 
                  id="event-date" 
                  className="calc-input"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="calc-form-group">
                <label htmlFor="event-time"><Clock size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Event Time</label>
                <input 
                  type="time" 
                  id="event-time" 
                  className="calc-input"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className="calc-form-group">
              <label htmlFor="address"><MapPin size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Delivery Address</label>
              <textarea 
                id="address" 
                className="calc-textarea" 
                placeholder="Enter full venue or home address for plate delivery"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {user && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--text-gold)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Customer Information</h4>
                <div className="calc-form-group">
                  <label><UserIcon size={12}/> Name</label>
                  <input type="text" className="calc-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>
                <div className="calc-form-group">
                  <label><Phone size={12}/> Phone</label>
                  <input type="text" className="calc-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="calc-form-group">
              <label htmlFor="notes">Special Requirements / Notes</label>
              <textarea 
                id="notes" 
                className="calc-textarea" 
                placeholder="Traditional colors, flower choices, theme preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="calc-book-btn" disabled={submitting}>
              {submitting ? 'Placing Request...' : user ? 'Book This Package Now' : 'Sign In to Place Order'}
            </button>
          </form>

          {/* Right Display */}
          <div className="glass calc-price-display">
            <span style={{ fontSize: '1rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Estimated Total Price
            </span>
            <span className="calc-price-value">₹{price}</span>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto 16px auto' }}>
              Includes {plates} plates styled in the **{packageType === 'ONLY DECORATION' ? 'Only Decoration' : 'With Product + Decoration'}** schema.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-gold)', width: '100%', textAlign: 'left' }}>
              <h4 style={{ color: 'var(--text-gold)', marginBottom: '8px', fontSize: '0.9rem' }}>Service Includes:</h4>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-white)' }}>
                <li>Premium traditional elements & ornaments</li>
                <li>Elegant flower petal layouts (betel leaves, roses, jasmine)</li>
                <li>Design rotation setup options (for rotating theme)</li>
                <li>Timely door-step delivery & collection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services dynamic Gallery Section */}
      <section className="container" id="gallery" style={{ paddingBottom: '80px' }}>
        <div className="section-title-wrapper">
          <h2 className="section-title">Services & Designs Gallery</h2>
          <p className="section-subtitle">Exquisite designs uploaded by our team. Admin can add more photos dynamically.</p>
        </div>

        {loadingServices ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gold)' }}>Loading gallery...</div>
        ) : services.length === 0 ? (
          // Default beautiful local images if database is empty
          <div className="gallery-grid">
            <div className="glass gallery-card">
              <div className="gallery-img-wrapper">
                <img src="/frames/frame_001.jpg" alt="Betel Plate Theme" className="gallery-img" />
              </div>
              <div className="gallery-info">
                <h3 className="gallery-title">Classic Betel Leaf Flower Layout</h3>
                <p className="gallery-desc">Traditional betel leaf placement with soft orange and pink floral highlights.</p>
              </div>
            </div>
            <div className="glass gallery-card">
              <div className="gallery-img-wrapper">
                <img src="/frames/frame_010.jpg" alt="Traditional Lemon Flower Theme" className="gallery-img" />
              </div>
              <div className="gallery-info">
                <h3 className="gallery-title">Traditional Lemon Flower Setup</h3>
                <p className="gallery-desc">White daisy flowers accented with polished green lemons and baby's breath lining.</p>
              </div>
            </div>
            <div className="glass gallery-card">
              <div className="gallery-img-wrapper">
                <img src="/frames/frame_021.jpg" alt="Rotating Carousel Wheel" className="gallery-img" />
              </div>
              <div className="gallery-info">
                <h3 className="gallery-title">Rotating Carousel Wheel</h3>
                <p className="gallery-desc">Double-deck golden miniature Ferris wheel customized with dolls and plate holders.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="gallery-grid">
            {services.map((service) => (
              <div key={service._id} className="glass gallery-card">
                <div className="gallery-img-wrapper">
                  <img src={service.imageUrl} alt={service.title} className="gallery-img" />
                </div>
                <div className="gallery-info">
                  <h3 className="gallery-title">{service.title}</h3>
                  <p className="gallery-desc">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Instagram Banner Link */}
      <section className="container" style={{ paddingBottom: '80px' }}>
        <div className="insta-banner">
          <h3>Follow Our Journey</h3>
          <p>Get daily design inspirations, behind-the-scenes clips, and customer testimonies on Instagram.</p>
          <a 
            href="https://www.instagram.com/thambulam_plate_decorations?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="insta-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '4px'}}>
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
            </svg>
            <span>Visit Instagram Profile</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <p>© 2026 Thambulam Plate Decorations. All Rights Reserved.</p>
          <p className="credits">Tradition in Every Plate. Elegance in Every Detail.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
