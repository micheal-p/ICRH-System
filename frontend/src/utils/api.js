import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors WITHOUT auto-redirect on every 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we're NOT on login/register pages
    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.error('Auth error, clearing session');
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============= AUTH API =============

export const authAPI = {
  register: async (formData) => {
    const response = await api.post('/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.clear();
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// ============= STUDENT API =============

export const studentAPI = {
  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },

  updateProfile: async (formData) => {
    const response = await api.put('/student/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCourses: async (department, level, semester) => {
    const response = await api.get(`/courses/${department}/${level}/${semester}`);
    return response.data;
  },

  registerCourses: async (data) => {
    const response = await api.post('/student/register-courses', data);
    return response.data;
  },

  getConfig: async () => {
    const response = await api.get('/config');
    return response.data;
  },

  // ============= NEW: GET REGISTERED COURSES =============
  getRegisteredCourses: async (semester) => {
    const response = await api.get(`/student/registered-courses/${semester}`);
    return response.data;
  },

  // ============= NEW: VALIDATE TOKEN =============
  validateToken: async (token) => {
    const response = await api.post('/student/validate-token', { token });
    return response.data;
  },
};

// ============= ADMIN API =============

export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getAllStudents: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/admin/students?${params}`);
    return response.data;
  },

  // ============= FIXED: APPROVE WITH URL ENCODING =============
  approveRegistration: async (matricNumber, semester) => {
    try {
      console.log(`[API] Approving: ${matricNumber} for ${semester}`);
      // Encode matric number to handle slashes (e.g., csc/2025/6612)
      const encodedMatric = encodeURIComponent(matricNumber);
      const response = await api.post(`/admin/approve/${encodedMatric}/${semester}`);
      console.log('[API] Approve response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Approve error:', error.response?.data || error);
      throw error;
    }
  },

  rejectRegistration: async (matricNumber, semester) => {
    // Encode matric number to handle slashes
    const encodedMatric = encodeURIComponent(matricNumber);
    const response = await api.post(`/admin/reject/${encodedMatric}/${semester}`);
    return response.data;
  },

  // ============= NEW: DELETE REGISTRATION =============
  deleteRegistration: async (matricNumber, semester) => {
    try {
      console.log(`[API] Deleting registration: ${matricNumber} for ${semester}`);
      // Encode matric number to handle slashes
      const encodedMatric = encodeURIComponent(matricNumber);
      const response = await api.delete(`/admin/delete-registration/${encodedMatric}/${semester}`);
      console.log('[API] Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Delete error:', error.response?.data || error);
      throw error;
    }
  },

  updateConfig: async (config) => {
    const response = await api.put('/admin/config', config);
    return response.data;
  },

  generateToken: async (data) => {
    const response = await api.post('/admin/generate-token', data);
    return response.data;
  },

  getSignatures: async () => {
    const response = await api.get('/admin/signatures');
    return response.data;
  },

  saveSignature: async (formData) => {
    const response = await api.post('/admin/signatures', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteSignature: async (role) => {
    const response = await api.delete(`/admin/signatures/${role}`);
    return response.data;
  },
};

// ============= HELPER FUNCTIONS =============

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const calculateTotalUnits = (courses) => {
  return courses.reduce((total, course) => total + (course.units || 0), 0);
};

export const detectClashes = (courses) => {
  const clashes = [];
  
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const time1 = `${courses[i].schedule?.day} ${courses[i].schedule?.time}`;
      const time2 = `${courses[j].schedule?.day} ${courses[j].schedule?.time}`;
      
      if (time1 === time2 && time1 !== 'undefined undefined') {
        clashes.push({
          course1: courses[i].courseCode,
          course2: courses[j].courseCode,
          time: time1,
        });
      }
    }
  }
  
  return clashes;
};

export default api;