import { storage } from './StorageService.js';
import { Volunteer } from '../models/Volunteer.js';
import { INITIAL_VOLUNTEERS } from './SeedData.js';

const COLLECTION = 'volunteers';

/**
 * Service: VolunteerService
 * 
 * Manages Volunteer entities and interactions.
 * Converts raw persistent objects into encapsulated Volunteer instances.
 */
export class VolunteerService {
  constructor() {
    this.#initialize();
  }

  #initialize() {
    const existing = storage.getAll(COLLECTION);
    if (!existing || existing.length === 0) {
      storage.setAll(COLLECTION, INITIAL_VOLUNTEERS);
    }
  }

  /**
   * Reset collection to seed data
   */
  resetToDefault() {
    storage.setAll(COLLECTION, INITIAL_VOLUNTEERS);
  }

  /**
   * Get all volunteers as Volunteer domain instances
   * @returns {Volunteer[]}
   */
  getAll() {
    const rawList = storage.getAll(COLLECTION);
    return rawList.map(raw => Volunteer.fromJSON(raw));
  }

  /**
   * Find volunteer by id
   * @param {string} id
   * @returns {Volunteer|null}
   */
  getById(id) {
    const raw = storage.getById(COLLECTION, id);
    return raw ? Volunteer.fromJSON(raw) : null;
  }

  /**
   * Create a new volunteer
   * @param {Object} data
   * @returns {Volunteer}
   */
  create(data) {
    // Validate uniqueness of email
    const all = this.getAll();
    if (all.some(v => v.email.toLowerCase() === (data.email || '').trim().toLowerCase())) {
      throw new Error('A volunteer with this email address already exists');
    }

    const volunteer = new Volunteer(data);
    storage.save(COLLECTION, volunteer.toJSON());
    return volunteer;
  }

  /**
   * Update an existing volunteer
   * @param {string} id
   * @param {Object} data
   * @returns {Volunteer}
   */
  update(id, data) {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`Volunteer with ID ${id} not found`);
    }

    // Email conflict check
    if (data.email) {
      const all = this.getAll();
      const conflict = all.find(v => v.id !== id && v.email.toLowerCase() === data.email.trim().toLowerCase());
      if (conflict) {
        throw new Error('Another volunteer with this email address already exists');
      }
    }

    const updatedModel = new Volunteer({
      ...existing.toJSON(),
      ...data,
      id
    });

    storage.update(COLLECTION, id, updatedModel.toJSON());
    return updatedModel;
  }

  /**
   * Delete volunteer
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    return storage.delete(COLLECTION, id);
  }

  /**
   * Search and filter volunteers
   * @param {Object} params
   * @param {string} [params.search]
   * @param {string} [params.skill]
   * @param {string} [params.availability]
   * @param {string} [params.status]
   * @returns {Volunteer[]}
   */
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

    if (skill) {
      list = list.filter(v => v.hasSkill(skill));
    }

    if (availability) {
      list = list.filter(v => v.isAvailable(availability));
    }

    if (status) {
      list = list.filter(v => v.status === status);
    }

    return list;
  }
}

export const volunteerService = new VolunteerService();
