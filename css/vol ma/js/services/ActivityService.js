import { storage } from './StorageService.js';
import { Activity } from '../models/Activity.js';
import { Task } from '../models/Task.js';
import { INITIAL_ACTIVITIES, INITIAL_TASKS } from './SeedData.js';

const ACTIVITIES_COLLECTION = 'activities';
const TASKS_COLLECTION = 'tasks';

/**
 * Service: ActivityService
 * 
 * Manages Activities and associated Tasks.
 */
export class ActivityService {
  constructor() {
    this.#initialize();
  }

  #initialize() {
    const existingActs = storage.getAll(ACTIVITIES_COLLECTION);
    if (!existingActs || existingActs.length === 0) {
      storage.setAll(ACTIVITIES_COLLECTION, INITIAL_ACTIVITIES);
    }

    const existingTasks = storage.getAll(TASKS_COLLECTION);
    if (!existingTasks || existingTasks.length === 0) {
      storage.setAll(TASKS_COLLECTION, INITIAL_TASKS);
    }
  }

  resetToDefault() {
    storage.setAll(ACTIVITIES_COLLECTION, INITIAL_ACTIVITIES);
    storage.setAll(TASKS_COLLECTION, INITIAL_TASKS);
  }

  /* ---------------- Activity Methods ---------------- */

  getAllActivities() {
    const rawList = storage.getAll(ACTIVITIES_COLLECTION);
    return rawList.map(raw => Activity.fromJSON(raw));
  }

  getActivityById(id) {
    const raw = storage.getById(ACTIVITIES_COLLECTION, id);
    return raw ? Activity.fromJSON(raw) : null;
  }

  createActivity(data) {
    const activity = new Activity(data);
    storage.save(ACTIVITIES_COLLECTION, activity.toJSON());
    return activity;
  }

  updateActivity(id, data) {
    const existing = this.getActivityById(id);
    if (!existing) {
      throw new Error(`Activity with ID ${id} not found`);
    }

    const updated = new Activity({
      ...existing.toJSON(),
      ...data,
      id
    });

    storage.update(ACTIVITIES_COLLECTION, id, updated.toJSON());
    return updated;
  }

  deleteActivity(id) {
    // Also delete tasks under this activity
    const tasks = this.getTasksForActivity(id);
    tasks.forEach(t => storage.delete(TASKS_COLLECTION, t.id));

    // Also delete any assignments for this activity
    const assignments = storage.getAll('assignments').filter(a => a.activityId !== id);
    storage.setAll('assignments', assignments);

    return storage.delete(ACTIVITIES_COLLECTION, id);
  }

  /* ---------------- Task Methods ---------------- */

  getAllTasks() {
    const rawList = storage.getAll(TASKS_COLLECTION);
    return rawList.map(raw => Task.fromJSON(raw));
  }

  getTasksForActivity(activityId) {
    const all = this.getAllTasks();
    return all.filter(t => t.activityId === activityId);
  }

  getTaskById(id) {
    const raw = storage.getById(TASKS_COLLECTION, id);
    return raw ? Task.fromJSON(raw) : null;
  }

  createTask(data) {
    const task = new Task(data);
    storage.save(TASKS_COLLECTION, task.toJSON());
    return task;
  }

  updateTask(id, data) {
    const existing = this.getTaskById(id);
    if (!existing) {
      throw new Error(`Task with ID ${id} not found`);
    }

    const updated = new Task({
      ...existing.toJSON(),
      ...data,
      id
    });

    storage.update(TASKS_COLLECTION, id, updated.toJSON());
    return updated;
  }

  deleteTask(id) {
    // Clean up assignments for this task
    const assignments = storage.getAll('assignments').filter(a => a.taskId !== id);
    storage.setAll('assignments', assignments);

    return storage.delete(TASKS_COLLECTION, id);
  }

  /**
   * Calculate slot statistics for an activity
   * @param {string} activityId
   * @returns {{ totalSlots: number, filledSlots: number, openSlots: number, percentage: number }}
   */
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

export const activityService = new ActivityService();
