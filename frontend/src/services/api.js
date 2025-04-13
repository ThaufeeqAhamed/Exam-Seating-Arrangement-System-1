import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

// Helper function to get CSRF token from cookie
const getCsrfToken = () => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrftoken=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies in cross-origin requests
});

// Add CSRF token to all requests
api.interceptors.request.use(request => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    request.headers['X-CSRFToken'] = csrfToken;
  }
  return request;
});

// Helper function to redirect to login (used in interceptors)
const redirectToLogin = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // Only redirect if not already on login page to avoid loops
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already trying to refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // If no refresh token, logout
          redirectToLogin();
          return Promise.reject(error);
        }

        // Call the refresh endpoint
        const response = await axios.post(`${API_URL}auth/token/refresh/`, {
          refresh: refreshToken
        });

        // If refresh successful, update tokens and retry
        if (response.data.access) {
          localStorage.setItem('accessToken', response.data.access);

          // Retry the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, logout
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth services
export const signupUser = async (userData) => {
  try {
    const response = await api.post('users/', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('auth/token/', { email, password });

    if (response.data.access) {
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network response was not ok');
    }
  }
};

export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getUserProfile = async () => {
  return api.get('users/me/');
};

// Room services
export const getRooms = async () => {
  return api.get('rooms/');
};

export const getRoom = async (id) => {
  return api.get(`rooms/${id}/`);
};

export const createRoom = async (roomData) => {
  return api.post('rooms/', roomData);
};

export const updateRoom = async (id, roomData) => {
  return api.put(`rooms/${id}/`, roomData);
};

export const deleteRoom = async (id) => {
  return api.delete(`rooms/${id}/`);
};

// Student services
export const getStudents = async () => {
  return api.get('students/');
};

export const uploadStudentExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return await api.post('students/upload_excel/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const clearStudents = async () => {
  return api.delete('students/clear/');
};

// Exam services
export const getExams = async () => {
  return api.get('exams/');
};

export const getExam = async (id) => {
  return api.get(`exams/${id}/`);
};

export const createExam = async (examData) => {
  return api.post('exams/', examData);
};

export const updateExam = async (id, examData) => {
  return api.put(`exams/${id}/`, examData);
};

export const deleteExam = async (id) => {
  return api.delete(`exams/${id}/`);
};

export const generateSeating = async (examId) => {
  return api.post(`exams/${examId}/generate_seating/`);
};

export const getExamSeatingDetails = async (examId) => {
  return api.get(`exams/${examId}/seating_details/`);
};

export const getDepartmentSeating = async (examId) => {
  return api.get(`exams/${examId}/department_seating/`);
};

// Timetable services
export const uploadTimetableFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  // Debug
  // console.log("Selected file: ", file);
  // console.log("file contents: \n");
  // for (let pair of formData.entries()) {
  //   console.log(pair[0] + ':' + pair[1])
  // }

  // Update data is being pushed to backend
  try {
    const response = await api.post('timetables/upload_file/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (error) {
    console.error('Error uploading timetable:', error);
    throw error;
  }
};

export const getTimetable = async () => {
  return api.get('timetable/');
};

// Schedule services
export const getSchedules = async () => {
  return api.get('schedules/');
};

export const getSchedule = async (id) => {
  return api.get(`schedules/${id}/`);
};

export const generateScheduleSeating = async (scheduleId) => {
  return api.post(`schedules/${scheduleId}/generate_seating/`);
};

// Seating arrangement services
export const getSeatingArrangements = async () => {
  return api.get('seating-arrangements/');
};

export const updateSeatingArrangement = async (id, seatingData) => {
  return api.put(`seating-arrangements/${id}/`, seatingData);
};

export default api;
