from rest_framework import serializers
from .models import User, Room, Student, Exam, SeatingArrangement, Timetable
from django.contrib.auth.password_validation import validate_password
import json
from datetime import datetime

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'user_type', 'department']
        read_only_fields = ['id']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'user_type', 'department']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'room_id', 'capacity', 'number_of_benches', 'floor_number', 'layout']
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data['layout']:
            try:
                data['layout'] = json.loads(data['layout'])
            except json.JSONDecodeError:
                data['layout'] = None
        return data
    
    def to_internal_value(self, data):
        if 'layout' in data and isinstance(data['layout'], (dict, list)):
            data['layout'] = json.dumps(data['layout'])
        return super().to_internal_value(data)

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'roll_number', 'name', 'department', 
            'year_of_study', 'semester', 'subject_code',
            'seat_number'
        ]
        read_only_fields = ['id']

class ExamSerializer(serializers.ModelSerializer):
    room_id = serializers.CharField(source='room.room_id', read_only=True)
    
    class Meta:
        model = Exam
        fields = ['id', 'name', 'date', 'time', 'room', 'room_id', 'exam_type']
        read_only_fields = ['id']

class SeatingArrangementSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        write_only=True
    )
    
    class Meta:
        model = SeatingArrangement
        fields = ['id', 'exam', 'student', 'student_id', 'bench_number', 'position']
        read_only_fields = ['id']

class ExamWithSeatingSerializer(serializers.ModelSerializer):
    seating_arrangements = SeatingArrangementSerializer(many=True, read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = Exam
        fields = ['id', 'name', 'date', 'time', 'room', 'exam_type', 'room_details', 'seating_arrangements']
        read_only_fields = ['id']

class TimetableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timetable
        fields = [
            'id', 'subject_code', 'subject_name', 'department', 'date',
            'start_time', 'end_time', 'exam_type', 'status', 'room',
            'total_students', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_students']

    def validate(self, data):
        # Validate required fields
        required_fields = ['subject_code', 'subject_name', 'date', 'start_time']
        for field in required_fields:
            if field not in data:
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required'})

        # Validate exam type
        if 'exam_type' in data and data['exam_type'] not in ['internal', 'semester']:
            raise serializers.ValidationError({'exam_type': 'Exam type must be either "internal" or "semester"'})

        # Validate end time is after start time
        if 'end_time' in data and data['start_time'] and data['end_time'] <= data['start_time']:
            raise serializers.ValidationError({'end_time': 'End time must be after start time'})

        # Set default end time if not provided (2 hours after start time)
        if 'end_time' not in data and data.get('start_time'):
            hours = (data['start_time'].hour + 2) % 24
            data['end_time'] = data['start_time'].replace(hour=hours)

        # Set default status if not provided
        if 'status' not in data:
            data['status'] = 'scheduled'

        return data