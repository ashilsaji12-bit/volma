/**
 * Base Class: Person
 * 
 * OOP CONCEPT: Encapsulation & Abstraction
 * - Encapsulation: Attributes (#id, #name, #email, #phone) are declared as private fields (#)
 *   and accessed only through explicit getters and validated setters.
 * - Polymorphism: Defines virtual/base methods like getRoleDescription() and getSummary()
 *   which subclasses override with their specific behavior.
 */
export class Person {
  #id;
  #name;
  #email;
  #phone;

  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.phone
   */
  constructor({ id, name, email, phone }) {
    if (new.target === Person) {
      // Abstract base class pattern check (can still be instantiated if needed, but intended as base)
    }
    this.#id = id || `per_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = name;
    this.email = email;
    this.phone = phone;
  }

  // Getters & Setters (Encapsulation)
  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  set name(value) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.#name = value.trim();
  }

  get email() {
    return this.#email;
  }

  set email(value) {
    const trimmed = (value || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error('Invalid email address format');
    }
    this.#email = trimmed.toLowerCase();
  }

  get phone() {
    return this.#phone;
  }

  set phone(value) {
    const trimmed = (value || '').trim();
    // Validate 10-digit phone
    const cleanPhone = trimmed.replace(/[\s\-()]/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      throw new Error('Phone must be a valid 10-digit number');
    }
    this.#phone = cleanPhone;
  }

  /**
   * OOP CONCEPT: Polymorphic Method
   * Base implementation to be overridden by subclasses.
   * @returns {string}
   */
  getRoleDescription() {
    return 'General College Community Member';
  }

  /**
   * Polymorphic summary method
   * @returns {string}
   */
  getSummary() {
    return `${this.#name} (${this.#email})`;
  }

  /**
   * Serialization to standard JSON object for persistence
   */
  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      email: this.#email,
      phone: this.#phone
    };
  }
}
