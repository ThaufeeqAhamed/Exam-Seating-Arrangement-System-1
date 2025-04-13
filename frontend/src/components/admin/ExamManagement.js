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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WeekendIcon from '@mui/icons-material/Weekend';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Link } from 'react-router-dom';
import { 
  getExams, 
  getRooms, 
  createExam, 
  updateExam, 
  deleteExam, 
  generateSeating
} from '../../services/api';
import { Stack } from '@mui/material';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingExamId, setGeneratingExamId] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    room: '',
    exam_type: 'semester'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [examType, setExamType] = useState('semester');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [entries, setEntries] = useState([{
    subject_code: '',
    subject_name: '',
    exam_date: '',
    exam_time: ''
  }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsResponse, roomsResponse] = await Promise.all([
          getExams(),
          getRooms()
        ]);
        setExams(examsResponse.data);
        setRooms(roomsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateExam = () => {
    setSelectedExam(null);
    setFormData({
      name: '',
      date: getCurrentDate(),
      time: '09:00',
      room: '',
      exam_type: 'semester'
    });
    setOpenDialog(true);
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    
    setFormData({
      name: exam.name,
      date: exam.date,
      time: exam.time.substring(0, 5), // Just get HH:MM part
      room: exam.room,
      exam_type: exam.exam_type || 'semester'
    });
    
    setOpenDialog(true);
  };

  const handleDeleteExam = (exam) => {
    setSelectedExam(exam);
    setOpenDeleteDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();

    // Add leading zeros if needed
    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;

    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.date || !formData.time || !formData.room || !formData.exam_type) {
        setError('Please fill out all fields');
        return;
      }

      const examData = {
        name: formData.name,
        date: formData.date,
        time: `${formData.time}:00`, // Add seconds
        room: formData.room,
        exam_type: formData.exam_type
      };

      let response;
      if (selectedExam) {
        // Update existing exam
        response = await updateExam(selectedExam.id, examData);
        setSuccess('Exam updated successfully');
      } else {
        // Create new exam
        response = await createExam(examData);
        setSuccess('Exam created successfully');
      }

      // Refresh the exam list
      const examsResponse = await getExams();
      setExams(examsResponse.data);

      // Close the dialog
      setOpenDialog(false);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving exam:', error);
      setError('Failed to save exam. Please try again.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleAddEntry = () => {
    setEntries([...entries, {
      subject_code: '',
      subject_name: '',
      exam_date: '',
      exam_time: ''
    }]);
  };

  const handleRemoveEntry = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleUploadSubmit = async () => {
    if (!pdfFile) {
      setError('Please upload a timetable file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('pdf_file', pdfFile);
      formData.append('exam_type', examType);
      formData.append('department', department);
      formData.append('year', year);
      formData.append('semester', semester);
      formData.append('entries', JSON.stringify(entries));

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Timetable uploaded successfully');
      setUploadOpen(false);
      setPdfFile(null);
      setEntries([{
        subject_code: '',
        subject_name: '',
        exam_date: '',
        exam_time: ''
      }]);
      
      // Refresh the exam list
      const examsResponse = await getExams();
      setExams(examsResponse.data);
    } catch (error) {
      console.error('Error uploading timetable:', error);
      setError(error.response?.data?.message || 'Failed to upload timetable');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteExam(selectedExam.id);
      
      // Refresh the exam list
      const examsResponse = await getExams();
      setExams(examsResponse.data);
      
      setOpenDeleteDialog(false);
      setSuccess('Exam deleted successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting exam:', error);
      setError('Failed to delete exam. Please try again.');
    }
  };



  const handleGenerateSeating = async (examId) => {
    try {
      setIsGenerating(true);
      setGeneratingExamId(examId);
      setError('');
      
      await generateSeating(examId);
      
      setSuccess('Seating arrangement generated successfully!');
      setSnackbarOpen(true);
      refreshExams();
    } catch (error) {
      console.error('Error generating seating:', error);
      setError('Failed to generate seating arrangement. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsGenerating(false);
      setGeneratingExamId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
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

  const getRoomNameById = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.room_id : roomId;
  };

  const refreshExams = async () => {
    try {
      setLoading(true);
      const examsResponse = await getExams();
      setExams(examsResponse.data);
      setSuccess('Exam data refreshed successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error refreshing exams:', error);
      setError('Failed to refresh exam data');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Exam Management</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            component={Link}
            to="/admin/timetable"
          >
            Upload Timetable
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateExam}
          >
            Add Exam
          </Button>
        </Stack>
      </Box>
      
      {/* Seating Arrangements Viewer Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              <WeekendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              View Seating Arrangements
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Select an exam below to view its seating arrangement visualization.
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refreshExams}
            disabled={loading}
          >
            Refresh List
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {exams
              .filter(exam => exam.seating_arrangements && exam.seating_arrangements.length > 0)
              .map((exam) => (
                <Grid item xs={12} sm={6} md={4} key={exam.id}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {exam.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatDate(exam.date)} at {formatTime(exam.time)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip 
                          label={getRoomNameById(exam.room)}
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          icon={<PeopleAltIcon />}
                          label={`${exam.seating_arrangements.length} Students`}
                          size="small"
                          color="success"
                        />
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        component={Link}
                        to={`/admin/exams/${exam.id}/seating`}
                        startIcon={<VisibilityIcon />}
                      >
                        View Seating Arrangement
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            }
            {exams.filter(exam => exam.seating_arrangements && exam.seating_arrangements.length > 0).length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    No seating arrangements have been generated yet. 
                    Generate a seating arrangement for an exam using the "Generate" button below.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {exams.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <EventAvailableIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
            <Typography variant="body1">
              No exams have been scheduled yet. Create a new exam to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Exam Date</TableCell>
                  <TableCell>Exam Time</TableCell>
                  <TableCell>Exam Name</TableCell>
                  <TableCell>Subject Code</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>{formatDate(exam.date)}</TableCell>
                    <TableCell>{formatTime(exam.time)}</TableCell>
                    <TableCell>{exam.subject_name}</TableCell>
                    <TableCell>{exam.subject_code}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleGenerateSeating(exam.id)}
                        disabled={isGenerating && generatingExamId === exam.id}
                        color="primary"
                        title="Generate Seating Arrangement"
                      >
                        {isGenerating && generatingExamId === exam.id ? (
                          <CircularProgress size={24} />
                        ) : (
                          <AssignmentIcon />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Create/Edit Exam Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedExam ? 'Edit Exam' : 'Schedule New Exam'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            name="name"
            label="Exam Name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Exam Type</InputLabel>
            <Select
              name="exam_type"
              value={formData.exam_type}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="internal">Internal Exam (2 students per bench)</MenuItem>
              <MenuItem value="semester">Semester Exam (1 student per bench)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="date"
            label="Exam Date"
            type="date"
            fullWidth
            value={formData.date}
            onChange={handleInputChange}
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <TextField
            margin="dense"
            name="time"
            label="Exam Time"
            type="time"
            fullWidth
            value={formData.time}
            onChange={handleInputChange}
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Room</InputLabel>
            <Select
              name="room"
              value={formData.room}
              onChange={handleInputChange}
              required
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.room_id} - Capacity: {room.capacity} ({room.num_benches} benches)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the exam "{selectedExam?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>

      {/* Upload Timetable Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Exam Timetable</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Exam Type</InputLabel>
              <Select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                label="Exam Type"
              >
                <MenuItem value="semester">Semester Exam</MenuItem>
                <MenuItem value="internal">Internal Exam</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Semester"
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.light',
                borderRadius: 1,
                p: 3,
                mt: 3,
                mb: 3,
                textAlign: 'center'
              }}
            >
              <input
                accept=".pdf"
                style={{ display: 'none' }}
                id="timetable-file-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="timetable-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Select PDF File
                </Button>
              </label>
              {pdfFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected file: {pdfFile.name}
                </Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Manual Entry
            </Typography>
            {entries.map((entry, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Subject Code"
                      value={entry.subject_code}
                      onChange={(e) => handleEntryChange(index, 'subject_code', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Subject Name"
                      value={entry.subject_name}
                      onChange={(e) => handleEntryChange(index, 'subject_name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={entry.exam_date}
                      onChange={(e) => handleEntryChange(index, 'exam_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Time"
                      type="time"
                      value={entry.exam_time}
                      onChange={(e) => handleEntryChange(index, 'exam_time', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveEntry(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddEntry}
              sx={{ mt: 1 }}
            >
              Add Entry
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            color="primary"
            disabled={uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamManagement;