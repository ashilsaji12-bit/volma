import { Person } from './Person.js';

/**
 * Class: Coordinator
 * 
 * OOP CONCEPT: Inheritance & Polymorphism
 * - Extends Person base class
 * - Introduces departmental coordinator context
 * - Polymorphically overrides getRoleDescription()
 */
export class Coordinator extends Person {
  #department;

  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.phone
   * @param {string} data.department
   */
  constructor({ id, name, email, phone, department = 'Computer Science' }) {
    super({ id, name, email, phone });
    this.#department = department;
  }

  get department() {
    return this.#department;
  }

  set department(dept) {
    if (!dept || typeof dept !== 'string') {
      throw new Error('Department is required');
    }
    this.#department = dept.trim();
  }

  /**
   * OOP CONCEPT: Polymorphism
   * Overrides base getRoleDescription
   */
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
