/**
 * Seed Data for Volunteer Management System
 * Provides realistic college event management data on first run.
 */

export const INITIAL_VOLUNTEERS = [
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

export const INITIAL_ACTIVITIES = [
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

export const INITIAL_TASKS = [
  // For Innovate 2026
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

  // For Blood Donation Camp
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

  // For Web Bootcamp
  {
    id: "tsk_307",
    activityId: "act_203",
    title: "Student Coding Mentor & Doubt Clearance",
    description: "Assist attendees with Git commands, VS Code setup, and syntax troubleshooting.",
    requiredSkill: "Tech Support",
    slots: 2,
    timeSlot: "Afternoon (13:00 - 16:00)"
  },

  // For Tree Plantation
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

export const INITIAL_ASSIGNMENTS = [
  {
    id: "asg_401",
    volunteerId: "vol_103", // Sooraj
    taskId: "tsk_301",
    activityId: "act_201",
    status: "Assigned",
    assignedDate: "2026-10-18"
  },
  {
    id: "asg_402",
    volunteerId: "vol_101", // Aadhi
    taskId: "tsk_302",
    activityId: "act_201",
    status: "Assigned",
    assignedDate: "2026-10-19"
  },
  {
    id: "asg_403",
    volunteerId: "vol_110", // Sneha
    taskId: "tsk_302",
    activityId: "act_201",
    status: "Assigned",
    assignedDate: "2026-10-19"
  },
  {
    id: "asg_404",
    volunteerId: "vol_104", // George
    taskId: "tsk_304",
    activityId: "act_201",
    status: "Assigned",
    assignedDate: "2026-10-20"
  },
  {
    id: "asg_405",
    volunteerId: "vol_105", // Rohan
    taskId: "tsk_305",
    activityId: "act_202",
    status: "Assigned",
    assignedDate: "2026-10-21"
  },
  {
    id: "asg_406",
    volunteerId: "vol_107", // Arjun
    taskId: "tsk_307",
    activityId: "act_203",
    status: "Assigned",
    assignedDate: "2026-10-22"
  },
  {
    id: "asg_407",
    volunteerId: "vol_101", // Aadhi
    taskId: "tsk_308",
    activityId: "act_204",
    status: "Completed",
    assignedDate: "2026-09-25"
  },
  {
    id: "asg_408",
    volunteerId: "vol_103", // Sooraj
    taskId: "tsk_308",
    activityId: "act_204",
    status: "Completed",
    assignedDate: "2026-09-25"
  },
  {
    id: "asg_409",
    volunteerId: "vol_105", // Rohan
    taskId: "tsk_308",
    activityId: "act_204",
    status: "Completed",
    assignedDate: "2026-09-25"
  }
];

export const SKILL_OPTIONS = [
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

export const TIME_SLOT_OPTIONS = [
  "Morning (09:00 - 12:00)",
  "Afternoon (13:00 - 16:00)",
  "Evening (16:00 - 19:00)",
  "Full Day (09:00 - 17:00)"
];

export const AVAILABILITY_OPTIONS = [
  "Weekdays",
  "Weekends",
  "Morning (09:00 - 12:00)",
  "Afternoon (13:00 - 16:00)",
  "Evening (16:00 - 19:00)",
  "Full Day"
];
