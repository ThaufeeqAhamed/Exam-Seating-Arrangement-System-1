from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import json
from django.utils import timezone

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('faculty', 'Faculty'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    department = models.CharField(max_length=50, blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'user_type']
    
    def __str__(self):
        return self.email

class Room(models.Model):
    room_id = models.CharField(max_length=10, unique=True)
    capacity = models.IntegerField(default=0)
    number_of_benches = models.IntegerField(default=0)
    floor_number = models.IntegerField(default=1)
    layout = models.TextField(blank=True, null=True)  # JSON string of the layout
    
    def __str__(self):
        return f"Room {self.room_id} (Floor {self.floor_number}) - Capacity: {self.capacity}, Benches: {self.number_of_benches}"
    
    def save_layout(self, layout_data):
        self.layout = json.dumps(layout_data)
        self.save()
    
    def get_layout(self):
        if self.layout:
            return json.loads(self.layout)
        return None

class Student(models.Model):
    roll_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50)
    year_of_study = models.IntegerField(default=1)
    semester = models.IntegerField(default=1)
    subject_code = models.CharField(max_length=20, blank=True, null=True)
    exam_date = models.DateField(null=True, blank=True)
    exam_time = models.TimeField(null=True, blank=True)
    seat_number = models.CharField(max_length=10, blank=True, null=True)
    
    def __str__(self):
        return f"{self.roll_number} - {self.name}"

class Exam(models.Model):
    EXAM_TYPE_CHOICES = (
        ('internal', 'Internal Exam'),
        ('semester', 'Semester Exam'),
    )
    
    name = models.CharField(max_length=100)
    date = models.DateField()
    time = models.TimeField()
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='exams')
    exam_type = models.CharField(max_length=10, choices=EXAM_TYPE_CHOICES, default='semester')
    
    def __str__(self):
        return f"{self.name} - {self.date} {self.time}"

class SeatingArrangement(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='seating_arrangements')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    bench_number = models.IntegerField()
    position = models.CharField(max_length=10, default='single', 
                               choices=(('left', 'Left Side'), ('right', 'Right Side'), ('single', 'Single')))
    
    class Meta:
        unique_together = (('exam', 'bench_number', 'position'), ('exam', 'student'))
    
    def __str__(self):
        return f"{self.student.roll_number} at bench {self.bench_number} ({self.position})"

class Timetable(models.Model):
    EXAM_TYPE_CHOICES = (
        ('internal', 'Internal Exam'),
        ('semester', 'Semester Exam'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    )
    
    subject_code = models.CharField(max_length=20)
    subject_name = models.CharField(max_length=100)
    department = models.CharField(max_length=50, blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    exam_type = models.CharField(max_length=10, choices=EXAM_TYPE_CHOICES, default='semester')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='timetables')
    total_students = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('subject_code', 'date', 'start_time')
        ordering = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.subject_code} - {self.subject_name} - {self.date} {self.start_time}"
