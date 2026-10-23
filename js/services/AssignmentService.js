import { storage } from './StorageService.js';
import { Assignment } from '../models/Assignment.js';
import { volunteerService } from './VolunteerService.js';
import { activityService } from './ActivityService.js';
import { INITIAL_ASSIGNMENTS } from './SeedData.js';

const COLLECTION = 'assignments';

/**
 * Service: AssignmentService
 * 
 * Manages Volunteer-Task assignments, enforces business rules, conflict checks,
 * and provides recommendation algorithms for volunteer matching.
 */
export class AssignmentService {
  constructor() {
    this.#initialize();
  }

  #initialize() {
    const existing = storage.getAll(COLLECTION);
    if (!existing || existing.length === 0) {
      storage.setAll(COLLECTION, INITIAL_ASSIGNMENTS);
    }
  }

  resetToDefault() {
    storage.setAll(COLLECTION, INITIAL_ASSIGNMENTS);
  }

  /**
   * Get all assignments as domain objects
   * @returns {Assignment[]}
   */
  getAll() {
    const rawList = storage.getAll(COLLECTION);
    return rawList.map(raw => Assignment.fromJSON(raw));
  }

  getById(id) {
    const raw = storage.getById(COLLECTION, id);
    return raw ? Assignment.fromJSON(raw) : null;
  }

  /**
   * Get all assignments for a specific task
   * @param {string} taskId
   * @param {boolean} [activeOnly=true]
   * @returns {Assignment[]}
   */
  getAssignmentsForTask(taskId, activeOnly = true) {
    const all = this.getAll();
    return all.filter(a => a.taskId === taskId && (!activeOnly || a.status !== 'Cancelled'));
  }

  /**
   * Get assignments for a volunteer
   * @param {string} volunteerId
   * @returns {Assignment[]}
   */
  getAssignmentsForVolunteer(volunteerId) {
    const all = this.getAll();
    return all.filter(a => a.volunteerId === volunteerId);
  }

  /**
   * Assign a volunteer to a task with strict conflict checks
   * 
   * Business Rules:
   * 1. Volunteer must be Active (or warning if Inactive)
   * 2. No duplicate assignment to the same task
   * 3. No exceeding task capacity (slots)
   * 4. No double-booking: Volunteer cannot be in another task on the same date with the same time slot!
   * 
   * @param {Object} data
   * @param {string} data.volunteerId
   * @param {string} data.taskId
   * @returns {Assignment}
   */
  createAssignment({ volunteerId, taskId }) {
    const volunteer = volunteerService.getById(volunteerId);
    if (!volunteer) {
      throw new Error('Volunteer not found.');
    }

    if (volunteer.status === 'Inactive') {
      throw new Error(`Cannot assign ${volunteer.name} because their status is Inactive.`);
    }

    const task = activityService.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found.');
    }

    const activity = activityService.getActivityById(task.activityId);
    if (!activity) {
      throw new Error('Parent activity for this task was not found.');
    }

    // 1. Check duplicate assignment
    const existingSameTask = this.getAll().find(
      a => a.volunteerId === volunteerId && a.taskId === taskId && a.status !== 'Cancelled'
    );
    if (existingSameTask) {
      throw new Error(`${volunteer.name} is already assigned to "${task.title}".`);
    }

    // 2. Check slot capacity
    const currentTaskAssignments = this.getAssignmentsForTask(taskId, true);
    if (currentTaskAssignments.length >= task.slots) {
      throw new Error(`Task "${task.title}" has reached its maximum capacity of ${task.slots} volunteer(s).`);
    }

    // 3. Check Double Booking Conflict (Same date and overlapping timeslot)
    const allActiveAssignments = this.getAll().filter(
      a => a.volunteerId === volunteerId && a.status !== 'Cancelled'
    );

    for (const asg of allActiveAssignments) {
      const otherTask = activityService.getTaskById(asg.taskId);
      if (!otherTask) continue;
      const otherActivity = activityService.getActivityById(otherTask.activityId);
      if (!otherActivity) continue;

      // If on the exact same date and same timeSlot
      if (otherActivity.date === activity.date && otherTask.timeSlot === task.timeSlot) {
        throw new Error(
          `Schedule Conflict: ${volunteer.name} is already scheduled for "${otherTask.title}" (${otherActivity.title}) during ${task.timeSlot} on ${activity.date}.`
        );
      }
    }

    // Passed all validations! Create assignment
    const newAssignment = new Assignment({
      volunteerId,
      taskId,
      activityId: activity.id,
      status: 'Assigned',
      assignedDate: new Date().toISOString().split('T')[0]
    });

    storage.save(COLLECTION, newAssignment.toJSON());
    return newAssignment;
  }

  /**
   * Update assignment status (Assigned, Completed, Cancelled)
   * @param {string} id
   * @param {'Assigned'|'Completed'|'Cancelled'} newStatus
   * @returns {Assignment}
   */
  updateStatus(id, newStatus) {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error('Assignment not found');
    }

    existing.status = newStatus;
    storage.update(COLLECTION, id, existing.toJSON());
    return existing;
  }

  /**
   * Delete assignment completely
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    return storage.delete(COLLECTION, id);
  }

  /**
   * Volunteer Recommendation Algorithm ("Suggest Volunteers")
   * 
   * Ranks all active volunteers based on:
   * - Skill match (+50 points)
   * - Availability match for task time slot (+30 points)
   * - Active status (+15 points)
   * - Workload penalty (-10 points per currently active assignment to balance load)
   * 
   * Excludes volunteers who already have a direct time-slot collision on that date
   * or are already assigned to this task.
   * 
   * @param {string} taskId
   * @returns {Array<{ volunteer: Volunteer, score: number, reasons: string[], conflict: string|null }>}
   */
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
      // Don't recommend if already assigned to this task
      if (assignedVolunteerIds.has(vol.id)) continue;

      let score = 0;
      const reasons = [];
      let conflict = null;

      // Status check
      if (vol.status === 'Active') {
        score += 15;
      } else {
        // Skip Inactive volunteers completely from suggestion
        continue;
      }

      // Check date/time collision
      const hasConflict = existingAssignments.some(asg => {
        if (asg.volunteerId !== vol.id) return false;
        const otherTask = activityService.getTaskById(asg.taskId);
        if (!otherTask) return false;
        const otherAct = activityService.getActivityById(otherTask.activityId);
        if (!otherAct) return false;
        return otherAct.date === activity.date && otherTask.timeSlot === task.timeSlot;
      });

      if (hasConflict) {
        // Skip if directly conflicted
        continue;
      }

      // Skill Match
      if (vol.hasSkill(task.requiredSkill)) {
        score += 50;
        reasons.push(`Has required skill: ${task.requiredSkill}`);
      } else {
        reasons.push('General skills');
      }

      // Availability Match
      const matchesTime = vol.isAvailable(task.timeSlot) || vol.isAvailable('Full Day');
      if (matchesTime) {
        score += 30;
        reasons.push(`Available for ${task.timeSlot}`);
      }

      // Workload balancing
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

    // Sort descending by score
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Get participation profile for a volunteer
   * @param {string} volunteerId
   */
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

    return {
      total: list.length,
      completed,
      active,
      cancelled,
      assignments: enriched
    };
  }
}

export const assignmentService = new AssignmentService();
