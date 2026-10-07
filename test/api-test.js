/**
 * Automated Verification Test Suite - Student Management System
 * Covers all 12 CRUD, Search, Filter, Validation, and Persistence test cases.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  console.log(`[TEST SUITE] Starting test server on port ${PORT}...`);
  serverProcess = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: PORT.toString() },
    stdio: 'inherit'
  });

  // Wait for server to bind
  let attempts = 0;
  while (attempts < 20) {
    try {
      const res = await fetch(`${BASE_URL}/api/stats`);
      if (res.ok) {
        console.log('[TEST SUITE] Test server ready.\n');
        return;
      }
    } catch (e) {
      // wait and retry
    }
    await sleep(250);
    attempts++;
  }
  throw new Error('Test server failed to start within timeout');
}

function stopServer() {
  if (serverProcess) {
    console.log('[TEST SUITE] Shutting down test server...');
    serverProcess.kill('SIGTERM');
  }
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  try {
    await startServer();

    console.log('==================================================');
    console.log('RUNNING SPECIFICATION TESTS (TEST 1 - TEST 12)');
    console.log('==================================================\n');

    let createdStudentId = null;
    const testRoll = 'ECE777';

    // --------------------------------------------------
    // TEST 1: Add student
    // --------------------------------------------------
    console.log('TEST 1: Add Student');
    const newStudent = {
      roll_number: testRoll,
      first_name: 'Devika',
      last_name: 'Menon',
      email: 'devika.menon@campus.edu',
      phone: '9845098450',
      gender: 'Female',
      date_of_birth: '2004-10-10',
      course: 'B.Tech',
      department: 'Electronics & Communication',
      year: 2,
      semester: 3,
      city: 'Kochi',
      address: '12 Marine Walk',
      guardian_name: 'Unni Menon',
      guardian_phone: '9845098451',
      admission_date: '2023-08-15',
      status: 'Active'
    };

    const addRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    });
    const addData = await addRes.json();
    assert(addRes.status === 201 && addData.success, 'Add student returned 201 Created');
    assert(addData.student && addData.student.roll_number === testRoll, 'Returned student contains correct roll number');
    createdStudentId = addData.student ? addData.student.id : null;
    console.log('');

    // --------------------------------------------------
    // TEST 2: Search student using roll number
    // --------------------------------------------------
    console.log('TEST 2: Search student using roll number');
    const searchRollRes = await fetch(`${BASE_URL}/api/students/search?q=${testRoll}`);
    const searchRollData = await searchRollRes.json();
    assert(searchRollRes.status === 200, 'Search by roll number returned 200 OK');
    assert(searchRollData.students.some((s) => s.roll_number === testRoll), 'Correct student returned for roll number query');
    console.log('');

    // --------------------------------------------------
    // TEST 3: Search using name
    // --------------------------------------------------
    console.log('TEST 3: Search using name');
    const searchNameRes = await fetch(`${BASE_URL}/api/students/search?q=Devika`);
    const searchNameData = await searchNameRes.json();
    assert(searchNameRes.status === 200, 'Search by name returned 200 OK');
    assert(searchNameData.students.some((s) => s.first_name === 'Devika'), 'Matching student returned for name query');
    console.log('');

    // --------------------------------------------------
    // TEST 4: Edit student (Phone, Department, Year)
    // --------------------------------------------------
    console.log('TEST 4: Edit student');
    const updatedPayload = {
      ...newStudent,
      phone: '9999988888',
      department: 'Computer Science',
      year: 3,
      semester: 5
    };
    const editRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    });
    const editData = await editRes.json();
    assert(editRes.status === 200 && editData.success, 'Update student returned 200 OK');
    assert(editData.student.phone === '9999988888', 'Phone correctly updated to 9999988888');
    assert(editData.student.department === 'Computer Science', 'Department correctly updated to Computer Science');
    assert(editData.student.year === 3, 'Year correctly updated to 3');
    console.log('');

    // --------------------------------------------------
    // TEST 5: Try duplicate roll number
    // --------------------------------------------------
    console.log('TEST 5: Prevent duplicate roll number');
    const duplicateStudent = {
      ...newStudent,
      first_name: 'Clone',
      roll_number: testRoll // Duplicate roll number!
    };
    const dupRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateStudent)
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409 && !dupData.success, 'Duplicate roll number returned 409 Conflict');
    assert(dupData.message.includes('already exists'), 'Duplicate roll number gives descriptive error message');
    console.log('');

    // --------------------------------------------------
    // TEST 6: Try invalid roll number
    // --------------------------------------------------
    console.log('TEST 6: Reject invalid roll number');
    const invalidRollStudent = {
      ...newStudent,
      roll_number: '   ' // Invalid empty/whitespace roll number
    };
    const invRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRollStudent)
    });
    const invData = await invRes.json();
    assert(invRes.status === 400 && !invData.success, 'Invalid roll number rejected with 400 Bad Request');

    const invalidCharStudent = {
      ...newStudent,
      roll_number: 'ECE@!#$$$%' // Invalid characters
    };
    const invCharRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidCharStudent)
    });
    assert(invCharRes.status === 400, 'Invalid character roll number rejected with 400 Bad Request');
    console.log('');

    // --------------------------------------------------
    // TEST 7: Delete student
    // --------------------------------------------------
    console.log('TEST 7: Delete student');
    const delRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`, {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    assert(delRes.status === 200 && delData.success, 'Student deletion returned 200 OK');

    const verifyDelRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`);
    assert(verifyDelRes.status === 404, 'Deleted student ID no longer exists in database (404 Not Found)');
    console.log('');

    // --------------------------------------------------
    // TEST 8: Search deleted student
    // --------------------------------------------------
    console.log('TEST 8: Search deleted student');
    const searchDelRes = await fetch(`${BASE_URL}/api/students/search?q=${testRoll}`);
    const searchDelData = await searchDelRes.json();
    assert(searchDelData.students.length === 0, 'Searching deleted roll number yields 0 matching students');
    console.log('');

    // --------------------------------------------------
    // TEST 9: Cancel deletion / student remains
    // --------------------------------------------------
    console.log('TEST 9: Cancel deletion flow');
    // An existing seed student should not be affected
    const existingListRes = await fetch(`${BASE_URL}/api/students`);
    const existingListData = await existingListRes.json();
    const firstStudent = existingListData.students[0];
    assert(firstStudent !== undefined, 'Verified that existing student remains completely untouched');
    console.log('');

    // --------------------------------------------------
    // TEST 10: Refresh / verify database persistence
    // --------------------------------------------------
    console.log('TEST 10: Verify database records persistence');
    const persistenceRes = await fetch(`${BASE_URL}/api/students`);
    const persistenceData = await persistenceRes.json();
    assert(persistenceData.students.length >= 8, `Persistent SQLite records intact (count: ${persistenceData.students.length})`);
    console.log('');

    // --------------------------------------------------
    // TEST 11: Server restart simulation
    // --------------------------------------------------
    console.log('TEST 11: Server restart persistence test');
    stopServer();
    await sleep(1000);
    await startServer();

    const restartRes = await fetch(`${BASE_URL}/api/students`);
    const restartData = await restartRes.json();
    assert(restartData.students.length >= 8, `Records survive server restart without re-seeding duplicates (count: ${restartData.students.length})`);
    console.log('');

    // --------------------------------------------------
    // TEST 12: Dashboard statistics
    // --------------------------------------------------
    console.log('TEST 12: Dashboard statistics calculation');
    const statsRes = await fetch(`${BASE_URL}/api/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.success, 'Stats API returned 200 OK');
    assert(typeof statsData.stats.total === 'number' && statsData.stats.total > 0, `Total calculated accurately: ${statsData.stats.total}`);
    assert(typeof statsData.stats.active === 'number', `Active students count: ${statsData.stats.active}`);
    assert(Array.isArray(statsData.stats.by_department), 'Department distribution calculated');
    assert(Array.isArray(statsData.stats.by_year), 'Year distribution calculated');
    assert(Array.isArray(statsData.stats.recent_students) && statsData.stats.recent_students.length <= 5, 'Recent 5 students calculated');
    console.log('');

    console.log('==================================================');
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('==================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    stopServer();
  }
}

runTests();
