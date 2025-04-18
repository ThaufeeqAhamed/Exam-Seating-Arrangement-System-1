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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../services/api';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_id: '',
    capacity: '',
    number_of_benches: '',
    floor_number: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getRooms();
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setError('Failed to load rooms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setFormData({
      room_id: '',
      capacity: '',
      number_of_benches: '',
      floor_number: 1
    });
    setOpenDialog(true);
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setFormData({
      room_id: room.room_id,
      capacity: room.capacity,
      number_of_benches: room.number_of_benches,
      floor_number: room.floor_number
    });
    setOpenDialog(true);
  };

  const handleDeleteRoom = (room) => {
    setSelectedRoom(room);
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
    // For numeric inputs, convert to numbers
    if (['capacity', 'number_of_benches', 'floor_number'].includes(name)) {
      setFormData({ ...formData, [name]: value === '' ? '' : parseInt(value, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!formData.room_id || !formData.capacity || !formData.number_of_benches) {
        setError('Please fill out all fields');
        return;
      }

      if (formData.capacity <= 0 || formData.number_of_benches <= 0) {
        setError('Capacity and number of benches must be positive numbers');
        return;
      }

      // For internal exams, capacity should be at least twice the number of benches
      // For semester exams, capacity should be at least equal to the number of benches
      if (formData.capacity < formData.number_of_benches) {
        setError('Capacity should be at least equal to the number of benches');
        return;
      }

      const roomData = {
        room_id: formData.room_id,
        capacity: formData.capacity,
        number_of_benches: formData.number_of_benches,
        floor_number: formData.floor_number
      };

      let response;
      if (selectedRoom) {
        // Update existing room
        response = await updateRoom(selectedRoom.id, roomData);
        setSuccess('Room updated successfully');
      } else {
        // Create new room
        response = await createRoom(roomData);
        setSuccess('Room created successfully');
      }

      // Refresh the room list
      const roomsResponse = await getRooms();
      setRooms(roomsResponse.data);

      // Close the dialog
      setOpenDialog(false);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving room:', error);
      if (error.response && error.response.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : 'Failed to save room. It may already exist.';
        setError(errorMsg);
      } else {
        setError('Failed to save room. Please try again.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRoom(selectedRoom.id);
      
      // Refresh the room list
      const roomsResponse = await getRooms();
      setRooms(roomsResponse.data);
      
      setOpenDeleteDialog(false);
      setSuccess('Room deleted successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room. It may be in use by exams.');
      setSnackbarOpen(true);
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
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Room Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateRoom}
        >
          Add New Room
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Manage Classroom Locations and Seating Layouts
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and configure rooms for exam seating arrangements. Define the room capacity, 
            dimensions, and special accommodations for students with disabilities.
          </Typography>
        </Box>
        
        {error && !snackbarOpen && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {rooms.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <MeetingRoomIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
            <Typography variant="body1">
              No rooms have been added yet. Click "Add New Room" to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Room ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Floor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Capacity</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Number of Benches</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>{room.room_id}</TableCell>
                    <TableCell>{room.floor_number}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.number_of_benches}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit Room">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditRoom(room)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Room">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteRoom(room)}
                        >
                          <DeleteIcon />
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
      
      {/* Create/Edit Room Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            name="room_id"
            label="Room ID"
            fullWidth
            value={formData.room_id}
            onChange={handleInputChange}
            required
            disabled={!!selectedRoom} // Disable if editing (can't change room ID)
            helperText={selectedRoom ? "Room ID cannot be changed" : ""}
          />
          
          <TextField
            margin="dense"
            name="capacity"
            label="Capacity"
            type="number"
            fullWidth
            value={formData.capacity}
            onChange={handleInputChange}
            required
            inputProps={{ min: 1 }}
            helperText="Maximum number of students that can be seated"
          />
          
          <TextField
            margin="dense"
            name="number_of_benches"
            label="Number of Benches"
            type="number"
            fullWidth
            value={formData.number_of_benches}
            onChange={handleInputChange}
            required
            inputProps={{ min: 1 }}
            helperText="Total number of benches in the room"
          />
          
          <TextField
            margin="dense"
            name="floor_number"
            label="Floor Number"
            type="number"
            fullWidth
            value={formData.floor_number}
            onChange={handleInputChange}
            required
            inputProps={{ min: 1 }}
            helperText="Floor number of the room"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              For internal exams: 2 students per bench (if possible)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              For semester exams: 1 student per bench
            </Typography>
          </Box>
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
            Are you sure you want to delete the room "{selectedRoom?.room_id}"? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Note: You cannot delete a room that is currently assigned to any exams.
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
        message={error || success}
      />
    </div>
  );
};

export default RoomManagement;