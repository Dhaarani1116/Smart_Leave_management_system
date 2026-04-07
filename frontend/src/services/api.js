import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const leaveAPI = {
  applyLeave: (leaveData) => api.post('/leaves/apply', leaveData),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  getPendingApprovals: () => api.get('/leaves/pending-approvals'),
  getAllLeaves: (params) => api.get('/leaves/all', { params }),
  getLeaveStats: () => api.get('/leaves/stats'),
  getConflicts: () => api.get('/leaves/conflicts'),
  approveLeave: (id, comment) => api.put(`/leaves/${id}/approve`, { comment }),
  rejectLeave: (id, comment) => api.put(`/leaves/${id}/reject`, { comment }),
  getLeaveById: (id) => api.get(`/leaves/${id}`),
  // Substitute management
  getAvailableApprovers: (role, department) => api.get('/leaves/available-approvers', { params: { role, department } }),
  setTempApprover: (substitute_id, expiryDate) => api.post('/leaves/temp-approver', { substitute_id, expiryDate }),
  removeTempApprover: () => api.delete('/leaves/temp-approver'),
};

export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications/my'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const noticeAPI = {
  getNotices: () => api.get('/notices'),
  getSentNotices: () => api.get('/notices/sent'),
  createNotice: (noticeData) => api.post('/notices', noticeData),
  replyToNotice: (replyData) => api.post('/notices/reply', replyData),
  deleteNotice: (id) => api.put(`/notices/${id}/delete`),
};

export default api;
