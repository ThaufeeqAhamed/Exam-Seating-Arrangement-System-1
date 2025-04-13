import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h3" color="error" gutterBottom>
            Access Denied
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 4 }}>
            You don't have permission to access this page.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {user && user.user_type === 'admin' ? (
              <Button
                component={Link}
                to="/admin"
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
              >
                Go to Admin Dashboard
              </Button>
            ) : user && user.user_type === 'faculty' ? (
              <Button
                component={Link}
                to="/faculty"
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
              >
                Go to Faculty Dashboard
              </Button>
            ) : (
              <Button
                component={Link}
                to="/login"
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
              >
                Go to Login
              </Button>
            )}
            
            <Button
              component={Link}
              to="/"
              variant="outlined"
            >
              Go to Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized; 