# Exam Seating Arrangement System

A comprehensive web application for managing exam seating arrangements, built with React (frontend) and Django (backend). The system helps educational institutions efficiently manage and organize examination seating arrangements.

## Features

### Admin Features
- Dashboard with overview statistics
- Manage examination rooms and seating capacity
- Upload and manage student data
- Create and manage exam schedules
- Generate seating arrangements automatically
- View and export seating plans

### Faculty Features
- View exam schedules and seating arrangements
- Download examination reports
- Department-specific access control
- Real-time updates and notifications

## Tech Stack

### Frontend
- React.js
- Material-UI (MUI) for UI components
- React Router for navigation
- Context API for state management
- Axios for API communication

### Backend
- Django
- Django REST Framework
- SQLite database (can be configured for PostgreSQL)
- JWT Authentication

## Project Structure

```
├── backend/                  # Django backend
│   ├── backend/              # Django project settings
│   └── exam_system/          # Main Django app
│       ├── models.py         # Data models
│       ├── serializers.py    # API serializers
│       ├── views.py          # API views
│       ├── urls.py           # URL routing
│       └── utils.py          # Utility functions
│
└── frontend/                 # React frontend
    ├── public/               # Static files
    └── src/                  # React source code
        ├── components/       # React components
        │   ├── admin/        # Admin-specific components
        │   ├── auth/         # Authentication components
        │   ├── common/       # Shared components
        │   └── faculty/      # Faculty-specific components
        ├── context/          # React context (state management)
        ├── services/         # API services
        └── utils/            # Utility functions
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- npm (Node package manager)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

2. Login with appropriate credentials:
   - Admin portal: /admin
   - Faculty portal: /faculty

3. Follow the intuitive interface to:
   - Manage rooms and seating
   - Upload student data
   - Create exam schedules
   - Generate seating arrangements
   - View and download reports

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.