/**
 * ============================================================================
 * Volunteer Management System - Unified Core Runtime (vms.js)
 * College Project: Group 12 (S3 CSE DS)
 * 
 * Supports both:
 * 1. Direct local file opening (file:///index.html - zero build, zero CORS issues)
 * 2. Local HTTP servers (npx serve, python -m http.server, Live Server)
 * 
 * Preserves 100% of the Java Object-Oriented Domain Model:
 * - Encapsulation with # private fields, getters, setters & validation
 * - Inheritance: Volunteer extends Person, Coordinator extends Person
 * - Polymorphism: overridden getRoleDescription() and getSummary()
 * - Abstraction: Repository pattern over localStorage
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     SECTION 1: UTILITIES
     ========================================================================== */

  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^\d{10}$/.test(cleaned);
  }

  function isNonEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isPositiveNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getStatusBadgeClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'active':
      case 'completed':
        return 'badge-active';
      case 'inactive':
      case 'cancelled':
        return 'badge-inactive';
      case 'upcoming':
      case 'assigned':
        return 'badge-upcoming';
      case 'ongoing':
        return 'badge-ongoing';
      default:
        return 'badge-neutral';
    }
  }

  function exportToCsv(rows, columns, filename = 'export.csv') {
    if (!rows || rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

    const dataRows = rows.map(row => {
      return columns.map(c => {
        let val = row[c.key];
        if (Array.isArray(val)) {
          val = val.join('; ');
        } else if (val === null || val === undefined) {
          val = '';
        } else {
          val = String(val);
        }
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [header, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /* ==========================================================================
     SECTION 2: OBJECT-ORIENTED DOMAIN MODELS
     ========================================================================== */

  /**
   * Base Class: Person
   * OOP: Encapsulation & Polymorphism
   */
  class Person {
    #id;
    #name;
    #email;
    #phone;

    constructor({ id, name, email, phone }) {
      this.#id = id || `per_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.name = name;
      this.email = email;
      this.phone = phone;
    }

    get id() { return this.#id; }
    get name() { return this.#name; }
    set name(value) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Name cannot be empty');
      }
      this.#name = value.trim();
    }

    get email() { return this.#email; }
    set email(value) {
      const trimmed = (value || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        throw new Error('Invalid email address format');
      }
      this.#email = trimmed.toLowerCase();
    }

    get phone() { return this.#phone; }
    set phone(value) {
      const trimmed = (value || '').trim();
      const cleanPhone = trimmed.replace(/[\s\-()]/g, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        throw new Error('Phone must be a valid 10-digit number');
      }
      this.#phone = cleanPhone;
    }

    getRoleDescription() {
      return 'General College Community Member';
    }

    getSummary() {
      return `${this.#name} (${this.#email})`;
    }

    toJSON() {
      return {
        id: this.#id,
        name: this.#name,
        email: this.#email,
        phone: this.#phone
      };
    }
  }

  /**
   * Subclass: Volunteer
   * OOP: Inheritance (extends Person) & Polymorphic Overriding
   */
  class Volunteer extends Person {
    #skills;
    #availability;
    #status;
    #joinedDate;

    constructor({ id, name, email, phone, skills = [], availability = [], status = 'Active', joinedDate }) {
      super({ id, name, email, phone });
      this.#skills = Array.isArray(skills) ? [...skills] : [];
      this.#availability = Array.isArray(availability) ? [...availability] : (availability ? [availability] : []);
      this.#status = status === 'Inactive' ? 'Inactive' : 'Active';
      this.#joinedDate = joinedDate || new Date().toISOString().split('T')[0];
    }

    get skills() { return [...this.#skills]; }
    set skills(newSkills) {
      if (!Array.isArray(newSkills)) throw new Error('Skills must be an array');
      this.#skills = [...newSkills];
    }

    get availability() { return [...this.#availability]; }
    set availability(newAvail) {
      if (!Array.isArray(newAvail)) throw new Error('Availability must be an array');
      this.#availability = [...newAvail];
    }

    get status() { return this.#status; }
    set status(val) {
      if (val !== 'Active' && val !== 'Inactive') throw new Error('Status must be Active or Inactive');
      this.#status = val;
    }

    get joinedDate() { return this.#joinedDate; }

    hasSkill(skillName) {
      if (!skillName) return false;
      return this.#skills.some(s => s.toLowerCase() === skillName.toLowerCase());
    }

    isAvailable(slot) {
      if (!slot) return true;
      return this.#availability.some(a => a.toLowerCase().includes(slot.toLowerCase()) || slot.toLowerCase().includes(a.toLowerCase()));
    }

    getRoleDescription() {
      return `Student Volunteer [${this.#status}] - Skills: ${this.#skills.join(', ') || 'General'}`;
    }

    getSummary() {
      return `${this.name} (${this.#status}) | Available: ${this.#availability.join(', ') || 'Anytime'}`;
    }

    toJSON() {
      return {
        ...super.toJSON(),
        skills: this.#skills,
        availability: this.#availability,
        status: this.#status,
        joinedDate: this.#joinedDate,
        role: 'Volunteer'
      };
    }

    static fromJSON(json) {
      return new Volunteer(json);
    }
  }

  /**
   * Subclass: Coordinator
   * OOP: Inheritance & Polymorphism
   */
  class Coordinator extends Person {
    #department;

    constructor({ id, name, email, phone, department = 'Computer Science' }) {
      super({ id, name, email, phone });
      this.#department = department;
    }

    get department() { return this.#department; }
    set department(dept) {
      if (!dept || typeof dept !== 'string') throw new Error('Department is required');
      this.#department = dept.trim();
    }

    getRoleDescription() {
      return `Event Coordinator (${this.#department} Dept)`;
    }

    getSummary() {
      return `${this.name} - Coordinator, Dept of ${this.#department}`;
    }

    toJSON() {
      return {
        ...super.toJSON(),
        department: this.#department,
        role: 'Coordinator'
      };
    }

    static fromJSON(json) {
      return new Coordinator(json);
    }
  }

  /**
   * Domain Model: Activity
   */
  class Activity {
    #id;
    #title;
    #description;
    #date;
    #venue;
    #category;
    #requiredVolunteers;
    #status;

    constructor({
      id,
      title,
      description = '',
      date,
      venue,
      category = 'College Event',
      requiredVolunteers = 5,
      status = 'Upcoming'
    }) {
      this.#id = id || `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.title = title;
      this.description = description;
      this.date = date;
      this.venue = venue;
      this.category = category;
      this.requiredVolunteers = requiredVolunteers;
      this.status = status;
    }

    get id() { return this.#id; }
    get title() { return this.#title; }
    set title(val) {
      if (!val || typeof val !== 'string' || val.trim().length === 0) {
        throw new Error('Activity title is required');
      }
      this.#title = val.trim();
    }

    get description() { return this.#description; }
    set description(val) { this.#description = (val || '').trim(); }

    get date() { return this.#date; }
    set date(val) {
      if (!val) throw new Error('Activity date is required');
      this.#date = val;
    }

    get venue() { return this.#venue; }
    set venue(val) {
      if (!val || typeof val !== 'string' || val.trim().length === 0) {
        throw new Error('Venue is required');
      }
      this.#venue = val.trim();
    }

    get category() { return this.#category; }
    set category(val) {
      const valid = ['College Event', 'Community Program', 'Workshop'];
      this.#category = valid.includes(val) ? val : 'College Event';
    }

    get requiredVolunteers() { return this.#requiredVolunteers; }
    set requiredVolunteers(val) {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) throw new Error('Required volunteers must be a positive number');
      this.#requiredVolunteers = num;
    }

    get status() { return this.#status; }
    set status(val) {
      const valid = ['Upcoming', 'Ongoing', 'Completed'];
      this.#status = valid.includes(val) ? val : 'Upcoming';
    }

    toJSON() {
      return {
        id: this.#id,
        title: this.#title,
        description: this.#description,
        date: this.#date,
        venue: this.#venue,
        category: this.#category,
        requiredVolunteers: this.#requiredVolunteers,
        status: this.#status
      };
    }

    static fromJSON(json) {
      return new Activity(json);
    }
  }

  /**
   * Domain Model: Task
   */
  class Task {
    #id;
    #activityId;
    #title;
    #description;
    #requiredSkill;
    #slots;
    #timeSlot;

    constructor({
      id,
      activityId,
      title,
      description = '',
      requiredSkill = 'General Support',
      slots = 2,
      timeSlot = 'Morning (09:00 - 12:00)'
    }) {
      if (!activityId) throw new Error('Task must be linked to an Activity');
      this.#id = id || `tsk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.#activityId = activityId;
      this.title = title;
      this.description = description;
      this.requiredSkill = requiredSkill;
      this.slots = slots;
      this.timeSlot = timeSlot;
    }

    get id() { return this.#id; }
    get activityId() { return this.#activityId; }

    get title() { return this.#title; }
    set title(val) {
      if (!val || typeof val !== 'string' || val.trim().length === 0) {
        throw new Error('Task title cannot be empty');
      }
      this.#title = val.trim();
    }

    get description() { return this.#description; }
    set description(val) { this.#description = (val || '').trim(); }

    get requiredSkill() { return this.#requiredSkill; }
    set requiredSkill(val) { this.#requiredSkill = (val || 'General Support').trim(); }

    get slots() { return this.#slots; }
    set slots(val) {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) throw new Error('Task slots must be at least 1');
      this.#slots = num;
    }

    get timeSlot() { return this.#timeSlot; }
    set timeSlot(val) {
      if (!val || typeof val !== 'string' || val.trim().length === 0) {
        throw new Error('Time slot is required');
      }
      this.#timeSlot = val.trim();
    }

    toJSON() {
      return {
        id: this.#id,
        activityId: this.#activityId,
        title: this.#title,
        description: this.#description,
        requiredSkill: this.#requiredSkill,
        slots: this.#slots,
        timeSlot: this.#timeSlot
      };
    }

    static fromJSON(json) {
      return new Task(json);
    }
  }

  /**
   * Domain Model: Assignment
   */
  class Assignment {
    #id;
    #volunteerId;
    #taskId;
    #activityId;
    #status;
    #assignedDate;

    constructor({
      id,
      volunteerId,
      taskId,
      activityId,
      status = 'Assigned',
      assignedDate
    }) {
      if (!volunteerId || !taskId || !activityId) {
        throw new Error('Assignment requires volunteerId, taskId, and activityId');
      }
      this.#id = id || `asg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.#volunteerId = volunteerId;
      this.#taskId = taskId;
      this.#activityId = activityId;
      this.status = status;
      this.#assignedDate = assignedDate || new Date().toISOString().split('T')[0];
    }

    get id() { return this.#id; }
    get volunteerId() { return this.#volunteerId; }
    get taskId() { return this.#taskId; }
    get activityId() { return this.#activityId; }
    get assignedDate() { return this.#assignedDate; }

    get status() { return this.#status; }
    set status(val) {
      const valid = ['Assigned', 'Completed', 'Cancelled'];
      if (!valid.includes(val)) throw new Error(`Invalid status: ${val}`);
      this.#status = val;
    }

    toJSON() {
      return {
        id: this.#id,
        volunteerId: this.#volunteerId,
        taskId: this.#taskId,
        activityId: this.#activityId,
        status: this.#status,
        assignedDate: this.#assignedDate
      };
    }

    static fromJSON(json) {
      return new Assignment(json);
    }
  }

  /* ==========================================================================
     SECTION 3: SEED DATA & CONSTANTS
     ========================================================================== */

  const SKILL_OPTIONS = [
    "Event Management",
    "Tech Support",
    "Registration",
    "Photography",
    "Stage Setup",
    "First Aid",
    "Public Relations",
    "Graphic Design",
    "Social Media",
    "Emcee/Host",
    "Hospitality",
    "Logistics",
    "General Support"
  ];

  const TIME_SLOT_OPTIONS = [
    "Morning (09:00 - 12:00)",
    "Afternoon (13:00 - 16:00)",
    "Evening (16:00 - 19:00)",
    "Full Day (09:00 - 17:00)"
  ];

  const AVAILABILITY_OPTIONS = [
    "Weekdays",
    "Weekends",
    "Morning (09:00 - 12:00)",
    "Afternoon (13:00 - 16:00)",
    "Evening (16:00 - 19:00)",
    "Full Day"
  ];

  const INITIAL_VOLUNTEERS = [
    {
      id: "vol_101",
      name: "Aadhi Lakshmi S",
      email: "aadhilakshmi@college.edu",
      phone: "9876543210",
      skills: ["Event Management", "Registration", "Public Relations"],
      availability: ["Weekdays", "Morning (09:00 - 12:00)", "Afternoon (13:00 - 16:00)"],
      status: "Active",
      joinedDate: "2026-08-15"
    },
    {
      id: "vol_102",
      name: "Anusree Anilkumar",
      email: "anusree.a@college.edu",
      phone: "9876543211",
      skills: ["Graphic Design", "Social Media", "Public Relations"],
      availability: ["Weekdays", "Weekends", "Evening (16:00 - 19:00)"],
      status: "Active",
      joinedDate: "2026-08-16"
    },
    {
      id: "vol_103",
      name: "Sooraj Rajendran",
      email: "sooraj.r@college.edu",
      phone: "9876543212",
      skills: ["Tech Support", "Stage Setup", "Logistics"],
      availability: ["Weekends", "Morning (09:00 - 12:00)", "Full Day"],
      status: "Active",
      joinedDate: "2026-08-18"
    },
    {
      id: "vol_104",
      name: "George Thankachan",
      email: "george.t@college.edu",
      phone: "9876543213",
      skills: ["Photography", "Stage Setup", "Hospitality"],
      availability: ["Weekdays", "Weekends", "Afternoon (13:00 - 16:00)"],
      status: "Active",
      joinedDate: "2026-08-20"
    },
    {
      id: "vol_105",
      name: "Rohan Varghese",
      email: "rohan.v@college.edu",
      phone: "9876543214",
      skills: ["First Aid", "Hospitality", "Logistics"],
      availability: ["Weekends", "Morning (09:00 - 12:00)"],
      status: "Active",
      joinedDate: "2026-09-01"
    },
    {
      id: "vol_106",
      name: "Meera Krishnan",
      email: "meera.k@college.edu",
      phone: "9876543215",
      skills: ["Emcee/Host", "Event Management", "Public Relations"],
      availability: ["Weekdays", "Evening (16:00 - 19:00)"],
      status: "Active",
      joinedDate: "2026-09-05"
    },
    {
      id: "vol_107",
      name: "Arjun Nair",
      email: "arjun.n@college.edu",
      phone: "9876543216",
      skills: ["Tech Support", "Registration", "Logistics"],
      availability: ["Weekdays", "Morning (09:00 - 12:00)"],
      status: "Active",
      joinedDate: "2026-09-10"
    },
    {
      id: "vol_108",
      name: "Devika Menon",
      email: "devika.m@college.edu",
      phone: "9876543217",
      skills: ["Photography", "Graphic Design", "Social Media"],
      availability: ["Weekends", "Full Day"],
      status: "Active",
      joinedDate: "2026-09-12"
    },
    {
      id: "vol_109",
      name: "Karthik Pillai",
      email: "karthik.p@college.edu",
      phone: "9876543218",
      skills: ["First Aid", "Stage Setup"],
      availability: ["Weekdays", "Afternoon (13:00 - 16:00)"],
      status: "Inactive",
      joinedDate: "2026-07-20"
    },
    {
      id: "vol_110",
      name: "Sneha Rachel",
      email: "sneha.r@college.edu",
      phone: "9876543219",
      skills: ["Registration", "Hospitality", "Event Management"],
      availability: ["Weekdays", "Weekends", "Morning (09:00 - 12:00)"],
      status: "Active",
      joinedDate: "2026-09-15"
    }
  ];

  const INITIAL_ACTIVITIES = [
    {
      id: "act_201",
      title: "Innovate 2026 - Annual Tech Symposium",
      description: "Flagship inter-college technical fest with coding contests, robotics expo, and paper presentations.",
      date: "2026-11-15",
      venue: "Main Auditorium & CS Labs",
      category: "College Event",
      requiredVolunteers: 12,
      status: "Upcoming"
    },
    {
      id: "act_202",
      title: "Campus Blood Donation & Health Camp",
      description: "Organized in collaboration with Red Cross to promote health awareness and blood donation.",
      date: "2026-10-30",
      venue: "College Health Centre & Gym",
      category: "Community Program",
      requiredVolunteers: 8,
      status: "Upcoming"
    },
    {
      id: "act_203",
      title: "Full-Stack Web Development Bootcamp",
      description: "Two-day hands-on workshop on modern JavaScript, Web APIs, and cloud deployment for junior students.",
      date: "2026-10-25",
      venue: "Seminar Hall 2",
      category: "Workshop",
      requiredVolunteers: 6,
      status: "Ongoing"
    },
    {
      id: "act_204",
      title: "Green Campus Mega Tree Plantation Drive",
      description: "Environmental club initiative planting 200 indigenous saplings across the college perimeter.",
      date: "2026-09-28",
      venue: "College Campus Grounds",
      category: "Community Program",
      requiredVolunteers: 10,
      status: "Completed"
    }
  ];

  const INITIAL_TASKS = [
    {
      id: "tsk_301",
      activityId: "act_201",
      title: "Coding Lab Tech Assistance & Network Setup",
      description: "Prepare terminals, test compiler environments, and support participants during hackathon.",
      requiredSkill: "Tech Support",
      slots: 2,
      timeSlot: "Morning (09:00 - 12:00)"
    },
    {
      id: "tsk_302",
      activityId: "act_201",
      title: "Participant Helpdesk & Kit Distribution",
      description: "Register visiting colleges, issue ID badges, and distribute welcome kits at the lobby.",
      requiredSkill: "Registration",
      slots: 3,
      timeSlot: "Morning (09:00 - 12:00)"
    },
    {
      id: "tsk_303",
      activityId: "act_201",
      title: "Opening Ceremony Audio-Visual & Stage Management",
      description: "Operate AV systems, arrange podiums, and manage inaugural stage proceedings.",
      requiredSkill: "Stage Setup",
      slots: 2,
      timeSlot: "Morning (09:00 - 12:00)"
    },
    {
      id: "tsk_304",
      activityId: "act_201",
      title: "Event Photography & Live Social Updates",
      description: "Capture high-resolution photos of speakers and hackathon winners, live posting.",
      requiredSkill: "Photography",
      slots: 2,
      timeSlot: "Afternoon (13:00 - 16:00)"
    },
    {
      id: "tsk_305",
      activityId: "act_202",
      title: "Donor Vitals & Refreshment Area Monitoring",
      description: "Guide donors post-donation, provide juice/snacks, and assist Red Cross medical team.",
      requiredSkill: "First Aid",
      slots: 2,
      timeSlot: "Morning (09:00 - 12:00)"
    },
    {
      id: "tsk_306",
      activityId: "act_202",
      title: "Donor Registration & Certificate Desk",
      description: "Collect donor forms, verify eligibility details, and distribute digital certificates.",
      requiredSkill: "Registration",
      slots: 2,
      timeSlot: "Morning (09:00 - 12:00)"
    },
    {
      id: "tsk_307",
      activityId: "act_203",
      title: "Student Coding Mentor & Doubt Clearance",
      description: "Assist attendees with Git commands, VS Code setup, and syntax troubleshooting.",
      requiredSkill: "Tech Support",
      slots: 2,
      timeSlot: "Afternoon (13:00 - 16:00)"
    },
    {
      id: "tsk_308",
      activityId: "act_204",
      title: "Sapling Distribution & Digging Team Lead",
      description: "Organize sapling distribution and water supply for volunteers.",
      requiredSkill: "Logistics",
      slots: 4,
      timeSlot: "Morning (09:00 - 12:00)"
    }
  ];

  const INITIAL_ASSIGNMENTS = [
    {
      id: "asg_401",
      volunteerId: "vol_103",
      taskId: "tsk_301",
      activityId: "act_201",
      status: "Assigned",
      assignedDate: "2026-10-18"
    },
    {
      id: "asg_402",
      volunteerId: "vol_101",
      taskId: "tsk_302",
      activityId: "act_201",
      status: "Assigned",
      assignedDate: "2026-10-19"
    },
    {
      id: "asg_403",
      volunteerId: "vol_110",
      taskId: "tsk_302",
      activityId: "act_201",
      status: "Assigned",
      assignedDate: "2026-10-19"
    },
    {
      id: "asg_404",
      volunteerId: "vol_104",
      taskId: "tsk_304",
      activityId: "act_201",
      status: "Assigned",
      assignedDate: "2026-10-20"
    },
    {
      id: "asg_405",
      volunteerId: "vol_105",
      taskId: "tsk_305",
      activityId: "act_202",
      status: "Assigned",
      assignedDate: "2026-10-21"
    },
    {
      id: "asg_406",
      volunteerId: "vol_107",
      taskId: "tsk_307",
      activityId: "act_203",
      status: "Assigned",
      assignedDate: "2026-10-22"
    },
    {
      id: "asg_407",
      volunteerId: "vol_101",
      taskId: "tsk_308",
      activityId: "act_204",
      status: "Completed",
      assignedDate: "2026-09-25"
    },
    {
      id: "asg_408",
      volunteerId: "vol_103",
      taskId: "tsk_308",
      activityId: "act_204",
      status: "Completed",
      assignedDate: "2026-09-25"
    },
    {
      id: "asg_409",
      volunteerId: "vol_105",
      taskId: "tsk_308",
      activityId: "act_204",
      status: "Completed",
      assignedDate: "2026-09-25"
    }
  ];

  /* ==========================================================================
     SECTION 4: DATA ACCESS REPOSITORY & SERVICES
     ========================================================================== */

  const memoryStore = new Map();

  const storageBackend = {
    getItem(key) {
      try {
        if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
      } catch (e) {}
      return memoryStore.get(key) || null;
    },
    setItem(key, value) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          return;
        }
      } catch (e) {}
      memoryStore.set(key, String(value));
    },
    removeItem(key) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          return;
        }
      } catch (e) {}
      memoryStore.delete(key);
    }
  };

  class StorageService {
    #prefix;

    constructor(prefix = 'vms_') {
      this.#prefix = prefix;
    }

    #getKey(collection) {
      return `${this.#prefix}${collection}`;
    }

    getAll(collection) {
      try {
        const data = storageBackend.getItem(this.#getKey(collection));
        return data ? JSON.parse(data) : [];
      } catch (err) {
        return [];
      }
    }

    getById(collection, id) {
      const items = this.getAll(collection);
      return items.find(item => item.id === id) || null;
    }

    save(collection, item) {
      const items = this.getAll(collection);
      items.push(item);
      this.#write(collection, items);
      return item;
    }

    update(collection, id, updatedFields) {
      const items = this.getAll(collection);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updatedFields, id };
      this.#write(collection, items);
      return items[index];
    }

    delete(collection, id) {
      const items = this.getAll(collection);
      const filtered = items.filter(item => item.id !== id);
      if (filtered.length !== items.length) {
        this.#write(collection, filtered);
        return true;
      }
      return false;
    }

    setAll(collection, items) {
      this.#write(collection, items);
    }

    clear(collection) {
      storageBackend.removeItem(this.#getKey(collection));
    }

    #write(collection, data) {
      storageBackend.setItem(this.#getKey(collection), JSON.stringify(data));
    }
  }

  const storage = new StorageService();

  class VolunteerService {
    constructor() {
      this.#initialize();
    }

    #initialize() {
      const existing = storage.getAll('volunteers');
      if (!existing || existing.length === 0) {
        storage.setAll('volunteers', INITIAL_VOLUNTEERS);
      }
    }

    resetToDefault() {
      storage.setAll('volunteers', INITIAL_VOLUNTEERS);
    }

    getAll() {
      return storage.getAll('volunteers').map(raw => Volunteer.fromJSON(raw));
    }

    getById(id) {
      const raw = storage.getById('volunteers', id);
      return raw ? Volunteer.fromJSON(raw) : null;
    }

    create(data) {
      const all = this.getAll();
      if (all.some(v => v.email.toLowerCase() === (data.email || '').trim().toLowerCase())) {
        throw new Error('A volunteer with this email address already exists');
      }
      const volunteer = new Volunteer(data);
      storage.save('volunteers', volunteer.toJSON());
      return volunteer;
    }

    update(id, data) {
      const existing = this.getById(id);
      if (!existing) throw new Error(`Volunteer with ID ${id} not found`);

      if (data.email) {
        const conflict = this.getAll().find(v => v.id !== id && v.email.toLowerCase() === data.email.trim().toLowerCase());
        if (conflict) throw new Error('Another volunteer with this email address already exists');
      }

      const updated = new Volunteer({ ...existing.toJSON(), ...data, id });
      storage.update('volunteers', id, updated.toJSON());
      return updated;
    }

    delete(id) {
      return storage.delete('volunteers', id);
    }

    searchAndFilter({ search = '', skill = '', availability = '', status = '' } = {}) {
      let list = this.getAll();
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(v =>
          v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.phone.includes(q)
        );
      }
      if (skill) list = list.filter(v => v.hasSkill(skill));
      if (availability) list = list.filter(v => v.isAvailable(availability));
      if (status) list = list.filter(v => v.status === status);
      return list;
    }
  }

  const volunteerService = new VolunteerService();

  class ActivityService {
    constructor() {
      this.#initialize();
    }

    #initialize() {
      const acts = storage.getAll('activities');
      if (!acts || acts.length === 0) storage.setAll('activities', INITIAL_ACTIVITIES);

      const tasks = storage.getAll('tasks');
      if (!tasks || tasks.length === 0) storage.setAll('tasks', INITIAL_TASKS);
    }

    resetToDefault() {
      storage.setAll('activities', INITIAL_ACTIVITIES);
      storage.setAll('tasks', INITIAL_TASKS);
    }

    getAllActivities() {
      return storage.getAll('activities').map(raw => Activity.fromJSON(raw));
    }

    getActivityById(id) {
      const raw = storage.getById('activities', id);
      return raw ? Activity.fromJSON(raw) : null;
    }

    createActivity(data) {
      const activity = new Activity(data);
      storage.save('activities', activity.toJSON());
      return activity;
    }

    updateActivity(id, data) {
      const existing = this.getActivityById(id);
      if (!existing) throw new Error(`Activity with ID ${id} not found`);
      const updated = new Activity({ ...existing.toJSON(), ...data, id });
      storage.update('activities', id, updated.toJSON());
      return updated;
    }

    deleteActivity(id) {
      const tasks = this.getTasksForActivity(id);
      tasks.forEach(t => storage.delete('tasks', t.id));
      const assignments = storage.getAll('assignments').filter(a => a.activityId !== id);
      storage.setAll('assignments', assignments);
      return storage.delete('activities', id);
    }

    getAllTasks() {
      return storage.getAll('tasks').map(raw => Task.fromJSON(raw));
    }

    getTasksForActivity(activityId) {
      return this.getAllTasks().filter(t => t.activityId === activityId);
    }

    getTaskById(id) {
      const raw = storage.getById('tasks', id);
      return raw ? Task.fromJSON(raw) : null;
    }

    createTask(data) {
      const task = new Task(data);
      storage.save('tasks', task.toJSON());
      return task;
    }

    updateTask(id, data) {
      const existing = this.getTaskById(id);
      if (!existing) throw new Error(`Task with ID ${id} not found`);
      const updated = new Task({ ...existing.toJSON(), ...data, id });
      storage.update('tasks', id, updated.toJSON());
      return updated;
    }

    deleteTask(id) {
      const assignments = storage.getAll('assignments').filter(a => a.taskId !== id);
      storage.setAll('assignments', assignments);
      return storage.delete('tasks', id);
    }

    getActivitySlotStats(activityId) {
      const tasks = this.getTasksForActivity(activityId);
      const assignments = storage.getAll('assignments').filter(
        a => a.activityId === activityId && a.status !== 'Cancelled'
      );
      const totalSlots = tasks.reduce((sum, t) => sum + t.slots, 0);
      const filledSlots = assignments.length;
      const openSlots = Math.max(0, totalSlots - filledSlots);
      const percentage = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;
      return { totalSlots, filledSlots, openSlots, percentage };
    }
  }

  const activityService = new ActivityService();

  class AssignmentService {
    constructor() {
      this.#initialize();
    }

    #initialize() {
      const asgs = storage.getAll('assignments');
      if (!asgs || asgs.length === 0) storage.setAll('assignments', INITIAL_ASSIGNMENTS);
    }

    resetToDefault() {
      storage.setAll('assignments', INITIAL_ASSIGNMENTS);
    }

    getAll() {
      return storage.getAll('assignments').map(raw => Assignment.fromJSON(raw));
    }

    getById(id) {
      const raw = storage.getById('assignments', id);
      return raw ? Assignment.fromJSON(raw) : null;
    }

    getAssignmentsForTask(taskId, activeOnly = true) {
      return this.getAll().filter(a => a.taskId === taskId && (!activeOnly || a.status !== 'Cancelled'));
    }

    getAssignmentsForVolunteer(volunteerId) {
      return this.getAll().filter(a => a.volunteerId === volunteerId);
    }

    createAssignment({ volunteerId, taskId }) {
      const volunteer = volunteerService.getById(volunteerId);
      if (!volunteer) throw new Error('Volunteer not found.');
      if (volunteer.status === 'Inactive') throw new Error(`Cannot assign ${volunteer.name} because their status is Inactive.`);

      const task = activityService.getTaskById(taskId);
      if (!task) throw new Error('Task not found.');

      const activity = activityService.getActivityById(task.activityId);
      if (!activity) throw new Error('Parent activity for this task was not found.');

      // 1. Duplicate check
      const existingSameTask = this.getAll().find(
        a => a.volunteerId === volunteerId && a.taskId === taskId && a.status !== 'Cancelled'
      );
      if (existingSameTask) throw new Error(`${volunteer.name} is already assigned to "${task.title}".`);

      // 2. Capacity limit check
      const currentTaskAssignments = this.getAssignmentsForTask(taskId, true);
      if (currentTaskAssignments.length >= task.slots) {
        throw new Error(`Task "${task.title}" has reached its maximum capacity of ${task.slots} volunteer(s).`);
      }

      // 3. Double Booking Conflict
      const allActiveAssignments = this.getAll().filter(
        a => a.volunteerId === volunteerId && a.status !== 'Cancelled'
      );

      for (const asg of allActiveAssignments) {
        const otherTask = activityService.getTaskById(asg.taskId);
        if (!otherTask) continue;
        const otherActivity = activityService.getActivityById(otherTask.activityId);
        if (!otherActivity) continue;

        if (otherActivity.date === activity.date && otherTask.timeSlot === task.timeSlot) {
          throw new Error(
            `Schedule Conflict: ${volunteer.name} is already scheduled for "${otherTask.title}" (${otherActivity.title}) during ${task.timeSlot} on ${activity.date}.`
          );
        }
      }

      const newAssignment = new Assignment({
        volunteerId,
        taskId,
        activityId: activity.id,
        status: 'Assigned',
        assignedDate: new Date().toISOString().split('T')[0]
      });

      storage.save('assignments', newAssignment.toJSON());
      return newAssignment;
    }

    updateStatus(id, newStatus) {
      const existing = this.getById(id);
      if (!existing) throw new Error('Assignment not found');
      existing.status = newStatus;
      storage.update('assignments', id, existing.toJSON());
      return existing;
    }

    delete(id) {
      return storage.delete('assignments', id);
    }

    suggestVolunteersForTask(taskId) {
      const task = activityService.getTaskById(taskId);
      if (!task) return [];
      const activity = activityService.getActivityById(task.activityId);
      if (!activity) return [];

      const allVolunteers = volunteerService.getAll();
      const existingAssignments = this.getAll().filter(a => a.status !== 'Cancelled');
      const assignedVolunteerIds = new Set(
        existingAssignments.filter(a => a.taskId === taskId).map(a => a.volunteerId)
      );

      const suggestions = [];

      for (const vol of allVolunteers) {
        if (assignedVolunteerIds.has(vol.id)) continue;
        if (vol.status !== 'Active') continue;

        // Check date/time collision
        const hasConflict = existingAssignments.some(asg => {
          if (asg.volunteerId !== vol.id) return false;
          const otherTask = activityService.getTaskById(asg.taskId);
          if (!otherTask) return false;
          const otherAct = activityService.getActivityById(otherTask.activityId);
          if (!otherAct) return false;
          return otherAct.date === activity.date && otherTask.timeSlot === task.timeSlot;
        });

        if (hasConflict) continue;

        let score = 15;
        const reasons = [];

        if (vol.hasSkill(task.requiredSkill)) {
          score += 50;
          reasons.push(`Has required skill: ${task.requiredSkill}`);
        } else {
          reasons.push('General skills');
        }

        const matchesTime = vol.isAvailable(task.timeSlot) || vol.isAvailable('Full Day');
        if (matchesTime) {
          score += 30;
          reasons.push(`Available for ${task.timeSlot}`);
        }

        const currentLoad = existingAssignments.filter(a => a.volunteerId === vol.id && a.status === 'Assigned').length;
        if (currentLoad === 0) {
          score += 10;
          reasons.push('Currently unassigned (Available)');
        } else {
          score -= currentLoad * 5;
          reasons.push(`Currently has ${currentLoad} active task(s)`);
        }

        suggestions.push({
          volunteer: vol,
          score: Math.max(0, score),
          reasons
        });
      }

      return suggestions.sort((a, b) => b.score - a.score);
    }

    getVolunteerParticipation(volunteerId) {
      const list = this.getAssignmentsForVolunteer(volunteerId);
      const completed = list.filter(a => a.status === 'Completed').length;
      const active = list.filter(a => a.status === 'Assigned').length;
      const cancelled = list.filter(a => a.status === 'Cancelled').length;

      const enriched = list.map(asg => {
        const task = activityService.getTaskById(asg.taskId);
        const activity = activityService.getActivityById(asg.activityId);
        return {
          ...asg.toJSON(),
          taskTitle: task ? task.title : 'Unknown Task',
          taskTimeSlot: task ? task.timeSlot : 'N/A',
          activityTitle: activity ? activity.title : 'Unknown Activity',
          activityDate: activity ? activity.date : 'N/A'
        };
      });

      return { total: list.length, completed, active, cancelled, assignments: enriched };
    }
  }

  const assignmentService = new AssignmentService();

  /* ==========================================================================
     SECTION 5: UI SERVICES (Toast & Modal)
     ========================================================================== */

  class ToastService {
    show(message, type = 'info', duration = 4000) {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      let iconSvg = '';
      switch (type) {
        case 'success':
          iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
          break;
        case 'error':
          iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
          break;
        case 'warning':
          iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
          break;
        default:
          iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      }

      toast.innerHTML = `${iconSvg}<div class="toast-message">${message}</div>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }

    success(msg) { this.show(msg, 'success'); }
    error(msg) { this.show(msg, 'error', 5000); }
    warning(msg) { this.show(msg, 'warning', 4500); }
    info(msg) { this.show(msg, 'info'); }
  }

  const toast = new ToastService();

  class ModalService {
    #overlay = null;
    #titleElem = null;
    #bodyElem = null;
    #footerElem = null;
    #onCloseCallback = null;

    #ensureInit() {
      if (this.#overlay) return;
      let overlay = document.getElementById('app-modal-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'app-modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal-content" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3 class="modal-title" id="modal-title">Dialog</h3>
              <button class="btn-icon modal-close-btn" aria-label="Close modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body" id="modal-body"></div>
            <div class="modal-footer" id="modal-footer"></div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      this.#overlay = overlay;
      this.#titleElem = overlay.querySelector('#modal-title');
      this.#bodyElem = overlay.querySelector('#modal-body');
      this.#footerElem = overlay.querySelector('#modal-footer');

      overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) this.close();
      });
    }

    open({ title, body, buttons = [], onClose = null }) {
      this.#ensureInit();
      this.#titleElem.textContent = title;
      this.#onCloseCallback = onClose;

      if (typeof body === 'string') {
        this.#bodyElem.innerHTML = body;
      } else if (body instanceof HTMLElement) {
        this.#bodyElem.innerHTML = '';
        this.#bodyElem.appendChild(body);
      }

      this.#footerElem.innerHTML = '';
      if (buttons.length > 0) {
        buttons.forEach(btnConfig => {
          const btn = document.createElement('button');
          btn.className = `btn ${btnConfig.className || 'btn-secondary'}`;
          btn.textContent = btnConfig.label;
          btn.addEventListener('click', (e) => {
            if (btnConfig.onClick) btnConfig.onClick(e, this);
          });
          this.#footerElem.appendChild(btn);
        });
        this.#footerElem.style.display = 'flex';
      } else {
        this.#footerElem.style.display = 'none';
      }

      this.#overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    close() {
      if (this.#overlay) {
        this.#overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
      if (this.#onCloseCallback) {
        this.#onCloseCallback();
        this.#onCloseCallback = null;
      }
    }

    confirm({ title = 'Confirm Action', message, confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
      this.open({
        title,
        body: `<p style="font-size:0.95rem; line-height: 1.5; color: var(--text-muted);">${message}</p>`,
        buttons: [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => this.close() },
          {
            label: confirmText,
            className: confirmClass,
            onClick: () => {
              this.close();
              if (onConfirm) onConfirm();
            }
          }
        ]
      });
    }
  }

  const modal = new ModalService();

  function openAboutModal() {
    const content = `
      <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main);">
        <div style="background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.12), rgba(var(--accent-rgb), 0.12)); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--primary-500);">
            Volunteer Management System (VMS)
          </h4>
          <p style="color: var(--text-muted); font-size: 0.85rem;">
            A responsive, Object-Oriented web application for college events, activities, and community programs.
          </p>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
            Project Team &bull; Group 12 (S3 CSE DS)
          </h5>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.6rem;">
            <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--primary-500);">
              <strong>Aadhi Lakshmi S</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 01</div>
            </div>
            <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--primary-500);">
              <strong>Anusree Anilkumar</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 17</div>
            </div>
            <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-500);">
              <strong>Sooraj Rajendran</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 50</div>
            </div>
            <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-500);">
              <strong>George Thankachan</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 55</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
            OOP Concepts Implementation (Viva Reference)
          </h5>
          <div style="background: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.825rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div>
              <strong style="color: var(--primary-500);">1. Encapsulation:</strong>
              Private fields (<code>#id</code>, <code>#name</code>, <code>#email</code>, <code>#skills</code>) accessed via validated getters and setters (email format regex, 10-digit phone number check).
            </div>
            <div>
              <strong style="color: var(--primary-500);">2. Inheritance:</strong>
              <code>Volunteer</code> and <code>Coordinator</code> extend the base class <code>Person</code> via <code>extends Person</code> and delegate base initialization via <code>super()</code>.
            </div>
            <div>
              <strong style="color: var(--primary-500);">3. Polymorphism:</strong>
              Subclasses override <code>getRoleDescription()</code> and <code>getSummary()</code> dynamically, allowing runtime polymorphic behavior across person references.
            </div>
            <div>
              <strong style="color: var(--primary-500);">4. Abstraction:</strong>
              <code>StorageService</code> abstracts persistence behind a clean CRUD repository pattern, decoupling domain logic from localStorage.
            </div>
          </div>
        </div>
      </div>
    `;

    modal.open({
      title: 'About Volunteer Management System',
      body: content,
      buttons: [{ label: 'Close', className: 'btn-secondary', onClick: () => modal.close() }]
    });
  }

  /* ==========================================================================
     SECTION 6: VIEW CONTROLLERS
     ========================================================================== */

  // 1. Dashboard View
  class DashboardView {
    #container;
    constructor(containerId = 'view-dashboard') {
      this.#container = document.getElementById(containerId);
    }

    render() {
      const volunteers = volunteerService.getAll();
      const activities = activityService.getAllActivities();
      const tasks = activityService.getAllTasks();
      const assignments = assignmentService.getAll();

      const totalVolunteers = volunteers.length;
      const activeVolunteers = volunteers.filter(v => v.status === 'Active').length;
      const activeActivities = activities.filter(a => a.status === 'Upcoming' || a.status === 'Ongoing').length;
      const activeAssignments = assignments.filter(a => a.status !== 'Cancelled');
      const totalSlots = tasks.reduce((sum, t) => sum + t.slots, 0);
      const filledSlots = activeAssignments.length;
      const openSlots = Math.max(0, totalSlots - filledSlots);

      const upcomingActivities = activities
        .filter(a => a.status !== 'Completed')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);

      this.#container.innerHTML = `
        <div class="section-header">
          <div>
            <h2 class="section-title">Dashboard Overview</h2>
            <p class="section-description">Real-time status of college events, volunteer participation, and open task slots.</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary" id="btn-quick-assign">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Assign Volunteer
            </button>
          </div>
        </div>

        <div class="cards-grid">
          <div class="card stat-card card-hover">
            <div class="stat-icon teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
              <div class="stat-label">Total Volunteers</div>
              <div class="stat-value">${totalVolunteers}</div>
              <div class="stat-subtext">${activeVolunteers} active members</div>
            </div>
          </div>

          <div class="card stat-card card-hover">
            <div class="stat-icon indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
              <div class="stat-label">Active Activities</div>
              <div class="stat-value">${activeActivities}</div>
              <div class="stat-subtext">Across campus & community</div>
            </div>
          </div>

          <div class="card stat-card card-hover">
            <div class="stat-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div>
              <div class="stat-label">Open Task Slots</div>
              <div class="stat-value">${openSlots}</div>
              <div class="stat-subtext">${filledSlots} of ${totalSlots} slots assigned</div>
            </div>
          </div>

          <div class="card stat-card card-hover">
            <div class="stat-icon emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div>
              <div class="stat-label">Assignments Made</div>
              <div class="stat-value">${assignments.length}</div>
              <div class="stat-subtext">${assignments.filter(a => a.status === 'Completed').length} successfully completed</div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.05rem; font-weight:700;">Task Slot Fulfillment</h3>
              <span class="badge badge-neutral">${totalSlots > 0 ? Math.round((filledSlots/totalSlots)*100) : 0}% Filled</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; height: 180px;">
              ${this.#renderDonutChart(filledSlots, openSlots)}
            </div>
            <div style="display: flex; justify-content: space-around; font-size: 0.85rem; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color: var(--primary-500);"></span>
                <span>Filled Slots: <strong>${filledSlots}</strong></span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color: var(--border-color);"></span>
                <span>Open Slots: <strong>${openSlots}</strong></span>
              </div>
            </div>
          </div>

          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.05rem; font-weight:700;">Top Required Skills for Events</h3>
              <span class="badge badge-neutral">${tasks.length} Total Tasks</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; justify-content: center; min-height: 180px;">
              ${this.#renderSkillBarChart(tasks)}
            </div>
          </div>
        </div>

        <div class="card" style="padding: 1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.25rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight:700;">Upcoming Events & Programs</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Activities requiring volunteer coordination</p>
            </div>
            <a href="#activities" class="btn btn-secondary btn-sm">View All Activities &rarr;</a>
          </div>

          ${upcomingActivities.length === 0 ? `
            <div class="empty-state"><p>No upcoming activities. Create your first event in the Activities tab!</p></div>
          ` : `
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Category</th>
                    <th>Date & Venue</th>
                    <th>Volunteer Slots</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcomingActivities.map(act => {
                    const stats = activityService.getActivitySlotStats(act.id);
                    return `
                      <tr>
                        <td style="font-weight: 600;">${escapeHtml(act.title)}</td>
                        <td><span class="badge badge-neutral">${escapeHtml(act.category)}</span></td>
                        <td>
                          <div>${formatDate(act.date)}</div>
                          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(act.venue)}</div>
                        </td>
                        <td style="min-width: 140px;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                            <span>${stats.filledSlots} of ${stats.totalSlots} slots</span>
                            <span><strong>${stats.percentage}%</strong></span>
                          </div>
                          <div class="progress-container">
                            <div class="progress-bar ${stats.percentage === 100 ? 'complete' : ''}" style="width: ${stats.percentage}%;"></div>
                          </div>
                        </td>
                        <td><span class="badge ${getStatusBadgeClass(act.status)}">${act.status}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

      const quickAssignBtn = this.#container.querySelector('#btn-quick-assign');
      if (quickAssignBtn) {
        quickAssignBtn.addEventListener('click', () => { window.location.hash = '#assignments'; });
      }
    }

    #renderDonutChart(filled, open) {
      const total = filled + open;
      if (total === 0) return `<div style="color:var(--text-muted); font-size:0.875rem;">No tasks created yet</div>`;
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      const filledPercent = filled / total;
      const filledStroke = filledPercent * circumference;
      const openStroke = circumference - filledStroke;

      return `
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="20" />
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--primary-500)" stroke-width="20"
            stroke-dasharray="${filledStroke} ${openStroke}"
            stroke-dashoffset="${circumference * 0.25}"
            stroke-linecap="round"
            style="transition: stroke-dasharray 0.6s ease;"
          />
          <text x="80" y="75" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text-main)">
            ${Math.round(filledPercent * 100)}%
          </text>
          <text x="80" y="95" text-anchor="middle" font-size="11" fill="var(--text-muted)">Fulfilled</text>
        </svg>
      `;
    }

    #renderSkillBarChart(tasks) {
      if (tasks.length === 0) return `<div style="color:var(--text-muted); font-size:0.875rem;">No tasks defined yet</div>`;
      const skillCounts = {};
      tasks.forEach(t => {
        skillCounts[t.requiredSkill] = (skillCounts[t.requiredSkill] || 0) + t.slots;
      });
      const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const maxCount = Math.max(...sortedSkills.map(s => s[1]), 1);

      return sortedSkills.map(([skill, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:3px;">
              <span style="font-weight:600;">${escapeHtml(skill)}</span>
              <span style="color:var(--text-muted);">${count} slots</span>
            </div>
            <div class="progress-container" style="height: 6px;">
              <div class="progress-bar" style="width: ${pct}%; background: var(--accent-500);"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Volunteers View
  class VolunteersView {
    #container;
    #currentFilters = { search: '', skill: '', availability: '', status: '' };

    constructor(containerId = 'view-volunteers') {
      this.#container = document.getElementById(containerId);
    }

    render() {
      const volunteers = volunteerService.searchAndFilter(this.#currentFilters);

      this.#container.innerHTML = `
        <div class="section-header">
          <div>
            <h2 class="section-title">Volunteers Directory</h2>
            <p class="section-description">Manage student volunteers, skill sets, availability schedules, and participation records.</p>
          </div>
          <button class="btn btn-primary" id="btn-add-volunteer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Volunteer
          </button>
        </div>

        <div class="filter-bar">
          <div class="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="vol-search-input" class="search-input" placeholder="Search by name, email, or phone..." value="${escapeHtml(this.#currentFilters.search)}">
          </div>

          <select id="vol-filter-skill" class="filter-select">
            <option value="">All Skills</option>
            ${SKILL_OPTIONS.map(s => `<option value="${escapeHtml(s)}" ${this.#currentFilters.skill === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
          </select>

          <select id="vol-filter-avail" class="filter-select">
            <option value="">All Availabilities</option>
            ${AVAILABILITY_OPTIONS.map(a => `<option value="${escapeHtml(a)}" ${this.#currentFilters.availability === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
          </select>

          <select id="vol-filter-status" class="filter-select">
            <option value="">All Statuses</option>
            <option value="Active" ${this.#currentFilters.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${this.#currentFilters.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>

          ${(this.#currentFilters.search || this.#currentFilters.skill || this.#currentFilters.availability || this.#currentFilters.status) ? `
            <button class="btn btn-ghost btn-sm" id="btn-clear-vol-filters">Clear Filters</button>
          ` : ''}
        </div>

        ${volunteers.length === 0 ? `
          <div class="empty-state">
            <h4 class="empty-state-title">No Volunteers Found</h4>
            <p class="empty-state-description">Try adjusting your search criteria or register a new volunteer.</p>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Volunteer Name</th>
                  <th>Contact Info</th>
                  <th>Skills</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${volunteers.map(vol => `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(vol.name)}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">${escapeHtml(vol.getRoleDescription())}</div>
                    </td>
                    <td>
                      <div>${escapeHtml(vol.email)}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(vol.phone)}</div>
                    </td>
                    <td style="max-width: 240px;">
                      <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                        ${vol.skills.slice(0, 3).map(s => `<span class="badge badge-skill">${escapeHtml(s)}</span>`).join('')}
                        ${vol.skills.length > 3 ? `<span class="badge badge-neutral">+${vol.skills.length - 3}</span>` : ''}
                      </div>
                    </td>
                    <td>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">${vol.availability.join(', ') || 'Flexible'}</div>
                    </td>
                    <td><span class="badge ${getStatusBadgeClass(vol.status)}">${vol.status}</span></td>
                    <td style="text-align: right;">
                      <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn-icon btn-view-vol" title="View Profile" data-id="${vol.id}">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="btn-icon btn-edit-vol" title="Edit Volunteer" data-id="${vol.id}">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                        </button>
                        <button class="btn-icon btn-del-vol" title="Delete Volunteer" data-id="${vol.id}" style="color:var(--danger-500);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;

      this.#attachEvents();
    }

    #attachEvents() {
      const addBtn = this.#container.querySelector('#btn-add-volunteer');
      if (addBtn) addBtn.addEventListener('click', () => this.#openVolunteerFormModal());

      const searchInput = this.#container.querySelector('#vol-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.#currentFilters.search = e.target.value;
          this.render();
        });
      }

      const skillFilter = this.#container.querySelector('#vol-filter-skill');
      if (skillFilter) {
        skillFilter.addEventListener('change', (e) => {
          this.#currentFilters.skill = e.target.value;
          this.render();
        });
      }

      const availFilter = this.#container.querySelector('#vol-filter-avail');
      if (availFilter) {
        availFilter.addEventListener('change', (e) => {
          this.#currentFilters.availability = e.target.value;
          this.render();
        });
      }

      const statusFilter = this.#container.querySelector('#vol-filter-status');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          this.#currentFilters.status = e.target.value;
          this.render();
        });
      }

      const clearBtn = this.#container.querySelector('#btn-clear-vol-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.#currentFilters = { search: '', skill: '', availability: '', status: '' };
          this.render();
        });
      }

      this.#container.querySelectorAll('.btn-view-vol').forEach(btn => {
        btn.addEventListener('click', () => this.#openProfileModal(btn.dataset.id));
      });

      this.#container.querySelectorAll('.btn-edit-vol').forEach(btn => {
        btn.addEventListener('click', () => this.#openVolunteerFormModal(btn.dataset.id));
      });

      this.#container.querySelectorAll('.btn-del-vol').forEach(btn => {
        btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
      });
    }

    #openVolunteerFormModal(id = null) {
      const isEdit = !!id;
      const existing = isEdit ? volunteerService.getById(id) : null;
      const currentSkills = existing ? existing.skills : [];
      const currentAvail = existing ? existing.availability : [];

      const formHtml = `
        <form id="volunteer-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="vf-name">Full Name <span class="required">*</span></label>
            <input type="text" id="vf-name" class="form-control" placeholder="e.g. Aadhi Lakshmi S" value="${existing ? escapeHtml(existing.name) : ''}" required>
            <div class="form-error-msg" id="err-vf-name">Name is required.</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="vf-email">Email Address <span class="required">*</span></label>
              <input type="email" id="vf-email" class="form-control" placeholder="student@college.edu" value="${existing ? escapeHtml(existing.email) : ''}" required>
              <div class="form-error-msg" id="err-vf-email">Enter a valid email address.</div>
            </div>
            <div class="form-group">
              <label class="form-label" for="vf-phone">Phone (10 Digits) <span class="required">*</span></label>
              <input type="tel" id="vf-phone" class="form-control" placeholder="9876543210" maxlength="10" value="${existing ? escapeHtml(existing.phone) : ''}" required>
              <div class="form-error-msg" id="err-vf-phone">Enter a valid 10-digit phone number.</div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="vf-status">Status</label>
              <select id="vf-status" class="form-control">
                <option value="Active" ${(!existing || existing.status === 'Active') ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${existing && existing.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="vf-date">Joined Date</label>
              <input type="date" id="vf-date" class="form-control" value="${existing ? existing.joinedDate : new Date().toISOString().split('T')[0]}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Skills</label>
            <div class="skills-checkbox-grid">
              ${SKILL_OPTIONS.map(skill => `
                <label class="checkbox-label">
                  <input type="checkbox" name="skills" value="${escapeHtml(skill)}" ${currentSkills.includes(skill) ? 'checked' : ''}>
                  <span>${escapeHtml(skill)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Availability Schedules</label>
            <div class="skills-checkbox-grid">
              ${AVAILABILITY_OPTIONS.map(avail => `
                <label class="checkbox-label">
                  <input type="checkbox" name="availability" value="${escapeHtml(avail)}" ${currentAvail.includes(avail) ? 'checked' : ''}>
                  <span>${escapeHtml(avail)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </form>
      `;

      modal.open({
        title: isEdit ? 'Edit Volunteer Details' : 'Register New Volunteer',
        body: formHtml,
        buttons: [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => modal.close() },
          {
            label: isEdit ? 'Save Changes' : 'Register Volunteer',
            className: 'btn-primary',
            onClick: () => {
              const form = document.getElementById('volunteer-form');
              const name = form.querySelector('#vf-name').value.trim();
              const email = form.querySelector('#vf-email').value.trim();
              const phone = form.querySelector('#vf-phone').value.trim();
              const status = form.querySelector('#vf-status').value;
              const joinedDate = form.querySelector('#vf-date').value;
              const selectedSkills = Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
              const selectedAvail = Array.from(form.querySelectorAll('input[name="availability"]:checked')).map(cb => cb.value);

              let hasErrors = false;
              if (!isNonEmpty(name)) {
                form.querySelector('#err-vf-name').classList.add('visible');
                hasErrors = true;
              } else form.querySelector('#err-vf-name').classList.remove('visible');

              if (!isValidEmail(email)) {
                form.querySelector('#err-vf-email').classList.add('visible');
                hasErrors = true;
              } else form.querySelector('#err-vf-email').classList.remove('visible');

              if (!isValidPhone(phone)) {
                form.querySelector('#err-vf-phone').classList.add('visible');
                hasErrors = true;
              } else form.querySelector('#err-vf-phone').classList.remove('visible');

              if (hasErrors) return;

              try {
                if (isEdit) {
                  volunteerService.update(id, { name, email, phone, status, joinedDate, skills: selectedSkills, availability: selectedAvail });
                  toast.success(`Volunteer "${name}" updated successfully.`);
                } else {
                  volunteerService.create({ name, email, phone, status, joinedDate, skills: selectedSkills, availability: selectedAvail });
                  toast.success(`Volunteer "${name}" registered successfully.`);
                }
                modal.close();
                this.render();
              } catch (err) {
                toast.error(err.message);
              }
            }
          }
        ]
      });
    }

    #openProfileModal(id) {
      const vol = volunteerService.getById(id);
      if (!vol) return;
      const participation = assignmentService.getVolunteerParticipation(id);

      const bodyHtml = `
        <div style="margin-bottom: 1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.75rem;">
            <div>
              <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main);">${escapeHtml(vol.name)}</h3>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(vol.getRoleDescription())}</div>
              <div style="font-size: 0.8rem; color: var(--primary-500); margin-top: 2px; font-weight:500;">
                Polymorphic Summary: "${escapeHtml(vol.getSummary())}"
              </div>
            </div>
            <span class="badge ${getStatusBadgeClass(vol.status)}">${vol.status}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; background-color: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem;">
            <div><strong>Email:</strong> ${escapeHtml(vol.email)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(vol.phone)}</div>
            <div><strong>Member Since:</strong> ${formatDate(vol.joinedDate)}</div>
            <div><strong>Available:</strong> ${vol.availability.join(', ') || 'Flexible'}</div>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Registered Skills</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${vol.skills.length > 0
              ? vol.skills.map(s => `<span class="badge badge-skill">${escapeHtml(s)}</span>`).join('')
              : '<span style="font-size:0.8rem; color:var(--text-muted);">No specific skills recorded</span>'}
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700;">Participation Record</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Completed: <strong>${participation.completed}</strong> / Total: <strong>${participation.total}</strong>
            </span>
          </div>

          ${participation.assignments.length === 0 ? `
            <div style="padding: 1.5rem; text-align: center; background-color: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-muted);">
              No tasks assigned yet.
            </div>
          ` : `
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
              <table class="data-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th>Event / Activity</th>
                    <th>Task Title</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${participation.assignments.map(asg => `
                    <tr>
                      <td style="font-weight: 600;">${escapeHtml(asg.activityTitle)}</td>
                      <td>${escapeHtml(asg.taskTitle)}</td>
                      <td>${escapeHtml(asg.taskTimeSlot)}</td>
                      <td><span class="badge ${getStatusBadgeClass(asg.status)}">${asg.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

      modal.open({
        title: 'Volunteer Profile & History',
        body: bodyHtml,
        buttons: [{ label: 'Close', className: 'btn-secondary', onClick: () => modal.close() }]
      });
    }

    #confirmDelete(id) {
      const vol = volunteerService.getById(id);
      if (!vol) return;
      modal.confirm({
        title: 'Delete Volunteer',
        message: `Are you sure you want to remove "${vol.name}" from the system?`,
        confirmText: 'Delete Volunteer',
        onConfirm: () => {
          volunteerService.delete(id);
          toast.info(`Volunteer "${vol.name}" was removed.`);
          this.render();
        }
      });
    }
  }

  // 3. Activities View
  class ActivitiesView {
    #container;
    #filterCategory = '';
    #filterStatus = '';

    constructor(containerId = 'view-activities') {
      this.#container = document.getElementById(containerId);
    }

    render() {
      let activities = activityService.getAllActivities();
      if (this.#filterCategory) activities = activities.filter(a => a.category === this.#filterCategory);
      if (this.#filterStatus) activities = activities.filter(a => a.status === this.#filterStatus);

      this.#container.innerHTML = `
        <div class="section-header">
          <div>
            <h2 class="section-title">Campus Activities & Programs</h2>
            <p class="section-description">Organize events, allocate task requirements, and monitor volunteer fulfillment progress.</p>
          </div>
          <button class="btn btn-primary" id="btn-add-activity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Activity
          </button>
        </div>

        <div class="filter-bar">
          <select id="act-filter-cat" class="filter-select">
            <option value="">All Categories</option>
            <option value="College Event" ${this.#filterCategory === 'College Event' ? 'selected' : ''}>College Event</option>
            <option value="Community Program" ${this.#filterCategory === 'Community Program' ? 'selected' : ''}>Community Program</option>
            <option value="Workshop" ${this.#filterCategory === 'Workshop' ? 'selected' : ''}>Workshop</option>
          </select>

          <select id="act-filter-status" class="filter-select">
            <option value="">All Statuses</option>
            <option value="Upcoming" ${this.#filterStatus === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
            <option value="Ongoing" ${this.#filterStatus === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
            <option value="Completed" ${this.#filterStatus === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>

          ${(this.#filterCategory || this.#filterStatus) ? `
            <button class="btn btn-ghost btn-sm" id="btn-clear-act-filters">Clear Filters</button>
          ` : ''}
        </div>

        ${activities.length === 0 ? `
          <div class="empty-state">
            <h4 class="empty-state-title">No Activities Found</h4>
            <p class="empty-state-description">Plan your next college event by clicking "Create Activity".</p>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
            ${activities.map(act => {
              const stats = activityService.getActivitySlotStats(act.id);
              const tasks = activityService.getTasksForActivity(act.id);
              return `
                <div class="card card-hover" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                      <span class="badge badge-neutral">${escapeHtml(act.category)}</span>
                      <span class="badge ${getStatusBadgeClass(act.status)}">${act.status}</span>
                    </div>

                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.3;">
                      ${escapeHtml(act.title)}
                    </h3>

                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4;">
                      ${escapeHtml(act.description || 'No description provided.')}
                    </p>

                    <div style="background-color: var(--bg-subtle); padding: 0.75rem 0.9rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;">
                      <div><strong>Date:</strong> ${formatDate(act.date)}</div>
                      <div><strong>Venue:</strong> ${escapeHtml(act.venue)}</div>
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;">
                        <span>Volunteer Slots: <strong>${stats.filledSlots} / ${stats.totalSlots || act.requiredVolunteers}</strong></span>
                        <span style="font-weight: 700; color: var(--primary-500);">${stats.percentage}% Filled</span>
                      </div>
                      <div class="progress-container">
                        <div class="progress-bar ${stats.percentage === 100 ? 'complete' : ''}" style="width: ${stats.percentage}%;"></div>
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                        ${tasks.length} task(s) configured
                      </div>
                    </div>
                  </div>

                  <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn btn-secondary btn-sm btn-view-act" data-id="${act.id}">View Tasks & Details</button>
                    <div style="display: flex; gap: 0.35rem;">
                      <button class="btn-icon btn-edit-act" title="Edit Activity" data-id="${act.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                      </button>
                      <button class="btn-icon btn-del-act" title="Delete Activity" data-id="${act.id}" style="color:var(--danger-500);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;

      this.#attachEvents();
    }

    #attachEvents() {
      const addBtn = this.#container.querySelector('#btn-add-activity');
      if (addBtn) addBtn.addEventListener('click', () => this.#openActivityFormModal());

      const catFilter = this.#container.querySelector('#act-filter-cat');
      if (catFilter) {
        catFilter.addEventListener('change', (e) => {
          this.#filterCategory = e.target.value;
          this.render();
        });
      }

      const statusFilter = this.#container.querySelector('#act-filter-status');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          this.#filterStatus = e.target.value;
          this.render();
        });
      }

      const clearBtn = this.#container.querySelector('#btn-clear-act-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.#filterCategory = '';
          this.#filterStatus = '';
          this.render();
        });
      }

      this.#container.querySelectorAll('.btn-view-act').forEach(btn => {
        btn.addEventListener('click', () => this.#openActivityDetailsModal(btn.dataset.id));
      });

      this.#container.querySelectorAll('.btn-edit-act').forEach(btn => {
        btn.addEventListener('click', () => this.#openActivityFormModal(btn.dataset.id));
      });

      this.#container.querySelectorAll('.btn-del-act').forEach(btn => {
        btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
      });
    }

    #openActivityFormModal(id = null) {
      const isEdit = !!id;
      const existing = isEdit ? activityService.getActivityById(id) : null;

      const formHtml = `
        <form id="activity-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="af-title">Event Title <span class="required">*</span></label>
            <input type="text" id="af-title" class="form-control" placeholder="e.g. Annual Tech Symposium" value="${existing ? escapeHtml(existing.title) : ''}" required>
            <div class="form-error-msg" id="err-af-title">Title is required.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="af-desc">Description</label>
            <textarea id="af-desc" class="form-control" rows="3" placeholder="Brief outline...">${existing ? escapeHtml(existing.description) : ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="af-date">Date <span class="required">*</span></label>
              <input type="date" id="af-date" class="form-control" value="${existing ? existing.date : new Date().toISOString().split('T')[0]}" required>
              <div class="form-error-msg" id="err-af-date">Date is required.</div>
            </div>
            <div class="form-group">
              <label class="form-label" for="af-venue">Venue <span class="required">*</span></label>
              <input type="text" id="af-venue" class="form-control" placeholder="Seminar Hall 1" value="${existing ? escapeHtml(existing.venue) : ''}" required>
              <div class="form-error-msg" id="err-af-venue">Venue is required.</div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="af-category">Category</label>
              <select id="af-category" class="form-control">
                <option value="College Event" ${(!existing || existing.category === 'College Event') ? 'selected' : ''}>College Event</option>
                <option value="Community Program" ${existing && existing.category === 'Community Program' ? 'selected' : ''}>Community Program</option>
                <option value="Workshop" ${existing && existing.category === 'Workshop' ? 'selected' : ''}>Workshop</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="af-status">Status</label>
              <select id="af-status" class="form-control">
                <option value="Upcoming" ${(!existing || existing.status === 'Upcoming') ? 'selected' : ''}>Upcoming</option>
                <option value="Ongoing" ${existing && existing.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                <option value="Completed" ${existing && existing.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="af-target">Target Volunteers</label>
            <input type="number" id="af-target" class="form-control" min="1" value="${existing ? existing.requiredVolunteers : 5}">
          </div>
        </form>
      `;

      modal.open({
        title: isEdit ? 'Edit Activity Details' : 'Create New Activity',
        body: formHtml,
        buttons: [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => modal.close() },
          {
            label: isEdit ? 'Save Changes' : 'Create Activity',
            className: 'btn-primary',
            onClick: () => {
              const form = document.getElementById('activity-form');
              const title = form.querySelector('#af-title').value.trim();
              const description = form.querySelector('#af-desc').value.trim();
              const date = form.querySelector('#af-date').value;
              const venue = form.querySelector('#af-venue').value.trim();
              const category = form.querySelector('#af-category').value;
              const status = form.querySelector('#af-status').value;
              const requiredVolunteers = form.querySelector('#af-target').value;

              let hasErrors = false;
              if (!isNonEmpty(title)) { form.querySelector('#err-af-title').classList.add('visible'); hasErrors = true; }
              if (!isNonEmpty(venue)) { form.querySelector('#err-af-venue').classList.add('visible'); hasErrors = true; }
              if (!date) { form.querySelector('#err-af-date').classList.add('visible'); hasErrors = true; }

              if (hasErrors) return;

              try {
                if (isEdit) {
                  activityService.updateActivity(id, { title, description, date, venue, category, status, requiredVolunteers: parseInt(requiredVolunteers, 10) || 5 });
                  toast.success(`Activity "${title}" updated.`);
                } else {
                  activityService.createActivity({ title, description, date, venue, category, status, requiredVolunteers: parseInt(requiredVolunteers, 10) || 5 });
                  toast.success(`Activity "${title}" created.`);
                }
                modal.close();
                this.render();
              } catch (err) {
                toast.error(err.message);
              }
            }
          }
        ]
      });
    }

    #openActivityDetailsModal(id) {
      const act = activityService.getActivityById(id);
      if (!act) return;
      const tasks = activityService.getTasksForActivity(id);
      const stats = activityService.getActivitySlotStats(id);

      const bodyHtml = `
        <div style="margin-bottom: 1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 700;">${escapeHtml(act.title)}</h3>
              <span class="badge badge-neutral" style="margin-top: 4px;">${escapeHtml(act.category)}</span>
            </div>
            <span class="badge ${getStatusBadgeClass(act.status)}">${act.status}</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 1rem; line-height: 1.4;">
            ${escapeHtml(act.description || 'No description provided.')}
          </p>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1rem;">
            <div><strong>Date:</strong> ${formatDate(act.date)}</div>
            <div><strong>Venue:</strong> ${escapeHtml(act.venue)}</div>
            <div><strong>Total Task Slots:</strong> ${stats.totalSlots}</div>
            <div><strong>Filled:</strong> ${stats.filledSlots} (${stats.percentage}%)</div>
          </div>

          <div class="progress-container" style="margin-bottom: 1.5rem;">
            <div class="progress-bar ${stats.percentage === 100 ? 'complete' : ''}" style="width: ${stats.percentage}%;"></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700;">Activity Tasks & Volunteers</h4>
            <a href="#tasks" class="btn btn-secondary btn-sm" id="btn-goto-tasks">Manage Tasks &rarr;</a>
          </div>

          ${tasks.length === 0 ? `
            <div style="text-align: center; padding: 1.5rem; background: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-muted);">
              No tasks have been created for this activity yet.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 240px; overflow-y: auto;">
              ${tasks.map(task => {
                const taskAssignments = assignmentService.getAssignmentsForTask(task.id, true);
                const assignedVolunteers = taskAssignments.map(asg => {
                  const vol = volunteerService.getById(asg.volunteerId);
                  return vol ? vol.name : 'Unknown';
                });

                return `
                  <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; background: var(--bg-surface);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                      <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(task.title)}</div>
                      <span class="badge ${taskAssignments.length >= task.slots ? 'badge-completed' : 'badge-upcoming'}">
                        ${taskAssignments.length} / ${task.slots} Filled
                      </span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                      <span>Skill: <strong>${escapeHtml(task.requiredSkill)}</strong></span>
                      <span>Time: <strong>${escapeHtml(task.timeSlot)}</strong></span>
                    </div>
                    <div style="font-size: 0.75rem;">
                      <strong>Assigned:</strong> ${assignedVolunteers.length > 0
                        ? assignedVolunteers.map(n => `<span style="display:inline-block; background:var(--bg-subtle); padding:2px 6px; border-radius:4px; margin-right:4px;">${escapeHtml(n)}</span>`).join('')
                        : '<span style="color:var(--text-subtle);">None yet</span>'
                      }
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      modal.open({
        title: 'Activity Overview',
        body: bodyHtml,
        buttons: [{ label: 'Close', className: 'btn-secondary', onClick: () => modal.close() }]
      });

      const gotoBtn = document.getElementById('btn-goto-tasks');
      if (gotoBtn) gotoBtn.addEventListener('click', () => modal.close());
    }

    #confirmDelete(id) {
      const act = activityService.getActivityById(id);
      if (!act) return;
      modal.confirm({
        title: 'Delete Activity',
        message: `Are you sure you want to delete "${act.title}"? This will also remove its associated tasks.`,
        confirmText: 'Delete Activity',
        onConfirm: () => {
          activityService.deleteActivity(id);
          toast.info(`Activity "${act.title}" was deleted.`);
          this.render();
        }
      });
    }
  }

  // 4. Tasks View
  class TasksView {
    #container;
    #filterActivity = '';
    #filterSkill = '';

    constructor(containerId = 'view-tasks') {
      this.#container = document.getElementById(containerId);
    }

    render() {
      const activities = activityService.getAllActivities();
      let tasks = activityService.getAllTasks();

      if (this.#filterActivity) tasks = tasks.filter(t => t.activityId === this.#filterActivity);
      if (this.#filterSkill) tasks = tasks.filter(t => t.requiredSkill === this.#filterSkill);

      this.#container.innerHTML = `
        <div class="section-header">
          <div>
            <h2 class="section-title">Event Tasks Management</h2>
            <p class="section-description">Define work packages, specify required skill sets, and allocate volunteer slots per activity.</p>
          </div>
          <button class="btn btn-primary" id="btn-add-task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Task
          </button>
        </div>

        <div class="filter-bar">
          <select id="task-filter-act" class="filter-select">
            <option value="">All Activities</option>
            ${activities.map(a => `<option value="${a.id}" ${this.#filterActivity === a.id ? 'selected' : ''}>${escapeHtml(a.title)}</option>`).join('')}
          </select>

          <select id="task-filter-skill" class="filter-select">
            <option value="">All Skills</option>
            ${SKILL_OPTIONS.map(s => `<option value="${escapeHtml(s)}" ${this.#filterSkill === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
          </select>

          ${(this.#filterActivity || this.#filterSkill) ? `<button class="btn btn-ghost btn-sm" id="btn-clear-task-filters">Clear Filters</button>` : ''}
        </div>

        ${tasks.length === 0 ? `
          <div class="empty-state">
            <h4 class="empty-state-title">No Tasks Found</h4>
            <p class="empty-state-description">Add responsibilities for volunteers by clicking "Add New Task".</p>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Task Details</th>
                  <th>Associated Event</th>
                  <th>Required Skill</th>
                  <th>Time Slot</th>
                  <th>Slot Allocation</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.map(task => {
                  const act = activityService.getActivityById(task.activityId);
                  const assignments = assignmentService.getAssignmentsForTask(task.id, true);
                  const isFull = assignments.length >= task.slots;

                  return `
                    <tr>
                      <td>
                        <div style="font-weight: 600;">${escapeHtml(task.title)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(task.description || 'No description')}</div>
                      </td>
                      <td><span style="font-weight: 500;">${act ? escapeHtml(act.title) : 'Unknown Activity'}</span></td>
                      <td><span class="badge badge-skill">${escapeHtml(task.requiredSkill)}</span></td>
                      <td><div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(task.timeSlot)}</div></td>
                      <td style="min-width: 140px;">
                        <div style="display:flex; justify-content:space-between; font-size: 0.75rem; margin-bottom: 3px;">
                          <span>${assignments.length} of ${task.slots} Filled</span>
                          <span style="font-weight:700;">${Math.round((assignments.length / task.slots) * 100)}%</span>
                        </div>
                        <div class="progress-container">
                          <div class="progress-bar ${isFull ? 'complete' : ''}" style="width: ${Math.min(100, Math.round((assignments.length / task.slots) * 100))}%;"></div>
                        </div>
                      </td>
                      <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                          <button class="btn btn-secondary btn-sm btn-suggest-task" data-id="${task.id}" title="Find matching volunteers">Suggest</button>
                          <button class="btn-icon btn-edit-task" data-id="${task.id}" title="Edit Task">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                          </button>
                          <button class="btn-icon btn-del-task" data-id="${task.id}" title="Delete Task" style="color:var(--danger-500);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;

      this.#attachEvents();
    }

    #attachEvents() {
      const addBtn = this.#container.querySelector('#btn-add-task');
      if (addBtn) addBtn.addEventListener('click', () => this.#openTaskFormModal());

      const actFilter = this.#container.querySelector('#task-filter-act');
      if (actFilter) {
        actFilter.addEventListener('change', (e) => {
          this.#filterActivity = e.target.value;
          this.render();
        });
      }

      const skillFilter = this.#container.querySelector('#task-filter-skill');
      if (skillFilter) {
        skillFilter.addEventListener('change', (e) => {
          this.#filterSkill = e.target.value;
          this.render();
        });
      }

      const clearBtn = this.#container.querySelector('#btn-clear-task-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.#filterActivity = '';
          this.#filterSkill = '';
          this.render();
        });
      }

      this.#container.querySelectorAll('.btn-suggest-task').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.hash = `#assignments?suggestTaskId=${btn.dataset.id}`;
        });
      });

      this.#container.querySelectorAll('.btn-edit-task').forEach(btn => {
        btn.addEventListener('click', () => this.#openTaskFormModal(btn.dataset.id));
      });

      this.#container.querySelectorAll('.btn-del-task').forEach(btn => {
        btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
      });
    }

    #openTaskFormModal(id = null) {
      const isEdit = !!id;
      const existing = isEdit ? activityService.getTaskById(id) : null;
      const activities = activityService.getAllActivities();

      if (activities.length === 0) {
        toast.warning('Please create at least one activity before adding tasks.');
        return;
      }

      const formHtml = `
        <form id="task-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="tf-act">Select Activity <span class="required">*</span></label>
            <select id="tf-act" class="form-control" ${isEdit ? 'disabled' : ''} required>
              ${activities.map(a => `<option value="${a.id}" ${existing && existing.activityId === a.id ? 'selected' : ''}>${escapeHtml(a.title)} (${formatDate(a.date)})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="tf-title">Task Title <span class="required">*</span></label>
            <input type="text" id="tf-title" class="form-control" placeholder="e.g. Helpdesk Registration" value="${existing ? escapeHtml(existing.title) : ''}" required>
            <div class="form-error-msg" id="err-tf-title">Task title is required.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="tf-desc">Description</label>
            <textarea id="tf-desc" class="form-control" rows="2" placeholder="Brief explanation...">${existing ? escapeHtml(existing.description) : ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="tf-skill">Required Skill</label>
              <select id="tf-skill" class="form-control">
                ${SKILL_OPTIONS.map(s => `<option value="${escapeHtml(s)}" ${existing && existing.requiredSkill === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="tf-slots">Volunteer Slots (Capacity) <span class="required">*</span></label>
              <input type="number" id="tf-slots" class="form-control" min="1" max="50" value="${existing ? existing.slots : 2}" required>
              <div class="form-error-msg" id="err-tf-slots">Slots must be at least 1.</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="tf-time">Time Slot <span class="required">*</span></label>
            <select id="tf-time" class="form-control">
              ${TIME_SLOT_OPTIONS.map(t => `<option value="${escapeHtml(t)}" ${existing && existing.timeSlot === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
            </select>
          </div>
        </form>
      `;

      modal.open({
        title: isEdit ? 'Edit Task' : 'Add New Task',
        body: formHtml,
        buttons: [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => modal.close() },
          {
            label: isEdit ? 'Save Changes' : 'Create Task',
            className: 'btn-primary',
            onClick: () => {
              const form = document.getElementById('task-form');
              const activityId = form.querySelector('#tf-act').value;
              const title = form.querySelector('#tf-title').value.trim();
              const description = form.querySelector('#tf-desc').value.trim();
              const requiredSkill = form.querySelector('#tf-skill').value;
              const slotsVal = form.querySelector('#tf-slots').value;
              const timeSlot = form.querySelector('#tf-time').value;

              let hasErrors = false;
              if (!isNonEmpty(title)) { form.querySelector('#err-tf-title').classList.add('visible'); hasErrors = true; }
              if (!isPositiveNumber(slotsVal)) { form.querySelector('#err-tf-slots').classList.add('visible'); hasErrors = true; }
              if (hasErrors) return;

              try {
                if (isEdit) {
                  activityService.updateTask(id, { title, description, requiredSkill, slots: parseInt(slotsVal, 10), timeSlot });
                  toast.success(`Task "${title}" updated.`);
                } else {
                  activityService.createTask({ activityId, title, description, requiredSkill, slots: parseInt(slotsVal, 10), timeSlot });
                  toast.success(`Task "${title}" created.`);
                }
                modal.close();
                this.render();
              } catch (err) {
                toast.error(err.message);
              }
            }
          }
        ]
      });
    }

    #confirmDelete(id) {
      const task = activityService.getTaskById(id);
      if (!task) return;
      modal.confirm({
        title: 'Delete Task',
        message: `Are you sure you want to delete task "${task.title}"?`,
        confirmText: 'Delete Task',
        onConfirm: () => {
          activityService.deleteTask(id);
          toast.info(`Task "${task.title}" deleted.`);
          this.render();
        }
      });
    }
  }

  // 5. Assignments View
  class AssignmentsView {
    #container;
    #filterActivity = '';
    #filterStatus = '';

    constructor(containerId = 'view-assignments') {
      this.#container = document.getElementById(containerId);
    }

    render(suggestTaskId = null) {
      const activities = activityService.getAllActivities();
      let assignments = assignmentService.getAll();

      if (this.#filterActivity) assignments = assignments.filter(a => a.activityId === this.#filterActivity);
      if (this.#filterStatus) assignments = assignments.filter(a => a.status === this.#filterStatus);

      this.#container.innerHTML = `
        <div class="section-header">
          <div>
            <h2 class="section-title">Volunteer Task Assignments</h2>
            <p class="section-description">Match volunteers to event tasks, smart ranking suggestions, and conflict prevention safeguards.</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-secondary" id="btn-suggest-modal-trigger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
              Suggest Volunteers
            </button>
            <button class="btn btn-primary" id="btn-create-assignment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Assignment
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <select id="asg-filter-act" class="filter-select">
            <option value="">All Activities</option>
            ${activities.map(a => `<option value="${a.id}" ${this.#filterActivity === a.id ? 'selected' : ''}>${escapeHtml(a.title)}</option>`).join('')}
          </select>

          <select id="asg-filter-status" class="filter-select">
            <option value="">All Statuses</option>
            <option value="Assigned" ${this.#filterStatus === 'Assigned' ? 'selected' : ''}>Assigned (Active)</option>
            <option value="Completed" ${this.#filterStatus === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${this.#filterStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>

          ${(this.#filterActivity || this.#filterStatus) ? `<button class="btn btn-ghost btn-sm" id="btn-clear-asg-filters">Clear Filters</button>` : ''}
        </div>

        ${assignments.length === 0 ? `
          <div class="empty-state">
            <h4 class="empty-state-title">No Assignments Found</h4>
            <p class="empty-state-description">Assign volunteers to pending tasks to fill required event slots.</p>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Event / Activity</th>
                  <th>Assigned Task</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th style="text-align: right;">Update Status / Action</th>
                </tr>
              </thead>
              <tbody>
                ${assignments.map(asg => {
                  const vol = volunteerService.getById(asg.volunteerId);
                  const act = activityService.getActivityById(asg.activityId);
                  const task = activityService.getTaskById(asg.taskId);

                  return `
                    <tr>
                      <td>
                        <div style="font-weight: 600;">${vol ? escapeHtml(vol.name) : 'Unknown Volunteer'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${vol ? escapeHtml(vol.phone) : ''}</div>
                      </td>
                      <td>
                        <div style="font-weight: 500;">${act ? escapeHtml(act.title) : 'Unknown Activity'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${act ? formatDate(act.date) : ''}</div>
                      </td>
                      <td>
                        <div>${task ? escapeHtml(task.title) : 'Unknown Task'}</div>
                        <div style="font-size: 0.75rem; color: var(--accent-500); font-weight: 500;">
                          Req: ${task ? escapeHtml(task.requiredSkill) : 'General'}
                        </div>
                      </td>
                      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${task ? escapeHtml(task.timeSlot) : 'N/A'}</span></td>
                      <td><span class="badge ${getStatusBadgeClass(asg.status)}">${asg.status}</span></td>
                      <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                          ${asg.status === 'Assigned' ? `
                            <button class="btn btn-sm btn-secondary btn-mark-complete" data-id="${asg.id}">Done</button>
                            <button class="btn btn-sm btn-ghost btn-mark-cancel" data-id="${asg.id}" style="color:var(--danger-500);">Cancel</button>
                          ` : `<span style="font-size:0.75rem; color:var(--text-subtle); margin-right:4px;">Closed</span>`}
                          <button class="btn-icon btn-del-asg" data-id="${asg.id}" title="Remove Record">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;

      this.#attachEvents();
      if (suggestTaskId) this.openSuggestModal(suggestTaskId);
    }

    #attachEvents() {
      const createBtn = this.#container.querySelector('#btn-create-assignment');
      if (createBtn) createBtn.addEventListener('click', () => this.#openAssignModal());

      const suggestTrigger = this.#container.querySelector('#btn-suggest-modal-trigger');
      if (suggestTrigger) suggestTrigger.addEventListener('click', () => this.openSuggestModal());

      const actFilter = this.#container.querySelector('#asg-filter-act');
      if (actFilter) {
        actFilter.addEventListener('change', (e) => {
          this.#filterActivity = e.target.value;
          this.render();
        });
      }

      const statusFilter = this.#container.querySelector('#asg-filter-status');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          this.#filterStatus = e.target.value;
          this.render();
        });
      }

      const clearBtn = this.#container.querySelector('#btn-clear-asg-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.#filterActivity = '';
          this.#filterStatus = '';
          this.render();
        });
      }

      this.#container.querySelectorAll('.btn-mark-complete').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            assignmentService.updateStatus(btn.dataset.id, 'Completed');
            toast.success('Assignment marked as Completed!');
            this.render();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

      this.#container.querySelectorAll('.btn-mark-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            assignmentService.updateStatus(btn.dataset.id, 'Cancelled');
            toast.info('Assignment was Cancelled.');
            this.render();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

      this.#container.querySelectorAll('.btn-del-asg').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.confirm({
            title: 'Delete Assignment Record',
            message: 'Are you sure you want to permanently delete this assignment record?',
            confirmText: 'Delete Record',
            onConfirm: () => {
              assignmentService.delete(btn.dataset.id);
              toast.info('Assignment record deleted.');
              this.render();
            }
          });
        });
      });
    }

    #openAssignModal() {
      const volunteers = volunteerService.getAll().filter(v => v.status === 'Active');
      const tasks = activityService.getAllTasks();

      if (volunteers.length === 0) {
        toast.warning('No active volunteers available to assign.');
        return;
      }
      if (tasks.length === 0) {
        toast.warning('No tasks found. Please create a task first.');
        return;
      }

      const formHtml = `
        <form id="assign-form">
          <div class="form-group">
            <label class="form-label" for="asg-task-select">Select Task <span class="required">*</span></label>
            <select id="asg-task-select" class="form-control" required>
              ${tasks.map(t => {
                const act = activityService.getActivityById(t.activityId);
                const asgs = assignmentService.getAssignmentsForTask(t.id, true);
                const isFull = asgs.length >= t.slots;
                return `
                  <option value="${t.id}" ${isFull ? 'disabled' : ''}>
                    ${escapeHtml(t.title)} (${act ? escapeHtml(act.title) : ''}) [${asgs.length}/${t.slots} slots] ${isFull ? '- FULL' : ''}
                  </option>
                `;
              }).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="asg-vol-select">Select Active Volunteer <span class="required">*</span></label>
            <select id="asg-vol-select" class="form-control" required>
              ${volunteers.map(v => `
                <option value="${v.id}">
                  ${escapeHtml(v.name)} - Skills: ${v.skills.slice(0, 2).join(', ') || 'General'}
                </option>
              `).join('')}
            </select>
          </div>

          <div style="background-color: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-muted);">
            <strong>Validation Rules Enforced:</strong>
            <ul style="margin-left: 1.25rem; margin-top: 4px;">
              <li>Duplicate task assignments are strictly blocked</li>
              <li>Exceeding task slot limit is blocked</li>
              <li>Overlapping schedule double-booking is blocked</li>
            </ul>
          </div>
        </form>
      `;

      modal.open({
        title: 'Manual Task Assignment',
        body: formHtml,
        buttons: [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => modal.close() },
          {
            label: 'Assign Volunteer',
            className: 'btn-primary',
            onClick: () => {
              const form = document.getElementById('assign-form');
              const taskId = form.querySelector('#asg-task-select').value;
              const volunteerId = form.querySelector('#asg-vol-select').value;

              try {
                assignmentService.createAssignment({ volunteerId, taskId });
                const vol = volunteerService.getById(volunteerId);
                const task = activityService.getTaskById(taskId);
                toast.success(`Successfully assigned ${vol ? vol.name : 'volunteer'} to "${task ? task.title : 'task'}".`);
                modal.close();
                this.render();
              } catch (err) {
                toast.error(err.message);
              }
            }
          }
        ]
      });
    }

    openSuggestModal(initialTaskId = null) {
      const tasks = activityService.getAllTasks();
      if (tasks.length === 0) {
        toast.warning('No tasks available for suggestion.');
        return;
      }

      const selectedTaskId = initialTaskId || tasks[0].id;

      const renderModalContent = (taskId) => {
        const task = activityService.getTaskById(taskId);
        const act = activityService.getActivityById(task ? task.activityId : '');
        const suggestions = assignmentService.suggestVolunteersForTask(taskId);
        const existingAssignments = assignmentService.getAssignmentsForTask(taskId, true);
        const isTaskFull = existingAssignments.length >= (task ? task.slots : 0);

        const content = document.createElement('div');
        content.innerHTML = `
          <div style="margin-bottom: 1.25rem;">
            <label class="form-label" for="suggest-task-selector">Select Task to Match Volunteers:</label>
            <select id="suggest-task-selector" class="form-control" style="margin-bottom: 0.75rem;">
              ${tasks.map(t => {
                const a = activityService.getActivityById(t.activityId);
                return `<option value="${t.id}" ${t.id === taskId ? 'selected' : ''}>${escapeHtml(t.title)} (${a ? escapeHtml(a.title) : ''})</option>`;
              }).join('')}
            </select>

            ${task ? `
              <div style="background-color: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.825rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div><strong>Event:</strong> ${act ? escapeHtml(act.title) : ''}</div>
                <div><strong>Date:</strong> ${act ? formatDate(act.date) : ''}</div>
                <div><strong>Required Skill:</strong> <span class="badge badge-skill">${escapeHtml(task.requiredSkill)}</span></div>
                <div><strong>Time Slot:</strong> ${escapeHtml(task.timeSlot)}</div>
                <div><strong>Slots Available:</strong> ${Math.max(0, task.slots - existingAssignments.length)} of ${task.slots}</div>
                <div><strong>Current Status:</strong> ${isTaskFull ? '<span style="color:var(--danger-500); font-weight:700;">Task Full</span>' : '<span style="color:var(--success-500); font-weight:700;">Slots Open</span>'}</div>
              </div>
            ` : ''}
          </div>

          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">
            Ranked Volunteer Recommendations (${suggestions.length} candidates)
          </h4>

          ${suggestions.length === 0 ? `
            <div style="text-align: center; padding: 1.5rem; background-color: var(--bg-subtle); border-radius: var(--radius-md); color: var(--text-muted); font-size: 0.85rem;">
              No suitable unassigned volunteers found without schedule conflicts.
            </div>
          ` : `
            <div style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.65rem;">
              ${suggestions.map(({ volunteer, score, reasons }) => `
                <div class="suggestion-card">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 3px;">
                      <span style="font-weight: 700; color: var(--text-main);">${escapeHtml(volunteer.name)}</span>
                      <span class="score-badge">Match: ${score} pts</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 3px;">
                      Skills: ${volunteer.skills.join(', ') || 'General'}
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                      ${reasons.map(r => `<span style="font-size: 0.7rem; background: var(--bg-surface); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border-color);">${escapeHtml(r)}</span>`).join('')}
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm btn-quick-assign-vol" data-vol-id="${volunteer.id}" data-task-id="${taskId}" ${isTaskFull ? 'disabled' : ''}>
                    Assign
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        `;

        const selector = content.querySelector('#suggest-task-selector');
        if (selector) {
          selector.addEventListener('change', (e) => renderModalContent(e.target.value));
        }

        content.querySelectorAll('.btn-quick-assign-vol').forEach(btn => {
          btn.addEventListener('click', () => {
            try {
              assignmentService.createAssignment({ volunteerId: btn.dataset.volId, taskId: btn.dataset.taskId });
              const vol = volunteerService.getById(btn.dataset.volId);
              toast.success(`Assigned ${vol ? vol.name : 'volunteer'} to task!`);
              modal.close();
              this.render();
            } catch (err) {
              toast.error(err.message);
            }
          });
        });

        modal.open({
          title: 'Smart Volunteer Recommendations',
          body: content,
          buttons: [{ label: 'Close', className: 'btn-secondary', onClick: () => modal.close() }]
        });
      };

      renderModalContent(selectedTaskId);
    }
  }

  // 6. Reports View
  class ReportsView {
    #container;

    constructor(containerId = 'view-reports') {
      this.#container = document.getElementById(containerId);
    }

    render() {
      const volunteers = volunteerService.getAll();
      const activities = activityService.getAllActivities();
      const tasks = activityService.getAllTasks();
      const assignments = assignmentService.getAll();

      const activeVols = volunteers.filter(v => v.status === 'Active').length;
      const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
      const completionRate = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

      this.#container.innerHTML = `
        <div class="section-header">
          <div>
            <h2 class="section-title">Reports & Data Analytics</h2>
            <p class="section-description">Export data to CSV spreadsheets, generate print-friendly reports, and manage system database records.</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-secondary" id="btn-print-report">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print Report
            </button>
            <button class="btn btn-danger" id="btn-reset-demo-data">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              Reset Demo Data
            </button>
          </div>
        </div>

        <div class="cards-grid" style="margin-bottom: 2rem;">
          <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                <div class="stat-icon teal" style="width:40px;height:40px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                </div>
                <h3 style="font-size:1.1rem; font-weight:700;">Volunteers Data</h3>
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
                Export all registered student volunteers with contact info, skills, and availability schedules.
              </p>
              <div style="font-size:0.8rem; color:var(--text-main); margin-bottom:1rem;">
                Total Records: <strong>${volunteers.length}</strong> (${activeVols} active)
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-export-volunteers" style="width:100%;">
              Download Volunteers CSV
            </button>
          </div>

          <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                <div class="stat-icon indigo" style="width:40px;height:40px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line></svg>
                </div>
                <h3 style="font-size:1.1rem; font-weight:700;">Activities & Events</h3>
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
                Export all college events, workshops, dates, venues, categories, and required volunteers.
              </p>
              <div style="font-size:0.8rem; color:var(--text-main); margin-bottom:1rem;">
                Total Activities: <strong>${activities.length}</strong> (${tasks.length} tasks)
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-export-activities" style="width:100%;">
              Download Activities CSV
            </button>
          </div>

          <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                <div class="stat-icon emerald" style="width:40px;height:40px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h3 style="font-size:1.1rem; font-weight:700;">Assignments & Audit</h3>
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
                Export full task allocation history, status tracking, timestamps, and volunteer participation.
              </p>
              <div style="font-size:0.8rem; color:var(--text-main); margin-bottom:1rem;">
                Total Allocations: <strong>${assignments.length}</strong> (${completionRate}% completed)
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-export-assignments" style="width:100%;">
              Download Assignments CSV
            </button>
          </div>
        </div>

        <div class="card" style="padding:1.5rem;">
          <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.5rem;">System Summary Snapshot</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;">
            Consolidated activity status and volunteer participation metrics.
          </p>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event / Program</th>
                  <th>Date & Venue</th>
                  <th>Category</th>
                  <th>Tasks Count</th>
                  <th>Allocated / Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${activities.map(act => {
                  const actTasks = activityService.getTasksForActivity(act.id);
                  const stats = activityService.getActivitySlotStats(act.id);
                  return `
                    <tr>
                      <td style="font-weight:600;">${act.title}</td>
                      <td>${formatDate(act.date)} &bull; ${act.venue}</td>
                      <td>${act.category}</td>
                      <td>${actTasks.length} tasks</td>
                      <td>${stats.filledSlots} of ${stats.totalSlots || act.requiredVolunteers} slots (${stats.percentage}%)</td>
                      <td><strong>${act.status}</strong></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.#attachEvents();
    }

    #attachEvents() {
      const printBtn = this.#container.querySelector('#btn-print-report');
      if (printBtn) printBtn.addEventListener('click', () => window.print());

      const resetBtn = this.#container.querySelector('#btn-reset-demo-data');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          modal.confirm({
            title: 'Reset Demo Data',
            message: 'This will reset all volunteers, activities, tasks, and assignments back to the initial sample college dataset. Proceed?',
            confirmText: 'Reset Everything',
            onConfirm: () => {
              volunteerService.resetToDefault();
              activityService.resetToDefault();
              assignmentService.resetToDefault();
              toast.success('System demo dataset has been reloaded!');
              this.render();
            }
          });
        });
      }

      const exportVolBtn = this.#container.querySelector('#btn-export-volunteers');
      if (exportVolBtn) {
        exportVolBtn.addEventListener('click', () => {
          const volunteers = volunteerService.getAll().map(v => v.toJSON());
          exportToCsv(
            volunteers,
            [
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'status', label: 'Status' },
              { key: 'joinedDate', label: 'Joined Date' },
              { key: 'skills', label: 'Skills' },
              { key: 'availability', label: 'Availability' }
            ],
            'Volunteers_Report.csv'
          );
          toast.success('Volunteers CSV downloaded successfully.');
        });
      }

      const exportActBtn = this.#container.querySelector('#btn-export-activities');
      if (exportActBtn) {
        exportActBtn.addEventListener('click', () => {
          const activities = activityService.getAllActivities().map(a => a.toJSON());
          exportToCsv(
            activities,
            [
              { key: 'id', label: 'Activity ID' },
              { key: 'title', label: 'Title' },
              { key: 'category', label: 'Category' },
              { key: 'date', label: 'Date' },
              { key: 'venue', label: 'Venue' },
              { key: 'requiredVolunteers', label: 'Required Volunteers' },
              { key: 'status', label: 'Status' },
              { key: 'description', label: 'Description' }
            ],
            'Activities_Report.csv'
          );
          toast.success('Activities CSV downloaded successfully.');
        });
      }

      const exportAsgBtn = this.#container.querySelector('#btn-export-assignments');
      if (exportAsgBtn) {
        exportAsgBtn.addEventListener('click', () => {
          const assignments = assignmentService.getAll();
          const enriched = assignments.map(a => {
            const vol = volunteerService.getById(a.volunteerId);
            const act = activityService.getActivityById(a.activityId);
            const task = activityService.getTaskById(a.taskId);
            return {
              id: a.id,
              volunteerName: vol ? vol.name : a.volunteerId,
              volunteerEmail: vol ? vol.email : '',
              activityTitle: act ? act.title : a.activityId,
              activityDate: act ? act.date : '',
              taskTitle: task ? task.title : a.taskId,
              requiredSkill: task ? task.requiredSkill : '',
              timeSlot: task ? task.timeSlot : '',
              status: a.status,
              assignedDate: a.assignedDate
            };
          });

          exportToCsv(
            enriched,
            [
              { key: 'id', label: 'Assignment ID' },
              { key: 'volunteerName', label: 'Volunteer Name' },
              { key: 'volunteerEmail', label: 'Volunteer Email' },
              { key: 'activityTitle', label: 'Event / Activity' },
              { key: 'activityDate', label: 'Event Date' },
              { key: 'taskTitle', label: 'Task' },
              { key: 'requiredSkill', label: 'Skill' },
              { key: 'timeSlot', label: 'Time Slot' },
              { key: 'status', label: 'Status' },
              { key: 'assignedDate', label: 'Assigned Date' }
            ],
            'Assignments_Report.csv'
          );
          toast.success('Assignments CSV downloaded successfully.');
        });
      }
    }
  }

  /* ==========================================================================
     SECTION 7: APPLICATION CONTROLLER & ROUTER
     ========================================================================== */

  class App {
    #views = {};
    #currentRoute = 'dashboard';

    init() {
      this.#initViews();
      this.#initTheme();
      this.#initNavigation();
      this.#initMobileDrawer();
      this.#initRouting();
    }

    #initViews() {
      this.#views = {
        dashboard: new DashboardView('view-dashboard'),
        volunteers: new VolunteersView('view-volunteers'),
        activities: new ActivitiesView('view-activities'),
        tasks: new TasksView('view-tasks'),
        assignments: new AssignmentsView('view-assignments'),
        reports: new ReportsView('view-reports')
      };
    }

    #initTheme() {
      let savedTheme = 'light';
      try {
        savedTheme = localStorage.getItem('vms_theme') || 'light';
      } catch (e) {}
      this.#applyTheme(savedTheme);

      const themeToggleBtn = document.getElementById('theme-toggle-btn');
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          this.#applyTheme(newTheme);
        });
      }
    }

    #applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('vms_theme', theme);
      } catch (e) {}

      const themeIcon = document.getElementById('theme-toggle-icon');
      if (themeIcon) {
        if (theme === 'dark') {
          themeIcon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
        } else {
          themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
        }
      }
    }

    #initMobileDrawer() {
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const sidebar = document.getElementById('app-sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');

      if (mobileBtn && sidebar && backdrop) {
        mobileBtn.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          backdrop.classList.toggle('open');
        });

        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('open');
          backdrop.classList.remove('open');
        });
      }
    }

    #initNavigation() {
      document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
          const sidebar = document.getElementById('app-sidebar');
          const backdrop = document.getElementById('sidebar-backdrop');
          if (sidebar) sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('open');
        });
      });

      const aboutBtn = document.getElementById('btn-about-project');
      if (aboutBtn) {
        aboutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openAboutModal();
        });
      }

      const headerAboutBtn = document.getElementById('header-about-btn');
      if (headerAboutBtn) {
        headerAboutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openAboutModal();
        });
      }
    }

    #initRouting() {
      window.addEventListener('hashchange', () => this.#handleRoute());
      this.#handleRoute();
    }

    #handleRoute() {
      const hash = window.location.hash.slice(1) || 'dashboard';
      const [route, queryString] = hash.split('?');
      const params = new URLSearchParams(queryString || '');

      const validRoutes = ['dashboard', 'volunteers', 'activities', 'tasks', 'assignments', 'reports'];
      const activeRoute = validRoutes.includes(route) ? route : 'dashboard';
      this.#currentRoute = activeRoute;

      document.querySelectorAll('.nav-item').forEach(link => {
        const linkRoute = link.getAttribute('href').replace('#', '').split('?')[0];
        if (linkRoute === activeRoute) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      const headerTitle = document.getElementById('page-header-title');
      if (headerTitle) {
        headerTitle.textContent = activeRoute.charAt(0).toUpperCase() + activeRoute.slice(1);
      }

      document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
      });

      const activeSection = document.getElementById(`view-${activeRoute}`);
      if (activeSection) {
        activeSection.classList.add('active');
      }

      if (this.#views[activeRoute]) {
        if (activeRoute === 'assignments' && params.has('suggestTaskId')) {
          this.#views[activeRoute].render(params.get('suggestTaskId'));
        } else {
          this.#views[activeRoute].render();
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Bootstrap when DOM is ready
  function startApp() {
    const app = new App();
    app.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }

})();
