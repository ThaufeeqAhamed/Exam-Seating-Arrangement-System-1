import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FacultyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // TODO: Implement API call to fetch faculty's assigned exams
    // For now, using mock data
    const mockExams = [
      {
        id: 1,
        course_code: 'CS101',
        course_name: 'Introduction to Programming',
        date: '2024-01-15',
        time: '09:00 AM',
        duration: '3 hours',
        total_students: 60
      },
      {
        id: 2,
        course_code: 'CS202',
        course_name: 'Data Structures',
        date: '2024-01-17',
        time: '02:00 PM',
        duration: '3 hours',
        total_students: 45
      }
    ];

    setTimeout(() => {
      setExams(mockExams);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Assigned Exams
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Code</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Total Students</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>{exam.course_code}</TableCell>
                <TableCell>{exam.course_name}</TableCell>
                <TableCell>{exam.date}</TableCell>
                <TableCell>{exam.time}</TableCell>
                <TableCell>{exam.duration}</TableCell>
                <TableCell>{exam.total_students}</TableCell>
                <TableCell>
                  <Button
                    component={Link}
                    to={`/faculty/exams/${exam.id}/seating`}
                    variant="contained"
                    size="small"
                  >
                    View Seating
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FacultyExams;