import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';

// Import styles
import './styles/printStyles.css';

// Auth Components
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Unauthorized from './components/common/Unauthorized';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import RoomManagement from './components/admin/RoomManagement';
import StudentManagement from './components/admin/StudentManagement';
import ExamManagement from './components/admin/ExamManagement';
import SeatingVisualization from './components/admin/SeatingVisualization';
import TimetableUpload from './components/admin/TimetableUpload';

// Faculty Components
import FacultyLayout from './components/faculty/FacultyLayout';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import FacultyExams from './components/faculty/FacultyExams';
import FacultyReports from './components/faculty/FacultyReports';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute roleRequired="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="rooms" element={<RoomManagement />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="exams" element={<ExamManagement />} />
                <Route path="exams/:examId/seating" element={<SeatingVisualization />} />
                <Route path="timetable" element={<TimetableUpload />} />
                {/* Add more admin routes here */}
              </Route>
            </Route>
            
            {/* Faculty Routes */}
            <Route element={<ProtectedRoute roleRequired="faculty" />}>
              <Route path="/faculty" element={<FacultyLayout />}>
                <Route index element={<FacultyDashboard />} />
                <Route path="exams" element={<FacultyExams />} />
                <Route path="exams/:examId/seating" element={<SeatingVisualization />} />
                <Route path="reports" element={<FacultyReports />} />
              </Route>
            </Route>
            
            {/* Redirect to login by default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
