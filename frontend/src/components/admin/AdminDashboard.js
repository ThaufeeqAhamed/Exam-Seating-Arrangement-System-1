import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Divider,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link } from 'react-router-dom';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ViewListIcon from '@mui/icons-material/ViewList';
import WeekendIcon from '@mui/icons-material/Weekend';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getRooms, getStudents, getExams } from '../../services/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    rooms: 0,
    students: 0,
    exams: 0,
    arrangements: 0
  });
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roomsRes, studentsRes, examsRes] = await Promise.all([
          getRooms(),
          getStudents(),
          getExams()
        ]);

        // Count exams with seating arrangements
        const examsWithSeating = examsRes.data.filter(exam => exam.seating_arrangements && exam.seating_arrangements.length > 0);

        setStats({
          rooms: roomsRes.data.length,
          students: studentsRes.data.length,
          exams: examsRes.data.length,
          arrangements: examsWithSeating.length
        });
        setExams(examsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Rooms',
      count: stats.rooms,
      icon: <MeetingRoomIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      link: '/admin/rooms',
      description: 'Manage classroom locations and seating layouts'
    },
    {
      title: 'Students',
      count: stats.students,
      icon: <SchoolIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      link: '/admin/students',
      description: 'Upload and manage student information'
    },
    {
      title: 'Exams',
      count: stats.exams,
      icon: <EventNoteIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
      link: '/admin/exams',
      description: 'Schedule and manage upcoming exams'
    },
    {
      title: 'Seating Arrangements',
      count: stats.arrangements,
      icon: <ViewListIcon sx={{ fontSize: 48, color: 'info.main' }} />,
      link: '/admin/exams',
      description: 'View and modify generated seating plans'
    }
  ];

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
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome to the Exam Seating Arrangement System. Use the cards below to navigate.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {card.title}
                  </Typography>
                  {card.icon}
                </Box>
                <Typography variant="h3" component="div" gutterBottom>
                  {card.count}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {card.description}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  size="small" 
                  component={Link} 
                  to={card.link}
                  sx={{ width: '100%' }}
                >
                  Manage {card.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Exams with Seating Arrangements */}
      <Paper sx={{ p: 2, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Exams with Seating Arrangements
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            component={Link} 
            to="/admin/exams"
          >
            View All Exams
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>
            {exams
              .filter(exam => exam.seating_arrangements && exam.seating_arrangements.length > 0)
              .slice(0, 5)
              .map((exam, index) => (
                <React.Fragment key={exam.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary={exam.name} 
                      secondary={`${formatDate(exam.date)} • Room: ${exam.room_details?.room_id || exam.room}`}
                    />
                    <Chip 
                      icon={<WeekendIcon />}
                      label={`${exam.seating_arrangements.length} Students`}
                      size="small"
                      color="success"
                      sx={{ mr: 1 }}
                    />
                    <Tooltip title="View Seating Arrangement">
                      <IconButton 
                        component={Link} 
                        to={`/admin/exams/${exam.id}/seating`} 
                        size="small" 
                        color="info"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                </React.Fragment>
              ))}
            {exams.filter(exam => exam.seating_arrangements && exam.seating_arrangements.length > 0).length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No seating arrangements found" 
                  secondary="Generate seating arrangements from the Exams page"
                />
              </ListItem>
            )}
          </List>
        )}
      </Paper>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default AdminDashboard; 