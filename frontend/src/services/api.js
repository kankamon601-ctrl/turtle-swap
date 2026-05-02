import axios from 'axios';

// Base URL of your Flask backend.
// Override per environment with REACT_APP_API_URL (e.g. https://api.swaphoot.com).
// Local dev falls back to the Flask default.
const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}/api`,
});

// Automatically attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (token missing, expired, or stale from before a schema migration),
// clear local auth state and bounce to /login so the user can sign in again.
// Skip the redirect when we're already on /login or a public reset page so
// failed login attempts still show their own error message inline.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname;
      const isPublicAuthPage =
        path === '/login' ||
        path === '/forgot-password' ||
        path.startsWith('/reset-password/');
      if (!isPublicAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const forgotPassword = (email) =>
  API.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) =>
  API.post('/auth/reset-password', { token, password });

// ---- Items ----
export const getItems = (params) => API.get('/items', { params });
export const getItem = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post('/items', data);
export const uploadItemImages = (itemId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return API.post(`/items/${itemId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getMyItems = () => API.get('/items/my');
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);
export const deleteItemImage = (itemId, imageId) =>
  API.delete(`/items/${itemId}/images/${imageId}`);
export const getNearbyItems = (lat, lng, radius = 20, extra = {}) =>
  API.get('/items/nearby', { params: { lat, lng, radius, ...extra } });

// ---- Offers ----
export const sendOffer = (data) => API.post('/offers', data);
export const getIncomingOffers = () => API.get('/offers/incoming');
export const getOutgoingOffers = () => API.get('/offers/outgoing');
export const getOfferCount = () => API.get('/offers/count');
export const acceptOffer = (id) => API.post(`/offers/${id}/accept`);
export const rejectOffer = (id) => API.post(`/offers/${id}/reject`);
export const holdOffer = (id) => API.post(`/offers/${id}/hold`);

// ---- Matches ----
export const getMatches = () => API.get('/matches');

// ---- Reviews ----
export const createReview = (data) => API.post('/reviews', data);
export const getUserReviews = (userId) => API.get(`/reviews/user/${userId}`);
export const getMyReviews = () => API.get('/reviews/my');

export default API;
