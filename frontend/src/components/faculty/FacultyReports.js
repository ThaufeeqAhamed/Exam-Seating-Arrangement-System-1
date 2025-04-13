import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../../context/AuthContext';

const FacultyReports = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const { user } = useAuth();

  const handleDownload = (reportType) => {
    // TODO: Implement actual report download logic
    setSnackbar({
      open: true,
      message: `${reportType} download started...`,
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const reports = [
    {
      title: 'Seating Arrangement Report',
      description: 'Download complete seating arrangement details for all assigned exams',
      type: 'seating'
    },
    {
      title: 'Room Allocation Report',
      description: 'View room-wise allocation of students for examination',
      type: 'room'
    },
    {
      title: 'Student List Report',
      description: 'Download list of students with their assigned seats and rooms',
      type: 'student'
    },
    {
      title: 'Attendance Sheet',
      description: 'Generate attendance sheets for exam supervision',
      type: 'attendance'
    }
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.type}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(report.title)}
                  variant="contained"
                  size="small"
                  fullWidth
                >
                  Download
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FacultyReports;