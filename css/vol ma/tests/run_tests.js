/**
 * Automated Verification Suite for Volunteer Management System
 * Run: node tests/run_tests.js
 */

import { Person } from '../js/models/Person.js';
import { Volunteer } from '../js/models/Volunteer.js';
import { Coordinator } from '../js/models/Coordinator.js';
import { Activity } from '../js/models/Activity.js';
import { Task } from '../js/models/Task.js';
import { Assignment } from '../js/models/Assignment.js';
import { volunteerService } from '../js/services/VolunteerService.js';
import { activityService } from '../js/services/ActivityService.js';
import { assignmentService } from '../js/services/AssignmentService.js';
import { isValidEmail, isValidPhone, isPositiveNumber } from '../js/utils/validators.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.error(`  ✗ FAIL (Expected error but none was thrown): ${message}`);
    failed++;
  } catch (err) {
    console.log(`  ✓ PASS (Caught expected error "${err.message}"): ${message}`);
    passed++;
  }
}

console.log('====================================================');
console.log('TEST SUITE: Volunteer Management System (College OOP)');
console.log('====================================================\n');

// 1. OOP Models & Encapsulation Tests
console.log('1. Testing Domain Models (Encapsulation, Inheritance, Polymorphism)...');

const v1 = new Volunteer({
  id: 'vol_test_1',
  name: 'Aadhi Lakshmi S',
  email: 'aadhi@test.com',
  phone: '9876543210',
  skills: ['Registration', 'Event Management'],
  availability: ['Weekdays', 'Morning (09:00 - 12:00)'],
  status: 'Active'
});

assert(v1 instanceof Person, 'Volunteer is an instance of base class Person (Inheritance)');
assert(v1.name === 'Aadhi Lakshmi S', 'Encapsulated name getter works correctly');
assert(v1.hasSkill('Registration'), 'Volunteer.hasSkill() correctly detects registered skill');
assert(!v1.hasSkill('Robotics'), 'Volunteer.hasSkill() correctly reports missing skill');

const c1 = new Coordinator({
  id: 'coord_1',
  name: 'Dr. Ramesh Kumar',
  email: 'ramesh@college.edu',
  phone: '9876543211',
  department: 'Computer Science'
});

assert(
  v1.getRoleDescription().includes('Student Volunteer'),
  'Polymorphism: Volunteer overrides getRoleDescription()'
);
assert(
  c1.getRoleDescription().includes('Event Coordinator'),
  'Polymorphism: Coordinator overrides getRoleDescription()'
);

assertThrows(() => {
  new Volunteer({ name: '', email: 'valid@test.com', phone: '9876543210' });
}, 'Rejects empty name');

assertThrows(() => {
  new Volunteer({ name: 'Valid Name', email: 'invalid-email-address', phone: '9876543210' });
}, 'Rejects invalid email format');

assertThrows(() => {
  new Volunteer({ name: 'Valid Name', email: 'valid@test.com', phone: '123' });
}, 'Rejects non-10-digit phone number');

// 2. Activity & Task Creation
console.log('\n2. Testing Activities & Tasks Models...');
const act1 = new Activity({
  title: 'Annual Symposium 2026',
  date: '2026-11-20',
  venue: 'Main Auditorium',
  category: 'College Event',
  requiredVolunteers: 10
});
assert(act1.title === 'Annual Symposium 2026', 'Activity created successfully');

const t1 = new Task({
  activityId: act1.id,
  title: 'Stage AV Operation',
  requiredSkill: 'Stage Setup',
  slots: 2,
  timeSlot: 'Morning (09:00 - 12:00)'
});
assert(t1.slots === 2, 'Task slots configured properly');

// 3. Validation Helpers
console.log('\n3. Testing Utility Validators...');
assert(isValidEmail('student@college.edu'), 'isValidEmail passes valid email');
assert(!isValidEmail('bademail'), 'isValidEmail rejects bad email');
assert(isValidPhone('9876543210'), 'isValidPhone passes 10-digit phone');
assert(!isValidPhone('98765'), 'isValidPhone rejects short phone');
assert(isPositiveNumber(5), 'isPositiveNumber validates positive integers');
assert(!isPositiveNumber(-2), 'isPositiveNumber rejects negative numbers');

// 4. Services & Conflict Prevention (AssignmentService)
console.log('\n4. Testing Assignment Engine & Conflict Prevention...');

volunteerService.resetToDefault();
activityService.resetToDefault();
assignmentService.resetToDefault();

const allVols = volunteerService.getAll();
const allTasks = activityService.getAllTasks();
assert(allVols.length >= 8, `Seed volunteers loaded successfully (${allVols.length} loaded)`);
assert(allTasks.length >= 4, `Seed tasks loaded successfully (${allTasks.length} loaded)`);

const sooraj = allVols.find(v => v.name.includes('Sooraj'));
const techTask = allTasks.find(t => t.id === 'tsk_301');

assertThrows(() => {
  assignmentService.createAssignment({
    volunteerId: sooraj.id,
    taskId: techTask.id
  });
}, 'Conflict Guard: Prevents duplicate assignment of same volunteer to same task');

const testAct = activityService.createActivity({
  title: 'Concurrent Fest Event',
  date: '2026-11-15',
  venue: 'Lab 3',
  category: 'College Event'
});

const conflictingTask = activityService.createTask({
  activityId: testAct.id,
  title: 'Parallel Morning Task',
  requiredSkill: 'Stage Setup',
  slots: 2,
  timeSlot: 'Morning (09:00 - 12:00)'
});

assertThrows(() => {
  assignmentService.createAssignment({
    volunteerId: sooraj.id,
    taskId: conflictingTask.id
  });
}, 'Conflict Guard: Prevents double-booking volunteer in same time slot on same date');

const smallTask = activityService.createTask({
  activityId: testAct.id,
  title: 'Single Volunteer Task',
  requiredSkill: 'Hospitality',
  slots: 1,
  timeSlot: 'Evening (16:00 - 19:00)'
});

const volA = allVols.find(v => v.name.includes('Devika'));
const volB = allVols.find(v => v.name.includes('Meera'));

assignmentService.createAssignment({ volunteerId: volA.id, taskId: smallTask.id });
assert(true, 'Successfully assigned first volunteer into 1-slot task');

assertThrows(() => {
  assignmentService.createAssignment({ volunteerId: volB.id, taskId: smallTask.id });
}, 'Conflict Guard: Prevents exceeding task capacity (slots full)');

// 5. Smart Volunteer Suggestion Algorithm
console.log('\n5. Testing Recommendation Engine ("Suggest Volunteers")...');
const suggestions = assignmentService.suggestVolunteersForTask(conflictingTask.id);
assert(suggestions.length > 0, `Returned ${suggestions.length} ranked candidate suggestions`);
assert(suggestions[0].score >= suggestions[suggestions.length - 1].score, 'Candidates are ranked in descending order by score');
console.log(`  Top match for "${conflictingTask.title}": ${suggestions[0].volunteer.name} (Score: ${suggestions[0].score} pts)`);

// 6. Search & Filter Testing
console.log('\n6. Testing Volunteers Search & Filtering...');
const searched = volunteerService.searchAndFilter({ search: 'Aadhi' });
assert(searched.length === 1 && searched[0].name.includes('Aadhi'), 'Search by name returns exact match');

const techFiltered = volunteerService.searchAndFilter({ skill: 'Tech Support' });
assert(techFiltered.length > 0 && techFiltered.every(v => v.hasSkill('Tech Support')), 'Filter by skill returns only qualified volunteers');

const activeFiltered = volunteerService.searchAndFilter({ status: 'Active' });
assert(activeFiltered.every(v => v.status === 'Active'), 'Filter by status returns only active volunteers');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
