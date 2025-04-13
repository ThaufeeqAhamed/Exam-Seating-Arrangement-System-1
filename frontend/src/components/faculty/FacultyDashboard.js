import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import DownloadIcon from '@mui/icons-material/Download';
import { getExams } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FacultyDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure we have a user
    if (!user) {
      return;
    }
    
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await getExams();
        setExams(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to load exams. Please try again later.');
        // If we get a 401, we've likely been logged out
        if (error.response && error.response.status === 401) {
          // Auth context should handle this, but just in case
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user, navigate]);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    } catch (e) {
      return timeString;
    }
  };

  // Sort exams by date (most recent first)
  const sortedExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Get upcoming exams (today or future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingExams = sortedExams.filter(exam => new Date(exam.date) >= today);
  const recentExams = sortedExams.filter(exam => new Date(exam.date) < today);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Faculty Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome back, {user?.username || 'Faculty'}. 
          {user?.department && ` Department: ${user.department}`}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upcoming Exams
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<EventIcon />} 
                component={Link} 
                to="/faculty/exams"
              >
                View All
              </Button>
            </Box>
            
            {upcomingExams.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                No upcoming exams scheduled.
              </Typography>
            ) : (
              <List disablePadding>
                {upcomingExams.slice(0, 5).map((exam, index) => (
                  <React.Fragment key={exam.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      component={Link} 
                      to={`/faculty/exams/${exam.id}/seating`}
                      sx={{ py: 1.5, textDecoration: 'none', color: 'inherit' }}
                    >
                      <ListItemText
                        primary={exam.name}
                        secondary={`${formatDate(exam.date)} at ${formatTime(exam.time)}`}
                      />
                      <Chip 
                        label={`Room: ${exam.room_details?.room_id || exam.room}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        to={`/faculty/exams/${exam.id}/seating`}
                        sx={{ ml: 2 }}
                      >
                        View Seating
                      </Button>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <List disablePadding>
                <ListItem 
                  component={Link} 
                  to="/faculty/reports" 
                  sx={{ pl: 0, textDecoration: 'none', color: 'inherit' }}
                >
                  <DownloadIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText primary="Download Reports" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {recentExams.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Exams
          </Typography>
          <List disablePadding>
            {recentExams.slice(0, 3).map((exam, index) => (
              <React.Fragment key={exam.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  component={Link} 
                  to={`/faculty/exams/${exam.id}`}
                  sx={{ py: 1.5, textDecoration: 'none', color: 'inherit' }}
                >
                  <ListItemText
                    primary={exam.name}
                    secondary={`${formatDate(exam.date)} at ${formatTime(exam.time)}`}
                  />
                  <Button
                    startIcon={<DownloadIcon />}
                    size="small"
                    component={Link}
                    to={`/faculty/reports?exam=${exam.id}`}
                  >
                    Report
                  </Button>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default FacultyDashboard; 