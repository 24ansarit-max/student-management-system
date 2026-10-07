const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'students.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database: students.db');
  }
});

// Wrap db methods with Promises for async/await support
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Initialize tables and seed initial sample data if empty
async function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll_number TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      gender TEXT,
      date_of_birth TEXT,
      course TEXT NOT NULL,
      department TEXT NOT NULL,
      year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      address TEXT,
      city TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      admission_date TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await run(createTableQuery);

  // Check if students table is empty
  const countRow = await get('SELECT COUNT(*) as count FROM students');
  if (countRow && countRow.count === 0) {
    console.log('Database empty. Seeding realistic sample students...');
    const sampleStudents = [
      {
        roll_number: 'ECE001',
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul.sharma@campus.edu',
        phone: '9876543210',
        gender: 'Male',
        date_of_birth: '2004-05-14',
        course: 'B.Tech',
        department: 'Electronics & Communication',
        year: 2,
        semester: 4,
        address: '42 Sector 15',
        city: 'Chandigarh',
        guardian_name: 'Vikram Sharma',
        guardian_phone: '9876500001',
        admission_date: '2023-08-10',
        status: 'Active'
      },
      {
        roll_number: 'CSE002',
        first_name: 'Aarav',
        last_name: 'Patil',
        email: 'aarav.patil@campus.edu',
        phone: '9823456789',
        gender: 'Male',
        date_of_birth: '2005-09-22',
        course: 'B.Tech',
        department: 'Computer Science',
        year: 1,
        semester: 2,
        address: '108 Shivaji Park',
        city: 'Mumbai',
        guardian_name: 'Suresh Patil',
        guardian_phone: '9823400002',
        admission_date: '2024-07-20',
        status: 'Active'
      },
      {
        roll_number: 'ECE003',
        first_name: 'Priya',
        last_name: 'Deshmukh',
        email: 'priya.deshmukh@campus.edu',
        phone: '9765432109',
        gender: 'Female',
        date_of_birth: '2003-12-08',
        course: 'B.Tech',
        department: 'Electronics & Communication',
        year: 3,
        semester: 6,
        address: '15 Gandhi Road',
        city: 'Pune',
        guardian_name: 'Ramesh Deshmukh',
        guardian_phone: '9765400003',
        admission_date: '2022-08-15',
        status: 'Active'
      },
      {
        roll_number: 'ME004',
        first_name: 'Aditya',
        last_name: 'Joshi',
        email: 'aditya.joshi@campus.edu',
        phone: '9890123456',
        gender: 'Male',
        date_of_birth: '2004-03-30',
        course: 'B.Tech',
        department: 'Mechanical Engineering',
        year: 2,
        semester: 3,
        address: '77 Tilak Nagar',
        city: 'Nagpur',
        guardian_name: 'Anand Joshi',
        guardian_phone: '9890100004',
        admission_date: '2023-08-12',
        status: 'Active'
      },
      {
        roll_number: 'IT005',
        first_name: 'Ananya',
        last_name: 'Iyer',
        email: 'ananya.iyer@campus.edu',
        phone: '9845123456',
        gender: 'Female',
        date_of_birth: '2002-11-19',
        course: 'B.Tech',
        department: 'Information Technology',
        year: 4,
        semester: 8,
        address: '24 Residency Road',
        city: 'Bengaluru',
        guardian_name: 'Krishnan Iyer',
        guardian_phone: '9845100005',
        admission_date: '2021-08-05',
        status: 'Graduated'
      },
      {
        roll_number: 'EE006',
        first_name: 'Kavita',
        last_name: 'Reddy',
        email: 'kavita.reddy@campus.edu',
        phone: '9988776655',
        gender: 'Female',
        date_of_birth: '2004-07-03',
        course: 'B.Tech',
        department: 'Electrical Engineering',
        year: 2,
        semester: 4,
        address: '89 Banjara Hills',
        city: 'Hyderabad',
        guardian_name: 'Narasimha Reddy',
        guardian_phone: '9988700006',
        admission_date: '2023-08-18',
        status: 'Inactive'
      },
      {
        roll_number: 'CE007',
        first_name: 'Rohan',
        last_name: 'Verma',
        email: 'rohan.verma@campus.edu',
        phone: '9811223344',
        gender: 'Male',
        date_of_birth: '2003-01-17',
        course: 'B.Tech',
        department: 'Civil Engineering',
        year: 3,
        semester: 5,
        address: '14 Mall Avenue',
        city: 'Lucknow',
        guardian_name: 'Sunil Verma',
        guardian_phone: '9811200007',
        admission_date: '2022-08-22',
        status: 'Suspended'
      },
      {
        roll_number: 'CSE008',
        first_name: 'Sneha',
        last_name: 'Nair',
        email: 'sneha.nair@campus.edu',
        phone: '9744556677',
        gender: 'Female',
        date_of_birth: '2005-04-11',
        course: 'B.Tech',
        department: 'Computer Science',
        year: 1,
        semester: 1,
        address: '56 Marine Drive',
        city: 'Kochi',
        guardian_name: 'Mohan Nair',
        guardian_phone: '9744500008',
        admission_date: '2024-08-01',
        status: 'Active'
      }
    ];

    const insertSql = `
      INSERT INTO students (
        roll_number, first_name, last_name, email, phone, gender, date_of_birth,
        course, department, year, semester, address, city, guardian_name,
        guardian_phone, admission_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    for (const s of sampleStudents) {
      await run(insertSql, [
        s.roll_number,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.gender,
        s.date_of_birth,
        s.course,
        s.department,
        s.year,
        s.semester,
        s.address,
        s.city,
        s.guardian_name,
        s.guardian_phone,
        s.admission_date,
        s.status
      ]);
    }
    console.log('Sample data seeded successfully.');
  }
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase
};
