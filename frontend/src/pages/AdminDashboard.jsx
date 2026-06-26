import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL, getAuthHeaders } from '../utils/api';
import { Calendar, Clock, MapPin, ClipboardList, Users, Upload, ArrowLeft, RefreshCw, LogOut, CheckCircle, XCircle, Headphones, Phone } from 'lucide-react';

const AdminDashboard = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // orders, users, services, call-requests
  
  // Data States
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload Service States
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Authenticate Admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (activeTab === 'orders') {
        const res = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          setError('Failed to fetch orders.');
        }
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data);
        } else {
          setError('Failed to fetch user list.');
        }
      } else if (activeTab === 'call-requests') {
        const res = await fetch(`${API_URL}/call-requests`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setCallRequests(data);
        } else {
          setError('Failed to fetch call requests.');
        }
      } else if (activeTab === 'services') {
        const res = await fetch(`${API_URL}/services`);
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        } else {
          setError('Failed to fetch gallery images.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (id) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(sId => sId !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleSelectAllServices = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s._id));
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this design from the gallery?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setSuccessMsg('Service design deleted successfully.');
        setSelectedServices(selectedServices.filter(sId => sId !== id));
        fetchData();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete service.');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with database.');
    }
  };

  const handleDeleteMultipleServices = async () => {
    if (selectedServices.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedServices.length} selected designs?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedServices }),
      });
      if (res.ok) {
        setSuccessMsg(`${selectedServices.length} service design(s) deleted successfully.`);
        setSelectedServices([]);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete selected services.');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with database.');
    }
  };

  const handleUpdateCallStatus = async (requestId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/call-requests/${requestId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSuccessMsg(`Call request status updated to "${newStatus}" successfully.`);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update request status.');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with the server.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSuccessMsg(`Order status updated to "${newStatus}" successfully.`);
        // Refresh orders list
        fetchData();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with the database.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setServiceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!serviceTitle || !serviceImage) {
      setError('Please provide a title and upload an image.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', serviceTitle);
    formData.append('description', serviceDesc);
    formData.append('image', serviceImage);

    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: getAuthHeaders(true), // Content-Type is auto-assigned for multipart/form-data
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Service plate photo uploaded and catalog item created successfully!');
        setServiceTitle('');
        setServiceDesc('');
        setServiceImage(null);
        setImagePreview('');
        fetchData();
      } else {
        setError(data.message || 'Image upload/DB insertion failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload. Verify network connections.');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-page container">
      {/* Header and Logout button */}
      <div className="admin-header">
        <div>
          <Link to="/" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Storefront
          </Link>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-gold)', fontFamily: 'var(--font-serif)' }}>Admin Panel Dashboard</h2>
        </div>
        <button onClick={handleLogout} className="nav-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}>
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {/* Tabs list */}
      <div className="admin-nav">
        <button 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} />
          Customer Orders
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} />
          Registered Users
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Upload size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} />
          Upload Service Image
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'call-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('call-requests')}
        >
          <Headphones size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} />
          Call Requests
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="auth-error" style={{ marginBottom: '20px' }}>{error}</div>}
      {successMsg && (
        <div className="badge completed" style={{ width: '100%', padding: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* Main Tab Content panels */}
      <div className="glass" style={{ padding: '32px' }}>
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Order Management</h3>
              <button onClick={fetchData} className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Sync Database
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gold)' }}>Loading latest orders...</div>
            ) : orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>No orders have been placed yet.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Details</th>
                      <th>Plate Package</th>
                      <th>Event Date/Time</th>
                      <th>Venue Address</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>📞 {order.customerPhone}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>✉️ {order.customerEmail}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{order.packageName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)' }}>{order.plateCount} Plates</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                            <Calendar size={12} color="var(--primary-gold)" />
                            {new Date(order.eventDate).toLocaleDateString()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                            <Clock size={12} />
                            {new Date(order.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.address}>
                            {order.address}
                          </div>
                          {order.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', fontStyle: 'italic', marginTop: '4px' }}>
                              Note: "{order.notes}"
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--text-gold)' }}>₹{order.price}</td>
                        <td>
                          <span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span>
                        </td>
                        <td>
                          {order.status === 'Pending' && (
                            <>
                              <button className="action-btn accept" onClick={() => handleUpdateStatus(order._id, 'Accepted')}>Accept</button>
                              <button className="action-btn cancel" onClick={() => handleUpdateStatus(order._id, 'Cancelled')}>Cancel</button>
                            </>
                          )}
                          {order.status === 'Accepted' && (
                            <>
                              <button className="action-btn complete" onClick={() => handleUpdateStatus(order._id, 'Completed')}>Complete</button>
                              <button className="action-btn cancel" onClick={() => handleUpdateStatus(order._id, 'Cancelled')}>Cancel</button>
                            </>
                          )}
                          {order.status === 'Completed' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Order Completed</span>
                          )}
                          {order.status === 'Cancelled' && (
                            <span style={{ fontSize: '0.85rem', color: '#ff8080' }}>Order Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '20px' }}>Registered Customers</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gold)' }}>Loading user accounts...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone Number</th>
                      <th>Account Created</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr) => (
                      <tr key={usr._id}>
                        <td style={{ fontWeight: '600' }}>{usr.name}</td>
                        <td>{usr.email}</td>
                        <td>{usr.phone}</td>
                        <td>{formatDate(usr.createdAt)}</td>
                        <td>
                          {usr.isAdmin ? (
                            <span className="badge completed" style={{fontSize: '0.7rem'}}>Admin</span>
                          ) : (
                            <span className="badge pending" style={{fontSize: '0.7rem'}}>Customer</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="upload-card-wrapper">
            <h3 style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
              Upload Plate Design Photo
            </h3>
            
            <form onSubmit={handleServiceSubmit}>
              <div className="calc-form-group">
                <label htmlFor="service-title">Decoration Title / Name</label>
                <input
                  type="text"
                  id="service-title"
                  className="calc-input"
                  placeholder="e.g. Royal Golden Flower Frame"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                />
              </div>

              <div className="calc-form-group">
                <label htmlFor="service-desc">Description</label>
                <textarea
                  id="service-desc"
                  className="calc-textarea"
                  placeholder="Describe theme details, decoration items, colors used..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                />
              </div>

              <div className="calc-form-group">
                <label>Plate Image File</label>
                <div className="file-input-wrapper">
                  <Upload size={24} style={{ color: 'var(--primary-gold)', marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Drag & Drop or Click to Browse Images</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '4px' }}>PNG, JPG or JPEG (Max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleImageChange}
                  />
                </div>
                {imagePreview && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-gold)', marginBottom: '6px' }}>Selected Image Preview:</p>
                    <img src={imagePreview} alt="Preview" className="file-preview" />
                  </div>
                )}
              </div>

              <button type="submit" className="calc-book-btn" disabled={uploading}>
                {uploading ? 'Uploading to Cloudinary & saving to Database...' : 'Upload Design to Catalog'}
              </button>
            </form>

            {/* Gallery Manager Section */}
            <div className="gallery-manager-section" style={{ marginTop: '48px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0 }}>
                  Manage Gallery Photos ({services.length})
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {services.length > 0 && (
                    <button 
                      type="button" 
                      onClick={handleSelectAllServices} 
                      className="nav-btn secondary"
                      style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                    >
                      {selectedServices.length === services.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                  {selectedServices.length > 0 && (
                    <button 
                      type="button" 
                      onClick={handleDeleteMultipleServices} 
                      className="action-btn cancel"
                      style={{ fontSize: '0.85rem', padding: '8px 14px', background: 'var(--red)', color: 'white' }}
                    >
                      Delete Selected ({selectedServices.length})
                    </button>
                  )}
                </div>
              </div>

              {loading && services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-gold)' }}>Loading gallery...</div>
              ) : services.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>No gallery photos found. Upload some above!</p>
              ) : (
                <div className="admin-gallery-grid">
                  {services.map((item) => {
                    const isChecked = selectedServices.includes(item._id);
                    return (
                      <div key={item._id} className={`admin-gallery-card glass ${isChecked ? 'selected' : ''}`}>
                        <div className="admin-gallery-image-wrapper">
                          <img src={item.imageUrl} alt={item.title} className="admin-gallery-image" />
                          <div className="admin-gallery-checkbox-overlay">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleSelectService(item._id)}
                              className="admin-gallery-checkbox"
                            />
                          </div>
                        </div>
                        <div className="admin-gallery-info">
                          <h4 className="admin-gallery-title" title={item.title}>{item.title}</h4>
                          <p className="admin-gallery-desc" title={item.description}>{item.description}</p>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteService(item._id)} 
                            className="admin-gallery-delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'call-requests' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Call Support Requests</h3>
              <button onClick={fetchData} className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Sync Calls
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gold)' }}>Loading call requests...</div>
            ) : callRequests.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>No call support requests found.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>Message / Note</th>
                      <th>Date Requested</th>
                      <th>Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callRequests.map((req) => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: '600' }}>{req.name}</td>
                        <td>
                          <a href={`tel:${req.phone}`} style={{ color: 'var(--text-gold)', fontWeight: '500' }}>
                            📞 {req.phone}
                          </a>
                        </td>
                        <td>
                          <div style={{ maxWidth: '250px', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.message}>
                            {req.message || <span style={{ color: 'var(--text-gray)', fontStyle: 'italic' }}>No message</span>}
                          </div>
                        </td>
                        <td>{formatDate(req.createdAt)}</td>
                        <td>
                          <span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span>
                        </td>
                        <td>
                          {req.status === 'Pending' && (
                            <>
                              <button className="action-btn accept" onClick={() => handleUpdateCallStatus(req.id, 'Approved')}>Approve</button>
                              <button className="action-btn cancel" onClick={() => handleUpdateCallStatus(req.id, 'Completed')}>Mark Completed</button>
                            </>
                          )}
                          {req.status === 'Approved' && (
                            <button className="action-btn complete" onClick={() => handleUpdateCallStatus(req.id, 'Completed')}>Mark Completed</button>
                          )}
                          {req.status === 'Completed' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Call Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
