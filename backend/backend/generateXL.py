""" import pandas as pd
import random
import os

# Sample first and last names
first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Atharv"]
last_names = ["Sharma", "Verma", "Patel", "Reddy", "Kumar", "Singh", "Mehta", "Joshi", "Gupta", "Nair"]

# Departments and subject codes
departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']
subject_codes = ['CS101', 'EC202', 'EE303', 'ME404', 'CE505', 'IT606']

# Generate student data
students = []

for i in range(1, 121):  # 120 entries
    roll_number = f"R{i:04d}"
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    department = random.choice(departments)
    year_of_study = random.randint(1, 4)
    semester = year_of_study * 2 if random.random() > 0.5 else year_of_study * 2 - 1
    subject_code = random.choice(subject_codes)
    seat_number = f"S{random.randint(100, 999)}"
    
    students.append({
        "roll_number": roll_number,
        "name": name,
        "department": department,
        "year_of_study": year_of_study,
        "semester": semester,
        "subject_code": subject_code,
        "seat_number": seat_number
    })

# Convert to DataFrame
df = pd.DataFrame(students)

# Save to Downloads folder
downloads_folder = os.path.join(os.path.expanduser("~"), "Downloads")
output_file = os.path.join(downloads_folder, "student_data.xlsx")

df.to_excel(output_file, index=False)

print(f"\n✅ Excel file 'student_data.xlsx' has been saved to:\n{output_file}\n")
"""