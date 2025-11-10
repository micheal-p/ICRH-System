from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import jwt
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SIGNATURES_FOLDER'] = 'signatures'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

os.makedirs('data', exist_ok=True)
os.makedirs('uploads', exist_ok=True)
os.makedirs('signatures', exist_ok=True)

STUDENTS_FILE = 'data/students.json'
CONFIG_FILE = 'data/config.json'
TOKENS_FILE = 'data/tokens.json'
LOGS_FILE = 'data/logs.json'

def init_data_files():
    if not os.path.exists(STUDENTS_FILE):
        with open(STUDENTS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'w') as f:
            json.dump({
                "active_semester": "first",
                "registration_deadline": "2025-12-31",
                "max_units": {"100": 24, "200": 24, "300": 24, "400": 24, "500": 24},
                "admins": [],
                "signatures": {}
            }, f, indent=2)
    
    if not os.path.exists(TOKENS_FILE):
        with open(TOKENS_FILE, 'w') as f:
            json.dump({"carryover": [], "late_registration": []}, f)
    
    if not os.path.exists(LOGS_FILE):
        with open(LOGS_FILE, 'w') as f:
            json.dump([], f)

init_data_files()

def read_json(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return [] if 'logs' in filepath or 'students' in filepath else {}

def write_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

def add_log(action, user, details=""):
    logs = read_json(LOGS_FILE)
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "user": user,
        "details": details
    })
    write_json(LOGS_FILE, logs)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        token = auth[7:] if auth.startswith('Bearer ') else auth
        
        if not token:
            return jsonify({'message': 'Token missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            return f(data['matric_number'], data.get('is_admin', False), *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        token = auth[7:] if auth.startswith('Bearer ') else auth
        
        if not token:
            return jsonify({'message': 'Token missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            if not data.get('is_admin'):
                return jsonify({'message': 'Admin only'}), 403
            return f(data['matric_number'], *args, **kwargs)
        except:
            return jsonify({'message': 'Invalid token'}), 401
    
    return decorated

@app.route('/api/register', methods=['POST'])
def register():
    data = request.form
    photo = request.files.get('photo')
    
    required = ['full_name', 'matric_number', 'department', 'level', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'message': f'{field} required'}), 400
    
    students = read_json(STUDENTS_FILE)
    
    if any(s['matric_number'] == data['matric_number'] for s in students):
        return jsonify({'message': 'Matric number exists'}), 400
    
    photo_path = None
    if photo:
        filename = secure_filename(f"{data['matric_number']}_{photo.filename}")
        photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        photo.save(photo_path)
    
    students.append({
        'full_name': data['full_name'],
        'matric_number': data['matric_number'],
        'department': data['department'],
        'level': data['level'],
        'email': data.get('email', ''),
        'phone': data.get('phone', ''),
        'password': generate_password_hash(data['password']),
        'photo': photo_path,
        'registered_courses': {'first_semester': [], 'second_semester': []},
        'registration_status': {'first_semester': 'not_started', 'second_semester': 'not_started'},
        'created_at': datetime.now().isoformat()
    })
    
    write_json(STUDENTS_FILE, students)
    add_log('register', data['matric_number'])
    
    return jsonify({'message': 'Success'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or not data.get('matric_number') or not data.get('password'):
        return jsonify({'message': 'Credentials required'}), 400
    
    # Check admin first
    config = read_json(CONFIG_FILE)
    admin = next((a for a in config.get('admins', []) if a['matric_number'] == data['matric_number']), None)
    
    if admin and check_password_hash(admin['password'], data['password']):
        token = jwt.encode({
            'matric_number': admin['matric_number'],
            'is_admin': True,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'full_name': admin['full_name'],
                'matric_number': admin['matric_number'],
                'is_admin': True
            }
        }), 200
    
    # Check student
    students = read_json(STUDENTS_FILE)
    student = next((s for s in students if s['matric_number'] == data['matric_number']), None)
    
    if not student or not check_password_hash(student['password'], data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'matric_number': student['matric_number'],
        'is_admin': False,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'full_name': student['full_name'],
            'matric_number': student['matric_number'],
            'department': student['department'],
            'level': student['level'],
            'is_admin': False
        }
    }), 200

@app.route('/api/student/profile', methods=['GET'])
@token_required
def get_profile(current_user, is_admin):
    if is_admin:
        return jsonify({'message': 'Not for admin'}), 403
    
    students = read_json(STUDENTS_FILE)
    student = next((s for s in students if s['matric_number'] == current_user), None)
    
    if not student:
        return jsonify({'message': 'Not found'}), 404
    
    student_data = {k: v for k, v in student.items() if k != 'password'}
    return jsonify(student_data)

# ============= COURSES ENDPOINT =============
@app.route('/api/courses/<department>/<level>/<semester>', methods=['GET'])
@token_required
def get_courses(current_user, is_admin, department, level, semester):
    """
    Get courses for a specific department, level, and semester
    """
    semester_name = 'first' if semester == 'first_semester' else 'second'
    filename = f"data/{department.lower()}_{semester_name}_semester.json"
    
    print(f"[COURSES] Loading: {filename} for level {level}")
    
    if not os.path.exists(filename):
        print(f"[COURSES] File not found: {filename}")
        return jsonify({'message': 'Courses not found', 'file': filename}), 404
    
    try:
        course_data = read_json(filename)
        
        # Handle nested structure: {"courses": {"100": [...], "200": [...]}}
        if 'courses' in course_data:
            all_courses = course_data['courses']
            level_courses = all_courses.get(level, [])
        else:
            level_courses = course_data
        
        print(f"[COURSES] Found {len(level_courses)} courses for level {level}")
        return jsonify(level_courses)
        
    except Exception as e:
        print(f"[COURSES] Error: {str(e)}")
        return jsonify({'message': 'Error loading courses', 'error': str(e)}), 500

# ============= FIXED: REGISTER COURSES (RESPECTS ACTIVE SEMESTER) =============
@app.route('/api/student/register-courses', methods=['POST'])
@token_required
def register_courses(current_user, is_admin):
    if is_admin:
        return jsonify({'message': 'Not allowed'}), 403
    
    data = request.json
    semester = data.get('semester')
    courses = data.get('courses', [])
    
    if semester not in ['first_semester', 'second_semester']:
        return jsonify({'message': 'Invalid semester'}), 400
    
    # ============= CHECK ACTIVE SEMESTER =============
    config = read_json(CONFIG_FILE)
    active_semester = config.get('active_semester', 'first')
    
    # Map active_semester to database format
    active_semester_key = 'first_semester' if active_semester == 'first' else 'second_semester'
    
    # Only allow registration for active semester
    if semester != active_semester_key:
        semester_name = "First" if semester == 'first_semester' else "Second"
        active_name = "First" if active_semester == 'first' else "Second"
        return jsonify({
            'message': f'Registration closed for {semester_name} Semester. Only {active_name} Semester is active.'
        }), 400
    
    students = read_json(STUDENTS_FILE)
    student_idx = next((i for i, s in enumerate(students) if s['matric_number'] == current_user), None)
    
    if student_idx is None:
        return jsonify({'message': 'Not found'}), 404
    
    student = students[student_idx]
    
    # Check if already submitted
    if student['registration_status'][semester] in ['pending', 'approved']:
        return jsonify({'message': 'Already registered'}), 400
    
    total_units = sum(c.get('units', 0) for c in courses)
    max_units = config['max_units'].get(student['level'], 24)
    
    if total_units > max_units:
        return jsonify({'message': f'Exceeded max ({max_units})'}), 400
    
    students[student_idx]['registered_courses'][semester] = courses
    students[student_idx]['registration_status'][semester] = 'pending'
    
    write_json(STUDENTS_FILE, students)
    add_log('register_courses', current_user, f"{semester}")
    
    return jsonify({'message': 'Success', 'total_units': total_units}), 200

@app.route('/api/config', methods=['GET'])
@token_required
def get_config(current_user, is_admin):
    config = read_json(CONFIG_FILE)
    return jsonify({
        'active_semester': config.get('active_semester'),
        'registration_deadline': config.get('registration_deadline'),
        'max_units': config.get('max_units')
    })

# ============= NEW: GET REGISTERED COURSES FOR COURSE FORM =============
@app.route('/api/student/registered-courses/<semester>', methods=['GET'])
@token_required
def get_registered_courses(current_user, is_admin, semester):
    """
    Get student's registered courses for course form display
    Does NOT require admin privileges - students can view their own
    """
    if semester not in ['first_semester', 'second_semester']:
        return jsonify({'message': 'Invalid semester'}), 400
    
    students = read_json(STUDENTS_FILE)
    student = next((s for s in students if s['matric_number'] == current_user), None)
    
    if not student:
        return jsonify({'message': 'Not found'}), 404
    
    # Return courses and registration status
    return jsonify({
        'courses': student['registered_courses'].get(semester, []),
        'status': student['registration_status'].get(semester, 'not_started'),
        'student': {
            'full_name': student['full_name'],
            'matric_number': student['matric_number'],
            'department': student['department'],
            'level': student['level']
        }
    }), 200

@app.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard(current_user):
    students = read_json(STUDENTS_FILE)
    
    stats = {
        'total_students': len(students),
        'pending_approvals': sum(1 for s in students 
            if s['registration_status']['first_semester'] == 'pending' 
            or s['registration_status']['second_semester'] == 'pending'),
        'by_level': {},
        'by_department': {}
    }
    
    for s in students:
        level = s.get('level', 'Unknown')
        dept = s.get('department', 'Unknown')
        stats['by_level'][level] = stats['by_level'].get(level, 0) + 1
        stats['by_department'][dept] = stats['by_department'].get(dept, 0) + 1
    
    return jsonify(stats)

@app.route('/api/admin/students', methods=['GET'])
@admin_required
def get_students(current_user):
    students = read_json(STUDENTS_FILE)
    dept = request.args.get('department')
    level = request.args.get('level')
    
    filtered = students
    if dept:
        filtered = [s for s in filtered if s.get('department') == dept]
    if level:
        filtered = [s for s in filtered if s.get('level') == level]
    
    safe = [{k: v for k, v in s.items() if k != 'password'} for s in filtered]
    return jsonify(safe)

# ============= FIXED: APPROVE ENDPOINT (URL DECODING) =============
@app.route('/api/admin/approve/<path:matric>/<semester>', methods=['POST'])
@admin_required
def approve(current_user, matric, semester):
    # Decode matric number (handles slashes like csc/2025/6612)
    from urllib.parse import unquote
    matric = unquote(matric)
    
    print(f"[APPROVE] Request: {matric}, {semester}")
    
    if semester not in ['first_semester', 'second_semester']:
        print(f"[APPROVE] Invalid semester: {semester}")
        return jsonify({'message': 'Invalid semester'}), 400
    
    students = read_json(STUDENTS_FILE)
    student_found = False
    
    for i, s in enumerate(students):
        if s['matric_number'] == matric:
            student_found = True
            print(f"[APPROVE] Found student: {s['full_name']}")
            print(f"[APPROVE] Current status: {s['registration_status'][semester]}")
            
            students[i]['registration_status'][semester] = 'approved'
            write_json(STUDENTS_FILE, students)
            add_log('approved', current_user, f"{matric} {semester}")
            
            print(f"[APPROVE] SUCCESS: Approved {matric} for {semester}")
            return jsonify({'message': 'Approved successfully'}), 200
    
    if not student_found:
        print(f"[APPROVE] Student not found: {matric}")
        return jsonify({'message': 'Student not found'}), 404
    
    return jsonify({'message': 'Unknown error'}), 500

# ============= REJECT ENDPOINT (URL DECODING) =============
@app.route('/api/admin/reject/<path:matric>/<semester>', methods=['POST'])
@admin_required
def reject(current_user, matric, semester):
    from urllib.parse import unquote
    matric = unquote(matric)
    
    if semester not in ['first_semester', 'second_semester']:
        return jsonify({'message': 'Invalid semester'}), 400
    
    students = read_json(STUDENTS_FILE)
    
    for i, s in enumerate(students):
        if s['matric_number'] == matric:
            students[i]['registration_status'][semester] = 'rejected'
            write_json(STUDENTS_FILE, students)
            add_log('rejected', current_user, f"{matric} {semester}")
            return jsonify({'message': 'Rejected'}), 200
    
    return jsonify({'message': 'Not found'}), 404

# ============= NEW: DELETE REGISTRATION ENDPOINT =============
@app.route('/api/admin/delete-registration/<path:matric>/<semester>', methods=['DELETE'])
@admin_required
def delete_registration(current_user, matric, semester):
    """
    Delete a student's course registration for a specific semester
    This allows the student to re-register from scratch
    """
    from urllib.parse import unquote
    matric = unquote(matric)
    
    print(f"[DELETE] Request: {matric}, {semester}")
    
    if semester not in ['first_semester', 'second_semester']:
        print(f"[DELETE] Invalid semester: {semester}")
        return jsonify({'message': 'Invalid semester'}), 400
    
    students = read_json(STUDENTS_FILE)
    student_found = False
    
    for i, s in enumerate(students):
        if s['matric_number'] == matric:
            student_found = True
            print(f"[DELETE] Found student: {s['full_name']}")
            print(f"[DELETE] Current courses: {len(s['registered_courses'][semester])} courses")
            print(f"[DELETE] Current status: {s['registration_status'][semester]}")
            
            # Clear the courses and reset status
            students[i]['registered_courses'][semester] = []
            students[i]['registration_status'][semester] = 'not_started'
            
            write_json(STUDENTS_FILE, students)
            add_log('delete_registration', current_user, f"{matric} {semester}")
            
            print(f"[DELETE] SUCCESS: Deleted registration for {matric} - {semester}")
            return jsonify({
                'message': 'Registration deleted successfully. Student can now re-register.',
                'matric': matric,
                'semester': semester
            }), 200
    
    if not student_found:
        print(f"[DELETE] Student not found: {matric}")
        return jsonify({'message': 'Student not found'}), 404
    
    return jsonify({'message': 'Unknown error'}), 500

@app.route('/api/admin/config', methods=['PUT'])
@admin_required
def update_config(current_user):
    data = request.json
    config = read_json(CONFIG_FILE)
    
    if 'active_semester' in data:
        config['active_semester'] = data['active_semester']
        print(f"[CONFIG] Active semester changed to: {data['active_semester']}")
    if 'max_units' in data:
        config['max_units'].update(data['max_units'])
    if 'registration_deadline' in data:
        config['registration_deadline'] = data['registration_deadline']
    
    write_json(CONFIG_FILE, config)
    add_log('config_update', current_user)
    
    return jsonify({'message': 'Updated'})

@app.route('/api/admin/generate-token', methods=['POST'])
@admin_required
def generate_token(current_user):
    data = request.json
    token_type = data.get('type')
    matric = data.get('matric_number')
    courses = data.get('courses', [])  # NEW: courses for carryover token
    
    if token_type not in ['carryover', 'late_registration']:
        return jsonify({'message': 'Invalid type'}), 400
    
    if not matric:
        return jsonify({'message': 'Matric number required'}), 400
    
    # For carryover tokens, courses are required
    if token_type == 'carryover' and not courses:
        return jsonify({'message': 'Carryover courses required'}), 400
    
    tokens = read_json(TOKENS_FILE)
    code = secrets.token_urlsafe(16)
    
    token_data = {
        'code': code,
        'matric_number': matric,
        'type': token_type,
        'courses': courses if token_type == 'carryover' else [],
        'created_by': current_user,
        'created_at': datetime.now().isoformat(),
        'used': False,
        'used_at': None
    }
    
    tokens[token_type].append(token_data)
    
    write_json(TOKENS_FILE, tokens)
    add_log('token_generated', current_user, f"{token_type} for {matric}")
    
    return jsonify({'token': code, 'courses': courses})

# ============= NEW: VALIDATE AND USE TOKEN =============
@app.route('/api/student/validate-token', methods=['POST'])
@token_required
def validate_token(current_user, is_admin):
    """
    Validate a carryover or late registration token
    Returns the courses if it's a carryover token
    """
    if is_admin:
        return jsonify({'message': 'Not for admin'}), 403
    
    data = request.json
    token_code = data.get('token')
    
    if not token_code:
        return jsonify({'message': 'Token required'}), 400
    
    tokens = read_json(TOKENS_FILE)
    
    # Search in both token types
    found_token = None
    token_list_key = None
    token_index = None
    
    for key in ['carryover', 'late_registration']:
        for idx, t in enumerate(tokens[key]):
            if t['code'] == token_code:
                found_token = t
                token_list_key = key
                token_index = idx
                break
        if found_token:
            break
    
    if not found_token:
        return jsonify({'message': 'Invalid token'}), 404
    
    # Check if token is for this student
    if found_token['matric_number'] != current_user:
        return jsonify({'message': 'Token not assigned to you'}), 403
    
    # Check if already used
    if found_token['used']:
        return jsonify({'message': 'Token already used'}), 400
    
    # Mark token as used
    tokens[token_list_key][token_index]['used'] = True
    tokens[token_list_key][token_index]['used_at'] = datetime.now().isoformat()
    write_json(TOKENS_FILE, tokens)
    
    add_log('token_used', current_user, f"{found_token['type']} token used")
    
    return jsonify({
        'message': 'Token validated successfully',
        'type': found_token['type'],
        'courses': found_token.get('courses', []),
        'token_used': True
    }), 200

@app.route('/api/admin/signatures', methods=['GET'])
@admin_required
def get_signatures(current_user):
    config = read_json(CONFIG_FILE)
    return jsonify(config.get('signatures', {}))

@app.route('/api/admin/signatures', methods=['POST'])
@admin_required
def save_signature(current_user):
    role = request.form.get('role')
    name = request.form.get('name')
    signature = request.files.get('signature')
    
    if not role or not name:
        return jsonify({'message': 'Missing data'}), 400
    
    config = read_json(CONFIG_FILE)
    if 'signatures' not in config:
        config['signatures'] = {}
    
    sig_path = None
    if signature:
        filename = secure_filename(f"{role}_{signature.filename}")
        sig_path = os.path.join(app.config['SIGNATURES_FOLDER'], filename)
        signature.save(sig_path)
    
    config['signatures'][role] = {
        'name': name,
        'signature': sig_path,
        'updated_at': datetime.now().isoformat()
    }
    
    write_json(CONFIG_FILE, config)
    add_log('signature_update', current_user)
    
    return jsonify({'message': 'Saved'}), 200

@app.route('/api/admin/signatures/<role>', methods=['DELETE'])
@admin_required
def delete_signature(current_user, role):
    config = read_json(CONFIG_FILE)
    
    if 'signatures' in config and role in config['signatures']:
        sig_path = config['signatures'][role].get('signature')
        if sig_path and os.path.exists(sig_path):
            os.remove(sig_path)
        
        del config['signatures'][role]
        write_json(CONFIG_FILE, config)
        add_log('signature_delete', current_user)
        
        return jsonify({'message': 'Deleted'})
    
    return jsonify({'message': 'Not found'}), 404

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory('uploads', filename)

@app.route('/signatures/<path:filename>')
def serve_signature(filename):
    return send_from_directory('signatures', filename)

# ============= PUBLIC ENDPOINTS (NO AUTH REQUIRED) =============
@app.route('/api/public/signatures', methods=['GET'])
def get_public_signatures():
    """
    Public endpoint to view signatures (for course form display)
    No authentication required - students need to see signatures on their forms
    """
    config = read_json(CONFIG_FILE)
    return jsonify(config.get('signatures', {}))

@app.route('/api/create-admin', methods=['POST'])
def create_admin():
    data = request.json
    
    if not all(k in data for k in ['full_name', 'matric_number', 'password']):
        return jsonify({'message': 'Missing fields'}), 400
    
    config = read_json(CONFIG_FILE)
    
    if any(a['matric_number'] == data['matric_number'] for a in config.get('admins', [])):
        return jsonify({'message': 'Admin exists'}), 400
    
    config['admins'].append({
        'full_name': data['full_name'],
        'matric_number': data['matric_number'],
        'password': generate_password_hash(data['password']),
        'created_at': datetime.now().isoformat()
    })
    
    write_json(CONFIG_FILE, config)
    
    return jsonify({'message': 'Admin created'}), 201

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎓 IGBINEDION PORTAL - READY")
    print("="*50)
    print("\nBackend: http://localhost:5000")
    print("Create admin: POST /api/create-admin")
    print("\n" + "="*50 + "\n")
    
    app.run(debug=True, port=5000)