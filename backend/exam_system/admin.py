from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Room, Student, Exam, SeatingArrangement, Timetable

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'user_type', 'department', 'is_staff')
    list_filter = ('user_type', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username', 'department')
    fieldsets = (*(UserAdmin.fieldsets or ()),
        ('Custom Fields', {'fields': ('user_type', 'department')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Custom Fields', {'fields': ('email', 'user_type', 'department')}),
    )

# Room Admin
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_id', 'floor_number', 'capacity', 'number_of_benches')
    search_fields = ('room_id',)
    ordering = ('floor_number', 'room_id')

# Student Admin
class StudentAdmin(admin.ModelAdmin):
    list_display = ('roll_number', 'name', 'department', 'year_of_study')
    list_filter = ('department', 'year_of_study')
    search_fields = ('roll_number', 'name', 'department')

# Exam Admin
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'time', 'room', 'exam_type')
    list_filter = ('date', 'room', 'exam_type')
    search_fields = ('name',)

# Seating Arrangement Admin
class SeatingArrangementAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'bench_number', 'position')
    list_filter = ('exam', 'bench_number', 'position')
    search_fields = ('student__name', 'student__roll_number')

# Timetable Admin
class TimetableAdmin(admin.ModelAdmin):
    list_display = ('subject_code', 'subject_name', 'date', 'start_time', 'end_time', 'exam_type', 'status')
    list_filter = ('date', 'exam_type', 'status', 'department')
    search_fields = ('subject_code', 'subject_name')
    ordering = ('date', 'start_time')

# Register models
admin.site.register(User, CustomUserAdmin)
admin.site.register(Student, StudentAdmin)
admin.site.register(Exam, ExamAdmin)
admin.site.register(SeatingArrangement, SeatingArrangementAdmin)
admin.site.register(Timetable, TimetableAdmin)
