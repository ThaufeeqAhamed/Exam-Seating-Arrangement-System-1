import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute = ({ 
  roleRequired, // 'admin', 'faculty', or null for any authenticated user
}) => {
  const { user, loading, initialized, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only run this check when auth is initialized and not loading
    if (initialized && !loading) {
      // If no user, redirect to login
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Check role requirements
      if (roleRequired) {
        if (roleRequired === 'admin' && !isAdmin()) {
          navigate('/unauthorized', { replace: true });
          return;
        }
        
        if (roleRequired === 'faculty' && !isFaculty()) {
          navigate('/unauthorized', { replace: true });
          return;
        }
      }
    }
  }, [user, loading, initialized, roleRequired, isAdmin, isFaculty, navigate]);

  // Show loading while auth state is being determined
  if (loading || !initialized) {
    return (
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (roleRequired) {
    if (roleRequired === 'admin' && !isAdmin()) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    if (roleRequired === 'faculty' && !isFaculty()) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If everything passes, render children routes
  return <Outlet />;
};

export default ProtectedRoute; 