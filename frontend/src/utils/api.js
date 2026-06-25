export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE}/api`;

export const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};
