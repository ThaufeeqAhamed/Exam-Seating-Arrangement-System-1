import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import { getStudents, uploadStudentExcel, clearStudents } from '../../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    department: '',
    year_of_study: '',
    semester: '',
    subject_code: '',
    seat_number: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      filterStudents();
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      student => 
        student.roll_number.toLowerCase().includes(query) ||
        student.name.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
        setError('No file selected. Please choose an Excel file.');
        return;
    }

    try {
        setUploadLoading(true);
        setError('');
        const response = await uploadStudentExcel(file);

        if (response.data.errors && response.data.errors.length > 0) {
            setError(`Some records had errors: ${response.data.errors.join(', ')}`);
        } else if (response.data.message) {
            setSuccess(response.data.message);
        } else {
            setError('Unexpected response from the server.');
        }

        setSnackbarOpen(true);
        setUploadOpen(false);
        setFile(null);
        fetchStudents(); // Refresh the list
    } catch (error) {
        console.error('Error uploading students:', error);
        setError(error.response?.data?.error || 'Failed to upload students. Please check your file format and try again.');
    } finally {
        setUploadLoading(false);
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setFormData({
      roll_number: '',
      name: '',
      department: '',
      year_of_study: '',
      semester: '',
      subject_code: '',
      seat_number: ''
    });
    setAddStudentOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStudentSubmit = async () => {
    // This would normally submit the form data to create a new student
    // For now, we'll just show a success message as this endpoint is not yet implemented
    setSuccess('Student data management is not yet fully implemented');
    setSnackbarOpen(true);
    setAddStudentOpen(false);
  };

  const handleDepartmentColor = (department) => {
    const deptColors = {
      'Computer Science': 'primary',
      'Electrical Engineering': 'secondary',
      'Mechanical Engineering': 'error',
      'Civil Engineering': 'warning',
      'Chemical Engineering': 'info',
      'Mathematics': 'success'
    };
    return deptColors[department] || 'default';
  };

  const handleClearStudents = async () => {
    try {
      await clearStudents();
      setStudents([]);
      setFilteredStudents([]);
      setSuccess('Student data cleared successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error clearing students:', error);
      setError('Failed to clear student data. Please try again.');
      setSnackbarOpen(true);
      // Refresh the list to ensure UI is in sync with backend
      fetchStudents();
    }
  };

  if (loading && students.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Student Management</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleClearStudents}
            sx={{ mr: 2 }}
          >
            Clear Data
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{ mr: 2 }}
          >
            Upload Excel Data
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PersonAddIcon />}
            onClick={handleAddStudent}
          >
            Add Student
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Manage Student Information
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Upload and manage student data, including roll numbers, names, and departments.
            Import data from Excel spreadsheets for efficient batch processing.
          </Typography>
        </Box>
        
        {error && !snackbarOpen && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              placeholder="Search students..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ width: 300 }}
            />
            <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
              {filteredStudents.length} students found
            </Typography>
          </Box>
        </Box>
        
        {filteredStudents.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <GroupIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
            <Typography variant="body1">
              {students.length === 0 
                ? "No students have been added yet. Upload student data to get started."
                : "No students match your search criteria."}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Roll Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Year</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Semester</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject Code</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Seat Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={student.department} 
                        size="small" 
                        color={handleDepartmentColor(student.department)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{student.year_of_study}</TableCell>
                    <TableCell>{student.semester}</TableCell>
                    <TableCell>{student.subject_code}</TableCell>
                    <TableCell>{student.seat_number}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="secondary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Upload Excel Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Student Data</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" gutterBottom>
              Upload an Excel file containing student information.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The Excel file should contain the following columns:
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                Required Excel columns:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><Typography variant="body2">roll_number (Student Roll Number)</Typography></li>
                <li><Typography variant="body2">name (Student Name)</Typography></li>
                <li><Typography variant="body2">department (Department Name)</Typography></li>
                <li><Typography variant="body2">year_of_study (Year of Study)</Typography></li>
                <li><Typography variant="body2">semester (Current Semester)</Typography></li>
                <li><Typography variant="body2">subject_code (Subject Code)</Typography></li>
                <li><Typography variant="body2">seat_number (Assigned Seat Number)</Typography></li>
              </ul>
            </Box>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.light',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                mb: 2
              }}
            >
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="contained-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="contained-button-file">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Select Excel File
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected file: {file.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            color="primary"
            disabled={!file || uploadLoading}
          >
            {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onClose={() => setAddStudentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <TextField
              margin="dense"
              label="Roll Number"
              name="roll_number"
              fullWidth
              value={formData.roll_number}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              label="Name"
              name="name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              label="Department"
              name="department"
              fullWidth
              value={formData.department}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              label="Year of Study"
              name="year_of_study"
              type="number"
              fullWidth
              value={formData.year_of_study}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              label="Semester"
              name="semester"
              type="number"
              fullWidth
              value={formData.semester}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              label="Subject Code"
              name="subject_code"
              fullWidth
              value={formData.subject_code}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              label="Seat Number"
              name="seat_number"
              fullWidth
              value={formData.seat_number}
              onChange={handleInputChange}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStudentSubmit} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={error || success}
      />
    </div>
  );
};

export default StudentManagement;