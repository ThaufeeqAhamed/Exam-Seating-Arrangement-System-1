import random
from .models import Student, Exam, SeatingArrangement, Room
import pandas as pd
from io import BytesIO
import PyPDF2
from PIL import Image
import pytesseract
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple
from PyPDF2 import PdfReader

def process_pdf_timetable(pdf_file) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Extract and process timetable information from PDF file."""
    if not pdf_file:
        return [], ["No file provided"]
        
    try:
        reader = PdfReader(pdf_file)
        if len(reader.pages) == 0:
            return [], ["PDF file is empty"]
            
        extracted_text = ""
        errors = []
        entries = []
        semester = None
    except Exception as e:
        return [], [f"Error initializing PDF reader: {str(e)}"]

    # Extract text from all pages
    try:
        print("\n=== Starting PDF Text Extraction ===")
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if not page_text.strip():
                    errors.append("Warning: Empty page detected")
                    continue
                extracted_text += page_text
                print(f"\nExtracted text from page:\n{page_text}")
                
                # Try to find semester information
                semester_match = re.search(r'(?i)SEMESTER[-\s]*(\w+)', page_text)
                if semester_match and not semester:
                    semester = semester_match.group(1).upper()
                    print(f"Found semester: {semester}")
            except Exception as e:
                errors.append(f"Error processing page: {str(e)}")
                continue
    except Exception as e:
        return [], [f"Error extracting text from PDF: {str(e)}"]

    if not extracted_text.strip():
        return [], ["No text could be extracted from the PDF"]

    # Convert extracted text to DataFrame for table processing
    try:
        # Split text into lines and identify table headers
        lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
        print("\n=== Processing Table Structure ===")
        print(f"Found {len(lines)} non-empty lines")
        
        table_data = []
        header_pattern = re.compile(r'(Day|Date|Time|Paper\s*Code|Paper|Subject)', re.IGNORECASE)
        
        # Find table start
        table_start = -1
        for i, line in enumerate(lines):
            if sum(1 for _ in header_pattern.finditer(line)) >= 3:
                table_start = i
                print(f"\nFound table header at line {i}:\n{line}")
                break
        
        if table_start == -1:
            print("\nNo table structure detected, falling back to pattern matching")
            errors.append("Could not find table headers in the PDF")
            return entries, errors
        
        # Process table rows
        current_date = None
        for line in lines[table_start + 1:]:
            # Skip empty lines and header-like lines
            if not line or header_pattern.search(line):
                continue
                
            # Try to extract date, time, and paper details
            date_match = re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', line)
            time_match = re.search(r'\d{1,2}:\d{2}\s*(?:AM|PM)?', line)
            code_match = re.search(r'([A-Z]{2,}\d{3,})', line)
            
            if date_match:
                current_date = date_match.group(0)
                
            if time_match and code_match:
                exam_time = time_match.group(0)
                subject_code = code_match.group(1)
                
                # Extract subject name (everything after code until next known pattern)
                subject_name = line[line.find(subject_code) + len(subject_code):]
                subject_name = re.split(r'\d{1,2}:\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', subject_name)[0].strip()
                
                if current_date and exam_time and subject_code:
                    try:
                        # Standardize date format
                        date_formats = ['%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y']
                        for fmt in date_formats:
                            try:
                                exam_date = datetime.strptime(current_date, fmt).strftime('%Y-%m-%d')
                                break
                            except ValueError:
                                continue
                                
                        # Standardize time format
                        if 'AM' in exam_time.upper() or 'PM' in exam_time.upper():
                            exam_time = datetime.strptime(exam_time.strip(), '%I:%M %p').strftime('%H:%M')
                        else:
                            exam_time = datetime.strptime(exam_time.strip(), '%H:%M').strftime('%H:%M')
                            
                        entries.append({
                            'subject_code': subject_code,
                            'subject_name': subject_name,
                            'exam_date': exam_date,
                            'exam_time': exam_time,
                            'semester': semester
                        })
                    except Exception as e:
                        errors.append(f"Error processing table row '{line}': {str(e)}")
                        
    except Exception as e:
        errors.append(f"Error processing table: {str(e)}")
        
    # Fallback to existing pattern matching if table processing fails
    if not entries:
        patterns = [
            # Format: CS101 - Introduction to Programming - 2024-03-01 - 09:00 AM
            r'([A-Z]{2,}\d{3,})\s*-\s*([^-]+)\s*-\s*(\d{4}-\d{2}-\d{2})\s*-\s*(\d{1,2}:\d{2}\s*[AaPp][Mm])',
            # Format: Subject Code: CS101 Subject: Programming Date: 01/03/2024 Time: 9:00
            r'Subject\s*Code[:\s]+(\w+)[^\n]*Subject[:\s]+([^\n]+)Date[:\s]+(\d{2}/\d{2}/\d{4})[^\n]*Time[:\s]+(\d{1,2}:\d{2})',
            # Format: Monday, May 26, 2025 | 2:30 p.m. to 5:30 p.m. | 27451 | Data Structures and Algorithms
            r'([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})\s*\|\s*([\d:.apm\s]+to[\d:.apm\s]+)\s*\|\s*(\d{5})\s*\|\s*(.+)'
        ]

    # Process text line by line
    for line in extracted_text.split('\n'):
        line = line.strip()
        if not line:
            continue

        entry_found = False
        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                try:
                    if len(match.groups()) == 4:
                        if '|' in line:  # New format with day and time range
                            exam_date_str, time_range, subject_code, subject_name = match.groups()
                            subject_name = subject_name.strip()
                            
                            # Convert exam_date_str like "Monday, May 26, 2025" to YYYY-MM-DD
                            exam_date = datetime.strptime(exam_date_str, "%A, %B %d, %Y").strftime("%Y-%m-%d")
                            
                            # Extract start time from time range like "2:30 p.m. to 5:30 p.m."
                            start_time_match = re.search(r'(\d{1,2}:\d{2})\s*(a\.m\.|p\.m\.|AM|PM)', time_range, re.IGNORECASE)
                            if start_time_match:
                                time_str = f"{start_time_match.group(1)} {start_time_match.group(2)}"
                                exam_time = datetime.strptime(time_str.strip(), "%I:%M %p").strftime("%H:%M")
                            else:
                                exam_time = "00:00"  # fallback
                        else:
                            subject_code, subject_name, exam_date, exam_time = match.groups()
                            subject_name = subject_name.strip()

                    # Standardize date format
                    if '/' in exam_date:
                        exam_date = datetime.strptime(exam_date, '%d/%m/%Y').strftime('%Y-%m-%d')

                    # Standardize time format
                    if 'AM' in exam_time.upper() or 'PM' in exam_time.upper():
                        exam_time = datetime.strptime(exam_time.strip(), '%I:%M %p').strftime('%H:%M')
                    else:
                        exam_time = datetime.strptime(exam_time.strip(), '%H:%M').strftime('%H:%M')

                    entries.append({
                        'subject_code': subject_code,
                        'subject_name': subject_name,
                        'exam_date': exam_date,
                        'exam_time': exam_time,
                        'semester': semester
                    })
                    entry_found = True
                    break
                except Exception as e:
                    errors.append(f"Error processing line '{line}': {str(e)}")

        if not entry_found and any(char.isalnum() for char in line):
            errors.append(f"Could not parse line: {line}")

    if not entries:
        errors.append("No valid timetable entries found in the PDF")

    return entries, errors

def is_valid_bench_placement(arrangements, bench_number, student):
    """Check if placing a student at this bench is valid based on existing arrangements."""
    # Get existing students at this bench
    bench_students = [arr for arr in arrangements if arr['bench_number'] == bench_number]
    
    for arr in bench_students:
        # For semester exams, only one student per bench
        if arr['exam_type'] == 'semester':
            return False
        
        # For internal exams, two students can sit on one bench but with constraints
        if arr['exam_type'] == 'internal':
            # If bench already has two students, it's full
            if len(bench_students) >= 2:
                return False
                
            # Check if student is from the same class (same department AND same year)
            if arr['department'] == student.department and arr['year'] == student.year_of_study:
                return False
    
    return True

def generate_seating_arrangement(exam_id):
    """Generate a seating arrangement for an exam"""
    try:
        exam = Exam.objects.get(id=exam_id)
        room = exam.room
        students = Student.objects.all().order_by('roll_number')  # Order students by roll number
        
        # Clear existing arrangements for this exam
        SeatingArrangement.objects.filter(exam=exam).delete()
        
        # Prepare benches
        total_benches = room.num_benches
        
        # For internal exams, we can fit 2 students per bench
        # For semester exams, only 1 student per bench
        students_per_bench = 2 if exam.exam_type == 'internal' else 1
        
        # Validate if room has enough capacity
        if len(students) > total_benches * students_per_bench:
            return {"error": f"Not enough benches for all students. Need at least {len(students) // students_per_bench + (1 if len(students) % students_per_bench else 0)} benches."}
        
        # Separate students by department
        from collections import defaultdict
        department_groups = defaultdict(list)
        for student in students:
            department_groups[student.department].append(student)
        
        # Interleave students from different departments
        interleaved_students = []
        while any(department_groups.values()):
            for department in list(department_groups.keys()):
                if department_groups[department]:
                    interleaved_students.append(department_groups[department].pop(0))
                if not department_groups[department]:
                    del department_groups[department]
        
        # Track arrangements for constraint checking
        arrangements = []
        
        # Keep track of available benches
        available_benches = list(range(1, total_benches + 1))
        
        # For semester exams (one student per bench)
        if exam.exam_type == 'semester':
            for i, student in enumerate(interleaved_students):
                if i >= len(available_benches):
                    return {"error": "Not enough benches for all students"}
                
                bench_number = available_benches[i]
                
                # Create arrangement
                SeatingArrangement.objects.create(
                    exam=exam,
                    student=student,
                    bench_number=bench_number,
                    position='single'
                )
                
                # Track for constraint checking
                arrangements.append({
                    'bench_number': bench_number,
                    'department': student.department,
                    'year': student.year_of_study,
                    'exam_type': exam.exam_type
                })
        
        # For internal exams (two students per bench, not from same class)
        else:
            bench_usage = {bench: 0 for bench in available_benches}
            
            for student in interleaved_students:
                placed = False
                
                # Try to find a valid bench
                for bench in available_benches:
                    if bench_usage[bench] < 2:  # Max 2 students per bench
                        # Check if placement is valid
                        if bench_usage[bench] == 0 or is_valid_bench_placement(arrangements, bench, student):
                            # Determine position (left or right)
                            position = 'left' if bench_usage[bench] == 0 else 'right'
                            
                            # Create arrangement
                            SeatingArrangement.objects.create(
                                exam=exam,
                                student=student,
                                bench_number=bench,
                                position=position
                            )
                            
                            # Update bench usage
                            bench_usage[bench] += 1
                            
                            # Track for constraint checking
                            arrangements.append({
                                'bench_number': bench,
                                'department': student.department,
                                'year': student.year_of_study,
                                'exam_type': exam.exam_type,
                                'position': position
                            })
                            
                            placed = True
                            break
                
                if not placed:
                    return {"error": "Could not place all students due to constraints. Try adding more benches."}
        
        return {"success": f"Seating arrangement created for {len(arrangements)} students"}
    
    except Exam.DoesNotExist:
        return {"error": "Exam not found"}
    except Room.DoesNotExist:
        return {"error": "Room not found"}
    except Exception as e:
        return {"error": str(e)}