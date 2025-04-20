import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { uploadTimetableFile } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TimetableUpload = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // UI states - moved before useEffect
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate, loading]);

  // Window states
  const [showSecondWindow, setShowSecondWindow] = useState(false);

  // First window states
  const [examType, setExamType] = useState('semester');
  const [pdfFile, setPdfFile] = useState(null);

  // Second window states (form data)
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  // Extracted and editable data states
  const [extractedData, setExtractedData] = useState(null);
  const [entries, setEntries] = useState([{
    subject_code: '',
    subject_name: '',
    exam_date: '',
    exam_time: ''
  }]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file only');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setPdfFile(file);
    setError('');
    setSuccess('');
  };

  const handleProcessPDF = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('exam_type', examType);

      // Initial upload feedback
      setSuccess('Uploading PDF file...');

      // Upload and process the file
      const response = await uploadTimetableFile(formData);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Log extracted data
      console.log('=== PDF Processing Results ===');
      console.log('Response:', response.data);
      console.log('Entries:', response.data.entries || []);
      console.log('Warnings:', response.data.warnings || []);
      console.log('============================');

      // Update success message
      setSuccess('Timetable data extracted successfully!');
      setExtractedData(response.data);

      // Process and validate entries
      const extractedEntries = response.data.entries || [];
      if (extractedEntries.length === 0) {
        throw new Error('No exam entries were found in the PDF');
      }

      setEntries(extractedEntries);

      // Handle warnings if present
      if (response.data.warnings?.length > 0) {
        setError('Note: Some entries require attention:\n' + response.data.warnings.join('\n'));
      }

      // Show the form after successful processing
      setTimeout(() => {
        setShowSecondWindow(true);
      }, 1000);

    } catch (error) {
      console.error('Error processing timetable:', error);
      setSuccess('');
      setError(
        error.message ||
        error.response?.data?.error ||
        'Failed to process timetable. Please ensure the PDF is properly formatted.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleExamTypeChange = (event, newValue) => {
    setExamType(newValue);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!entries.length) {
        throw new Error('No exam entries to save');
      }

      const timetableData = {
        exam_type: examType,
        department,
        year,
        semester,
        entries: entries.map(entry => ({
          ...entry,
          status: 'verified',
          exam_type: examType
        }))
      };

      await uploadTimetableFile(timetableData);
      setSuccess('Timetable saved successfully');
      setTimeout(() => navigate('/admin/exams'), 2000);
    } catch (error) {
      console.error('Error saving timetable:', error);
      setError(error.response?.data?.message || 'Failed to save timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
  };

  const handleBack = () => {
    setShowSecondWindow(false);
    setPdfFile(null);
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Upload Exam Timetable
      </Typography>

      {!showSecondWindow ? (
        // First Window - Exam Type Selection and PDF Upload
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Select Exam Type and Upload Timetable
          </Typography>

          <FormControl fullWidth sx={{ mb: 4 }}>
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

          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 1,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa'
            }}
          >
            {processing ? (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Processing timetable...</Typography>
              </Box>
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Timetable PDF
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
                  Drag and drop your PDF file here, or click to select
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  size="large"
                  startIcon={<UploadIcon />}
                >
                  Select PDF File
                  <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleFileUpload}
                  />
                </Button>
                {pdfFile && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Selected file: {pdfFile.name}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleProcessPDF}
                      disabled={processing}
                    >
                      Process PDF
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      ) : (
        <Box sx={{ width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Extracted Timetable Data</Typography>
              <Button
                startIcon={isEditing ? <CheckCircleIcon /> : <EditIcon />}
                onClick={isEditing ? handleFinishEditing : handleEdit}
              >
                {isEditing ? 'Finish Editing' : 'Edit Data'}
              </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!isEditing}
                    label="Department"
                  >
                    <MenuItem value="CSE">Computer Science</MenuItem>
                    <MenuItem value="IT">Information Technology</MenuItem>
                    <MenuItem value="ECE">Electronics & Communication</MenuItem>
                    <MenuItem value="EEE">Electrical & Electronics</MenuItem>
                    <MenuItem value="MECH">Mechanical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={!isEditing}
                    label="Year"
                  >
                    <MenuItem value="1">First Year</MenuItem>
                    <MenuItem value="2">Second Year</MenuItem>
                    <MenuItem value="3">Third Year</MenuItem>
                    <MenuItem value="4">Fourth Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={!isEditing}
                    label="Semester"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <MenuItem key={num} value={num.toString()}>
                        Semester {num}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Exam Schedule
            </Typography>

            {entries.map((entry, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Subject Code"
                      value={entry.subject_code}
                      onChange={(e) => handleEntryChange(index, 'subject_code', e.target.value)}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Subject Name"
                      value={entry.subject_name}
                      onChange={(e) => handleEntryChange(index, 'subject_name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Exam Date"
                      value={entry.exam_date}
                      onChange={(e) => handleEntryChange(index, 'exam_date', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Exam Time"
                      value={entry.exam_time}
                      onChange={(e) => handleEntryChange(index, 'exam_time', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                {isEditing && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveEntry(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Paper>
            ))}

            {isEditing && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddEntry}
                sx={{ mt: 2 }}
              >
                Add Entry
              </Button>
            )}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={handleBack}>Back</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !entries.length}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Timetable'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TimetableUpload;
