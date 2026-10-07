const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, run, get, all } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Standard departments list
const DEPARTMENTS = [
  'Electronics & Communication',
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Validation helpers
const ROLL_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

function validateStudentInput(data, isUpdate = false) {
  const errors = [];

  // Roll Number
  if (!data.roll_number || typeof data.roll_number !== 'string' || !data.roll_number.trim()) {
    errors.push('Roll number is required.');
  } else {
    const trimmedRoll = data.roll_number.trim();
    if (!ROLL_REGEX.test(trimmedRoll)) {
      errors.push('Invalid roll number format. Roll number must be 3-20 alphanumeric characters (hyphens and underscores allowed).');
    }
  }

  // First Name
  if (!data.first_name || typeof data.first_name !== 'string' || !data.first_name.trim()) {
    errors.push('First name is required.');
  }

  // Last Name
  if (!data.last_name || typeof data.last_name !== 'string' || !data.last_name.trim()) {
    errors.push('Last name is required.');
  }

  // Email
  if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push('Invalid email address format.');
  }

  // Phone
  if (!data.phone || typeof data.phone !== 'string' || !data.phone.trim()) {
    errors.push('Phone number is required.');
  } else if (!PHONE_REGEX.test(data.phone.trim())) {
    errors.push('Invalid phone number format.');
  }

  // Course
  if (!data.course || typeof data.course !== 'string' || !data.course.trim()) {
    errors.push('Course is required.');
  }

  // Department
  if (!data.department || typeof data.department !== 'string' || !data.department.trim()) {
    errors.push('Department is required.');
  }

  // Year
  const year = parseInt(data.year, 10);
  if (isNaN(year) || year < 1 || year > 6) {
    errors.push('Year must be a valid number between 1 and 6.');
  }

  // Semester
  const semester = parseInt(data.semester, 10);
  if (isNaN(semester) || semester < 1 || semester > 12) {
    errors.push('Semester must be a valid number between 1 and 12.');
  }

  return errors;
}

// ==========================================
// API ROUTES
// ==========================================

// 1. GET /api/departments
app.get('/api/departments', (req, res) => {
  res.json({
    success: true,
    departments: DEPARTMENTS
  });
});

// 2. GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalRow = await get('SELECT COUNT(*) as total FROM students');
    const activeRow = await get("SELECT COUNT(*) as active FROM students WHERE status = 'Active'");
    const inactiveRow = await get("SELECT COUNT(*) as inactive FROM students WHERE status = 'Inactive'");
    const graduatedRow = await get("SELECT COUNT(*) as graduated FROM students WHERE status = 'Graduated'");
    const suspendedRow = await get("SELECT COUNT(*) as suspended FROM students WHERE status = 'Suspended'");

    // New admissions: Year 1 students or admissions within current/recent academic cycle
    const currentYearStr = new Date().getFullYear().toString();
    const newAdmissionsRow = await get(
      `SELECT COUNT(*) as new_admissions FROM students 
       WHERE year = 1 OR admission_date LIKE ? OR strftime('%Y', admission_date) = ?`,
      [`%${currentYearStr}%`, currentYearStr]
    );

    // Distribution by department
    const deptRows = await all(`
      SELECT department, COUNT(*) as count 
      FROM students 
      GROUP BY department 
      ORDER BY count DESC
    `);

    // Distribution by year
    const yearRows = await all(`
      SELECT year, COUNT(*) as count 
      FROM students 
      GROUP BY year 
      ORDER BY year ASC
    `);

    // Distribution by status
    const statusRows = await all(`
      SELECT status, COUNT(*) as count 
      FROM students 
      GROUP BY status 
      ORDER BY count DESC
    `);

    // Recent 5 students
    const recentStudents = await all(`
      SELECT id, roll_number, first_name, last_name, department, year, status, created_at
      FROM students
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        total: totalRow ? totalRow.total : 0,
        active: activeRow ? activeRow.active : 0,
        inactive: inactiveRow ? inactiveRow.inactive : 0,
        graduated: graduatedRow ? graduatedRow.graduated : 0,
        suspended: suspendedRow ? suspendedRow.suspended : 0,
        new_admissions: newAdmissionsRow ? newAdmissionsRow.new_admissions : 0,
        by_department: deptRows || [],
        by_year: yearRows || [],
        by_status: statusRows || [],
        recent_students: recentStudents || []
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate dashboard statistics' });
  }
});

// 3. GET /api/students/search?q=
app.get('/api/students/search', async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q) {
      const students = await all('SELECT * FROM students ORDER BY created_at DESC');
      return res.json({ success: true, students, count: students.length });
    }

    const pattern = `%${q}%`;
    const sql = `
      SELECT * FROM students 
      WHERE roll_number LIKE ?
         OR first_name LIKE ?
         OR last_name LIKE ?
         OR (first_name || ' ' || last_name) LIKE ?
         OR email LIKE ?
         OR department LIKE ?
      ORDER BY created_at DESC
    `;
    const students = await all(sql, [pattern, pattern, pattern, pattern, pattern, pattern]);
    res.json({ success: true, students, count: students.length });
  } catch (err) {
    console.error('Error searching students:', err);
    res.status(500).json({ success: false, message: 'Failed to search students' });
  }
});

// 4. GET /api/students (with multi-criteria filter & search)
app.get('/api/students', async (req, res) => {
  try {
    const { q, department, year, status, sort } = req.query;
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    // Search query
    if (q && q.trim()) {
      const pattern = `%${q.trim()}%`;
      sql += ` AND (
        roll_number LIKE ?
        OR first_name LIKE ?
        OR last_name LIKE ?
        OR (first_name || ' ' || last_name) LIKE ?
        OR email LIKE ?
        OR department LIKE ?
      )`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }

    // Department filter
    if (department && department.trim() && department !== 'All' && department !== 'All Departments') {
      sql += ' AND department = ?';
      params.push(department.trim());
    }

    // Year filter
    if (year && year.trim() && year !== 'All' && year !== 'All Years') {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        sql += ' AND year = ?';
        params.push(yearNum);
      }
    }

    // Status filter
    if (status && status.trim() && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status.trim());
    }

    // Sort order
    if (sort === 'name_asc') {
      sql += ' ORDER BY first_name ASC, last_name ASC';
    } else if (sort === 'roll_asc') {
      sql += ' ORDER BY roll_number ASC';
    } else if (sort === 'year_asc') {
      sql += ' ORDER BY year ASC';
    } else {
      sql += ' ORDER BY created_at DESC, id DESC';
    }

    const students = await all(sql, params);
    res.json({
      success: true,
      students,
      count: students.length
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch student records' });
  }
});

// 5. GET /api/students/:id
app.get('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const student = await get('SELECT * FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error('Error retrieving student:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving student' });
  }
});

// 6. POST /api/students
app.post('/api/students', async (req, res) => {
  try {
    const data = req.body || {};
    const validationErrors = validateStudentInput(data, false);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0],
        errors: validationErrors
      });
    }

    const roll_number = data.roll_number.trim();

    // Check duplicate roll number
    const existing = await get('SELECT id FROM students WHERE LOWER(roll_number) = LOWER(?)', [roll_number]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This roll number already exists.'
      });
    }

    const insertSql = `
      INSERT INTO students (
        roll_number, first_name, last_name, email, phone, gender, date_of_birth,
        course, department, year, semester, address, city, guardian_name,
        guardian_phone, admission_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = await run(insertSql, [
      roll_number,
      data.first_name.trim(),
      data.last_name.trim(),
      data.email.trim(),
      data.phone.trim(),
      data.gender ? data.gender.trim() : 'Other',
      data.date_of_birth ? data.date_of_birth.trim() : null,
      data.course.trim(),
      data.department.trim(),
      parseInt(data.year, 10),
      parseInt(data.semester, 10),
      data.address ? data.address.trim() : null,
      data.city ? data.city.trim() : null,
      data.guardian_name ? data.guardian_name.trim() : null,
      data.guardian_phone ? data.guardian_phone.trim() : null,
      data.admission_date ? data.admission_date.trim() : new Date().toISOString().split('T')[0],
      data.status && data.status.trim() ? data.status.trim() : 'Active'
    ]);

    const createdStudent = await get('SELECT * FROM students WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Student added successfully.',
      student: createdStudent
    });
  } catch (err) {
    console.error('Error creating student:', err);
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        message: 'This roll number already exists.'
      });
    }
    res.status(500).json({ success: false, message: 'Server error while adding student.' });
  }
});

// 7. PUT /api/students/:id
app.put('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const existingStudent = await get('SELECT id FROM students WHERE id = ?', [id]);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const data = req.body || {};
    const validationErrors = validateStudentInput(data, true);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0],
        errors: validationErrors
      });
    }

    const roll_number = data.roll_number.trim();

    // Check duplicate roll number for other students
    const duplicate = await get(
      'SELECT id FROM students WHERE LOWER(roll_number) = LOWER(?) AND id != ?',
      [roll_number, id]
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'This roll number already exists.'
      });
    }

    const updateSql = `
      UPDATE students SET
        roll_number = ?,
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        gender = ?,
        date_of_birth = ?,
        course = ?,
        department = ?,
        year = ?,
        semester = ?,
        address = ?,
        city = ?,
        guardian_name = ?,
        guardian_phone = ?,
        admission_date = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await run(updateSql, [
      roll_number,
      data.first_name.trim(),
      data.last_name.trim(),
      data.email.trim(),
      data.phone.trim(),
      data.gender ? data.gender.trim() : 'Other',
      data.date_of_birth ? data.date_of_birth.trim() : null,
      data.course.trim(),
      data.department.trim(),
      parseInt(data.year, 10),
      parseInt(data.semester, 10),
      data.address ? data.address.trim() : null,
      data.city ? data.city.trim() : null,
      data.guardian_name ? data.guardian_name.trim() : null,
      data.guardian_phone ? data.guardian_phone.trim() : null,
      data.admission_date ? data.admission_date.trim() : null,
      data.status && data.status.trim() ? data.status.trim() : 'Active',
      id
    ]);

    const updatedStudent = await get('SELECT * FROM students WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Student updated successfully.',
      student: updatedStudent
    });
  } catch (err) {
    console.error('Error updating student:', err);
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        message: 'This roll number already exists.'
      });
    }
    res.status(500).json({ success: false, message: 'Server error while updating student.' });
  }
});

// 8. DELETE /api/students/:id
app.delete('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const student = await get('SELECT id, first_name, last_name, roll_number FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await run('DELETE FROM students WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Student deleted successfully.',
      deletedStudent: student
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting student.' });
  }
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🎓 Student Management System running at http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();
