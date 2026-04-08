import axios from 'axios';

// Base URL of your Flask backend
const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
});

// Automatically attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// ---- Items ----
export const getItems = (params) => API.get('/items', { params });
export const getItem = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post('/items', data);
export const getMyItems = () => API.get('/items/my');
export const getNearbyItems = (lat, lng, radius = 20) =>
  API.get('/items/nearby', { params: { lat, lng, radius } });

// ---- Offers ----
export const sendOffer = (data) => API.post('/offers', data);
export const getIncomingOffers = () => API.get('/offers/incoming');
export const getOutgoingOffers = () => API.get('/offers/outgoing');
export const getOfferCount = () => API.get('/offers/count');
export const acceptOffer = (id) => API.post(`/offers/${id}/accept`);
export const rejectOffer = (id) => API.post(`/offers/${id}/reject`);

// ---- Matches ----
export const getMatches = () => API.get('/matches');

// ---- Reviews ----
export const createReview = (data) => API.post('/reviews', data);
export const getUserReviews = (userId) => API.get(`/reviews/user/${userId}`);
export const getMyReviews = () => API.get('/reviews/my');

export default API;
