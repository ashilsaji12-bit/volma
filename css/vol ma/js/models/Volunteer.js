import { Person } from './Person.js';

/**
 * Class: Volunteer
 * 
 * OOP CONCEPT: Inheritance & Polymorphism
 * - Inheritance: Volunteer extends Person using `extends Person` and calls `super()`,
 *   inheriting base identity attributes (id, name, email, phone).
 * - Encapsulation: Additional volunteer attributes (#skills, #availability, #status, #joinedDate)
 *   are encapsulated with private fields and property accessors.
 * - Polymorphism: Overrides `getRoleDescription()` and `getSummary()` to provide
 *   volunteer-specific behavior and descriptions.
 */
export class Volunteer extends Person {
  #skills;
  #availability;
  #status;
  #joinedDate;

  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.phone
   * @param {string[]} [data.skills]
   * @param {string[]} [data.availability]
   * @param {'Active'|'Inactive'} [data.status]
   * @param {string} [data.joinedDate]
   */
  constructor({ id, name, email, phone, skills = [], availability = [], status = 'Active', joinedDate }) {
    super({ id, name, email, phone }); // Call parent constructor (Inheritance)

    this.#skills = Array.isArray(skills) ? [...skills] : [];
    this.#availability = Array.isArray(availability) ? [...availability] : (availability ? [availability] : []);
    this.#status = status === 'Inactive' ? 'Inactive' : 'Active';
    this.#joinedDate = joinedDate || new Date().toISOString().split('T')[0];
  }

  // Encapsulated Getters and Setters
  get skills() {
    return [...this.#skills];
  }

  set skills(newSkills) {
    if (!Array.isArray(newSkills)) {
      throw new Error('Skills must be an array');
    }
    this.#skills = [...newSkills];
  }

  get availability() {
    return [...this.#availability];
  }

  set availability(newAvail) {
    if (!Array.isArray(newAvail)) {
      throw new Error('Availability must be an array');
    }
    this.#availability = [...newAvail];
  }

  get status() {
    return this.#status;
  }

  set status(val) {
    if (val !== 'Active' && val !== 'Inactive') {
      throw new Error('Status must be Active or Inactive');
    }
    this.#status = val;
  }

  get joinedDate() {
    return this.#joinedDate;
  }

  /**
   * Business Logic Helpers
   */
  hasSkill(skillName) {
    if (!skillName) return false;
    return this.#skills.some(s => s.toLowerCase() === skillName.toLowerCase());
  }

  isAvailable(slot) {
    if (!slot) return true;
    return this.#availability.some(a => a.toLowerCase().includes(slot.toLowerCase()) || slot.toLowerCase().includes(a.toLowerCase()));
  }

  /**
   * OOP CONCEPT: Polymorphism - Method Overriding
   * Overrides Person.getRoleDescription()
   * @returns {string}
   */
  getRoleDescription() {
    return `Student Volunteer [${this.#status}] - Skills: ${this.#skills.join(', ') || 'General'}`;
  }

  /**
   * OOP CONCEPT: Polymorphism - Method Overriding
   * Overrides Person.getSummary()
   * @returns {string}
   */
  getSummary() {
    return `${this.name} (${this.#status}) | Available: ${this.#availability.join(', ') || 'Anytime'}`;
  }

  /**
   * Serialization
   */
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

  /**
   * Static Factory Method (Object Creation)
   */
  static fromJSON(json) {
    return new Volunteer(json);
  }
}
