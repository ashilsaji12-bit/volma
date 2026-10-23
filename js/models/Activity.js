/**
 * Class: Activity
 * 
 * OOP CONCEPT: Encapsulation & Domain Modeling
 * Encapsulates activity/event details, scheduling dates, venue, capacity constraints,
 * and lifecycle status (Upcoming, Ongoing, Completed).
 */
export class Activity {
  #id;
  #title;
  #description;
  #date;
  #venue;
  #category;
  #requiredVolunteers;
  #status;

  /**
   * @param {Object} data
   * @param {string} [data.id]
   * @param {string} data.title
   * @param {string} [data.description]
   * @param {string} data.date
   * @param {string} data.venue
   * @param {'College Event'|'Community Program'|'Workshop'} [data.category]
   * @param {number} [data.requiredVolunteers]
   * @param {'Upcoming'|'Ongoing'|'Completed'} [data.status]
   */
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

  // Getters & Setters
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
    if (isNaN(num) || num <= 0) {
      throw new Error('Required volunteers must be a positive number');
    }
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
