import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert, 
  Button, 
  Tooltip, 
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Menu,
  ListItemIcon,
  ListItemText,
  MenuItem as MenuItemMUI,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import WeekendIcon from '@mui/icons-material/Weekend';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamSeatingDetails, getDepartmentSeating, generateSeating } from '../../services/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import '../../styles/printStyles.css';

const SeatingVisualization = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [seatingArrangement, setSeatingArrangement] = useState([]);
  const [selectedView, setSelectedView] = useState('grid'); // 'grid' or 'list'
  const [deptStats, setDeptStats] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const printRef = useRef(null);
  
  // Department colors for consistent visualization
  const departmentColors = {
    'Computer Science': theme.palette.primary.main,
    'Electrical Engineering': theme.palette.secondary.main,
    'Mechanical Engineering': theme.palette.error.main,
    'Civil Engineering': theme.palette.warning.main,
    'Chemical Engineering': theme.palette.info.main,
    'Mathematics': theme.palette.success.main
  };
  
  // Get a color for a department, with fallback
  const getDepartmentColor = (dept) => {
    return departmentColors[dept] || theme.palette.grey[500];
  };

  // Helper function to process department statistics
  const processDepartmentStats = (arrangements) => {
    if (!arrangements || arrangements.length === 0) return;
    
    const deptMap = {};
    arrangements.forEach(arrangement => {
      // Handle both nested and flat student data structures
      const dept = arrangement.student?.department || arrangement.student_department;
      if (!dept) return; // Skip if department info is missing
      
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          student_count: 0
        };
      }
      deptMap[dept].student_count++;
    });
    
    // Convert to array for rendering
    setDeptStats(Object.values(deptMap));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch exam details including seating arrangement
        const detailsResponse = await getExamSeatingDetails(examId);
        setExamDetails(detailsResponse.data);
        
        // Check if seating arrangements exist and set them
        const arrangements = detailsResponse.data.seating_arrangements || [];
        setSeatingArrangement(arrangements);
        
        // Only try to fetch department statistics if we have seating arrangements
        if (arrangements.length > 0) {
          try {
            // Try to fetch department statistics, but make it optional
            const deptResponse = await getDepartmentSeating(examId);
            if (deptResponse.data && deptResponse.data.seating_arrangements) {
              processDepartmentStats(deptResponse.data.seating_arrangements);
            }
          } catch (deptError) {
            console.error('Error fetching department statistics:', deptError);
            // Generate department stats from the existing seating arrangements instead
            processDepartmentStats(arrangements);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching seating arrangement:', error);
        setError('Failed to load seating arrangement. Please try again.');
        setLoading(false);
      }
    };

    if (examId) {
      fetchData();
    }
    
    // Add refresh function - but only if we have no seating arrangements yet
    const refreshTimer = setInterval(() => {
      if (examId && seatingArrangement.length === 0 && !error) {
        fetchData();
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(refreshTimer);
    };
  }, [examId, error, seatingArrangement.length]);

  const handleViewChange = (event) => {
    setSelectedView(event.target.value);
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

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Fetch exam details including seating arrangement
      const detailsResponse = await getExamSeatingDetails(examId);
      setExamDetails(detailsResponse.data);
      const arrangements = detailsResponse.data.seating_arrangements || [];
      setSeatingArrangement(arrangements);
      
      // Only try to fetch department statistics if we have seating arrangements
      if (arrangements.length > 0) {
        try {
          // Try to fetch department statistics, but don't fail if it doesn't work
          const deptResponse = await getDepartmentSeating(examId);
          if (deptResponse.data && deptResponse.data.seating_arrangements) {
            processDepartmentStats(deptResponse.data.seating_arrangements);
          }
        } catch (deptError) {
          console.error('Error fetching department statistics:', deptError);
          // Generate department stats from the existing seating arrangements instead
          processDepartmentStats(arrangements);
        }
      }
      
      setError(null);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateSeating = async () => {
    setLoading(true);
    try {
      // Generate seating arrangement
      await generateSeating(examId);
      
      // Refresh the data to show the new arrangement
      try {
        // Fetch exam details including seating arrangement
        const detailsResponse = await getExamSeatingDetails(examId);
        setExamDetails(detailsResponse.data);
        const arrangements = detailsResponse.data.seating_arrangements || [];
        setSeatingArrangement(arrangements);
        
        // Only try to fetch department statistics if we have seating arrangements
        if (arrangements.length > 0) {
          try {
            // Try to fetch department statistics, but don't fail if it doesn't work
            const deptResponse = await getDepartmentSeating(examId);
            if (deptResponse.data && deptResponse.data.seating_arrangements) {
              processDepartmentStats(deptResponse.data.seating_arrangements);
            }
          } catch (deptError) {
            console.error('Error fetching department statistics:', deptError);
            // Generate department stats from the existing seating arrangements instead
            processDepartmentStats(arrangements);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing data after generation:', refreshError);
        setError('Seating was generated but there was an issue loading the view. Please refresh the page.');
      }
      
      setError(null);
    } catch (error) {
      console.error('Error generating seating:', error);
      setError('Failed to generate seating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Save current title
    const originalTitle = document.title;
    
    // Set print title
    document.title = `Seating_Plan_${examDetails?.name || 'Exam'}_${examId}`;
    
    // Add print styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
      @page {
        size: landscape;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Use timeout to allow React to update state before printing
    setTimeout(() => {
      window.print();
      
      // Reset after print
      setIsPrinting(false);
      document.title = originalTitle;
      document.head.removeChild(style);
    }, 100);
  };
  
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Generate a tabular format of seating data for CSV export
  const generateSeatingCsv = () => {
    // Create header row
    let csvContent = "Student Roll Number,Student Name,Department,Bench Number,Position\n";
    
    // Add data rows
    seatingArrangement.forEach(seat => {
      const student = seat.student || {};
      const row = [
        student.roll_number || '',
        student.name || '',
        student.department || '',
        seat.bench_number || '',
        seat.position || ''
      ];
      // Escape any commas in the data
      const escapedRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`);
      csvContent += escapedRow.join(',') + '\n';
    });
    
    return csvContent;
  };
  
  const exportToCsv = () => {
    const csvContent = generateSeatingCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Seating_Plan_${examDetails?.name || 'Exam'}_${examId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add a function to generate a tabular view for printing
  const generateTableView = () => {
    return (
      <TableContainer className="print-only" sx={{ mt: 4, display: 'none', '@media print': { display: 'block' } }}>
        <Typography variant="h6" gutterBottom>Seating Arrangement Details</Typography>
        <Table className="seating-table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Roll Number</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Bench</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seatingArrangement
              .sort((a, b) => {
                // Sort by bench number first, then by position
                if (a.bench_number !== b.bench_number) {
                  return a.bench_number - b.bench_number;
                }
                // Put 'left' before 'right', and 'single' at the end
                const posOrder = { 'left': 0, 'right': 1, 'single': 2 };
                return posOrder[a.position] - posOrder[b.position];
              })
              .map((seat) => {
                const student = seat.student || {};
                return (
                  <TableRow key={seat.id || `${seat.bench_number}-${seat.position}`}>
                    <TableCell className="student-roll">{student.roll_number || 'N/A'}</TableCell>
                    <TableCell className="student-name">{student.name || 'N/A'}</TableCell>
                    <TableCell className="student-dept">{student.department || 'N/A'}</TableCell>
                    <TableCell>{seat.bench_number || 'N/A'}</TableCell>
                    <TableCell>{seat.position || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!examDetails) {
    return (
      <Alert severity="warning">
        Exam details not found. Please select a valid exam.
      </Alert>
    );
  }

  // Group seating arrangements by bench
  const getBenchArrangements = () => {
    const benchMap = {};
    
    seatingArrangement.forEach(seat => {
      const { bench_number, position, student } = seat;
      
      if (!benchMap[bench_number]) {
        benchMap[bench_number] = { students: [] };
      }
      
      benchMap[bench_number].students.push({
        ...student,
        position
      });
    });
    
    return benchMap;
  };

  // Generate a bench-based visualization for the seating
  const generateSeatingGrid = () => {
    if (!examDetails.room_details) {
      return (
        <Alert severity="info">
          Room information is not available.
        </Alert>
      );
    }

    const benchArrangements = getBenchArrangements();
    const isInternalExam = examDetails.exam_type === 'internal';
    
    // Define how many benches to show per row for visual layout
    const benchesPerRow = 4;
    
    // Calculate number of bench rows needed for display
    const totalBenches = examDetails.room_details.num_benches;
    const numRows = Math.ceil(totalBenches / benchesPerRow);
    
    // Create a 2D array to represent rows of benches
    const benchRows = Array(numRows).fill().map((_, rowIndex) => {
      const startBench = rowIndex * benchesPerRow + 1;
      const endBench = Math.min(startBench + benchesPerRow - 1, totalBenches);
      return Array.from({ length: endBench - startBench + 1 }, (_, i) => startBench + i);
    });

    return (
      <Box sx={{ overflowX: 'auto', mt: 2 }}>
        <Box 
          sx={{ 
            display: 'inline-block', 
            border: '1px solid #ccc', 
            borderRadius: 2,
            p: 2,
            backgroundColor: '#f8f8f8',
            width: '100%'
          }}
        >
          {/* Seating grid */}
          <Grid container spacing={3} justifyContent="center">
            {benchRows.map((row, rowIndex) => (
              <Grid item xs={12} key={`row-${rowIndex}`} className="bench-row">
                <Grid container spacing={3} justifyContent="center">
                  {row.map((benchNumber) => {
                    const benchData = benchArrangements[benchNumber] || { students: [] };
                    const isEmpty = benchData.students.length === 0;
                    
                    // For internal exams, a bench can have 2 students
                    const leftStudent = benchData.students.find(s => s.position === 'left' || s.position === 'single');
                    const rightStudent = benchData.students.find(s => s.position === 'right');
                    
                    return (
                      <Grid item key={`bench-${benchNumber}`}>
                        <Card
                          className="bench-card"
                          sx={{
                            width: 180,
                            height: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: isEmpty ? '#f5f5f5' : '#e8f5e9',
                            border: '1px solid',
                            borderColor: isEmpty ? 'divider' : '#c5e1a5',
                            position: 'relative',
                            '&:hover': {
                              boxShadow: 3
                            }
                          }}
                        >
                          {/* Bench number */}
                          <Typography 
                            variant="caption" 
                            sx={{
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              padding: '0px 4px',
                              borderRadius: 1
                            }}
                          >
                            Bench #{benchNumber}
                          </Typography>
                          
                          <WeekendIcon 
                            sx={{ 
                              position: 'absolute',
                              bottom: 5,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              color: 'rgba(0,0,0,0.2)',
                              fontSize: '1.2rem'
                            }} 
                          />
                          
                          {/* For internal exams - two students */}
                          {isInternalExam ? (
                            <Box sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              height: '100%',
                              pt: 3,
                              px: 1
                            }}>
                              {/* Left student */}
                              <Tooltip title={leftStudent ? 
                                `${leftStudent.name} (${leftStudent.roll_number})
                                Department: ${leftStudent.department}
                                Year: ${leftStudent.year_of_study}` 
                                : 'Empty Seat'
                              }>
                                <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  width: '45%'
                                }} className="student-details">
                                  {leftStudent ? (
                                    <>
                                      <PersonIcon style={{ color: getDepartmentColor(leftStudent.department) }} />
                                      <Typography variant="caption" className="student-roll" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                                        {leftStudent.roll_number}
                                      </Typography>
                                    </>
                                  ) : (
                                    <Typography variant="caption" color="textSecondary">
                                      Empty
                                    </Typography>
                                  )}
                                </Box>
                              </Tooltip>
                              
                              <Divider orientation="vertical" flexItem />
                              
                              {/* Right student */}
                              <Tooltip title={rightStudent ? 
                                `${rightStudent.name} (${rightStudent.roll_number})
                                Department: ${rightStudent.department}
                                Year: ${rightStudent.year_of_study}` 
                                : 'Empty Seat'
                              }>
                                <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  width: '45%'
                                }} className="student-details">
                                  {rightStudent ? (
                                    <>
                                      <PersonIcon style={{ color: getDepartmentColor(rightStudent.department) }} />
                                      <Typography variant="caption" className="student-roll" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                                        {rightStudent.roll_number}
                                      </Typography>
                                    </>
                                  ) : (
                                    <Typography variant="caption" color="textSecondary">
                                      Empty
                                    </Typography>
                                  )}
                                </Box>
                              </Tooltip>
                            </Box>
                          ) : (
                            /* For semester exams - single student */
                            <Tooltip title={leftStudent ? 
                              `${leftStudent.name} (${leftStudent.roll_number})
                              Department: ${leftStudent.department}
                              Year: ${leftStudent.year_of_study}` 
                              : 'Empty Seat'
                            }>
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                pt: 1
                              }} className="student-details">
                                {leftStudent ? (
                                  <>
                                    <PersonIcon style={{ color: getDepartmentColor(leftStudent.department) }} />
                                    <Typography variant="caption" className="student-roll" sx={{ mt: 0.5, fontSize: '0.7rem', textAlign: 'center' }}>
                                      {leftStudent.roll_number}
                                    </Typography>
                                    <Typography variant="caption" className="student-dept" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                                      {leftStudent.department}
                                    </Typography>
                                  </>
                                ) : (
                                  <Typography variant="caption" color="textSecondary">
                                    Empty Seat
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          )}
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  };

  // Generate a list view of seating by department
  const generateDepartmentView = () => {
    if (!deptStats || deptStats.length === 0) {
      return (
        <Alert severity="info">
          Department statistics are not available.
        </Alert>
      );
    }

    // Group students by department for detailed view
    const deptStudentMap = {};
    seatingArrangement.forEach(seat => {
      // Handle both nested and flat student data formats
      const student = seat.student || seat;
      const dept = student.department || seat.student_department;
      
      if (!dept) return; // Skip if no department info
      
      if (!deptStudentMap[dept]) {
        deptStudentMap[dept] = [];
      }
      
      deptStudentMap[dept].push({
        id: seat.id || `seat-${Math.random()}`,
        name: student.name || student.student_name || 'Unknown',
        roll_number: student.roll_number || student.student_roll_number || 'N/A',
        bench_number: seat.bench_number || 'N/A',
        position: seat.position || 'N/A',
        year_of_study: student.year_of_study || student.year || 'N/A'
      });
    });

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {deptStats.map((dept) => (
          <Grid item xs={12} key={dept.department}>
            <Card sx={{ 
              borderLeft: '5px solid', 
              borderColor: getDepartmentColor(dept.department) 
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: getDepartmentColor(dept.department) }}>
                  {dept.department}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  Total Students: {dept.student_count}
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {deptStudentMap[dept.department] && deptStudentMap[dept.department].length > 0 ? (
                  <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                    <Box sx={{ display: 'flex', fontWeight: 'bold', mb: 1 }}>
                      <Box sx={{ width: '30%' }}>Roll Number</Box>
                      <Box sx={{ width: '40%' }}>Name</Box>
                      <Box sx={{ width: '30%' }}>Seat</Box>
                    </Box>
                    <Divider />
                    {deptStudentMap[dept.department]
                      .sort((a, b) => a.roll_number.toString().localeCompare(b.roll_number.toString()))
                      .map(student => (
                        <Box key={student.id} sx={{ display: 'flex', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                          <Box sx={{ width: '30%' }}>{student.roll_number}</Box>
                          <Box sx={{ width: '40%' }}>{student.name}</Box>
                          <Box sx={{ width: '30%' }}>
                            Bench {student.bench_number}, {student.position}
                          </Box>
                        </Box>
                      ))
                    }
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No students found for this department.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
        <Typography variant="h5">Exam Seating Visualization</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/admin/exams')}
            startIcon={<EventIcon />}
          >
            Back to Exams
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }} className="no-print">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">{examDetails.name}</Typography>
            </Box>
            <Typography variant="body1">
              Date: {formatDate(examDetails.date)} at {formatTime(examDetails.time)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <MeetingRoomIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="body1">
                Room: {examDetails.room_details?.room_id || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip 
                label={examDetails.exam_type === 'internal' ? 'Internal Exam' : 'Semester Exam'} 
                color={examDetails.exam_type === 'internal' ? 'secondary' : 'primary'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleAltIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">
                Students: {seatingArrangement.length} / {examDetails.room_details?.capacity || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WeekendIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="body1">
                Benches: {examDetails.room_details?.num_benches || 'N/A'}
                {examDetails.exam_type === 'internal' ? ' (2 students per bench)' : ' (1 student per bench)'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
          <Typography variant="h6">Seating Layout</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>View Mode</InputLabel>
              <Select
                value={selectedView}
                label="View Mode"
                onChange={handleViewChange}
              >
                <MenuItem value="grid">Bench Layout</MenuItem>
                <MenuItem value="departments">By Department</MenuItem>
              </Select>
            </FormControl>
            {seatingArrangement.length === 0 && (
              <Button 
                variant="contained" 
                color="success"
                onClick={handleGenerateSeating}
                disabled={loading}
              >
                Generate Seating
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary"
              aria-controls="export-menu"
              aria-haspopup="true"
              onClick={handleExportMenuOpen}
              startIcon={<DownloadIcon />}
              disabled={seatingArrangement.length === 0}
            >
              Export
            </Button>
            <Menu
              id="export-menu"
              anchorEl={exportMenuAnchor}
              keepMounted
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItemMUI onClick={() => {
                handleExportMenuClose();
                handlePrint();
              }}>
                <ListItemIcon>
                  <PrintIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Print View" />
              </MenuItemMUI>
              <MenuItemMUI onClick={() => {
                handleExportMenuClose();
                exportToCsv();
              }}>
                <ListItemIcon>
                  <TableViewIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export to CSV" />
              </MenuItemMUI>
            </Menu>
          </Box>
        </Box>
        
        {seatingArrangement.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }} className="no-print">
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                '& .MuiAlert-message': { 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 2 
                } 
              }}
            >
              <Typography variant="body1" sx={{ mb: 1 }}>
                No seating arrangement has been generated for this exam yet.
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                size="large" 
                onClick={handleGenerateSeating}
                disabled={loading}
                startIcon={<AutoAwesomeIcon />}
              >
                Generate Seating Arrangement
              </Button>
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Clicking the button above will create a seating plan based on the configured rules.
              Students will be arranged according to roll numbers with alternating departments.
            </Typography>
          </Box>
        ) : (
          <div className={isPrinting ? 'print-content' : ''} ref={printRef}>
            {/* Print header - only visible when printing */}
            {isPrinting && (
              <Box sx={{ mb: 3, display: 'none', className: 'print-only', '@media print': { display: 'block' } }}>
                <Typography variant="h4" align="center" gutterBottom>
                  Seating Arrangement
                </Typography>
                <Typography variant="h5" align="center" gutterBottom>
                  {examDetails.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, my: 2 }}>
                  <Typography variant="body1">
                    Date: {formatDate(examDetails.date)}
                  </Typography>
                  <Typography variant="body1">
                    Time: {formatTime(examDetails.time)}
                  </Typography>
                  <Typography variant="body1">
                    Room: {examDetails.room_details?.room_id || 'N/A'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}
            
            {selectedView === 'grid' ? generateSeatingGrid() : (
              // Safely render department view or fallback to grid view if there are issues
              <React.Fragment>
                {deptStats && deptStats.length > 0 ? generateDepartmentView() : (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      Department view could not be loaded. Showing bench layout instead.
                    </Alert>
                    {generateSeatingGrid()}
                  </Box>
                )}
              </React.Fragment>
            )}
            
            {/* Add tabular view for printing */}
            {generateTableView()}
            
            {/* Print footer - only visible when printing */}
            {isPrinting && (
              <Box sx={{ mt: 4, display: 'none', className: 'print-only', '@media print': { display: 'block' } }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" align="center">
                  Total Students: {seatingArrangement.length} | Printed on: {new Date().toLocaleString()}
                </Typography>
              </Box>
            )}
          </div>
        )}
      </Paper>
    </div>
  );
};

export default SeatingVisualization; 