/**
 * Class: Task
 * 
 * OOP CONCEPT: Encapsulation & Aggregation
 * Represents an individual unit of work belonging to an Activity.
 * Encapsulates the skill requirement, slot capacity, and scheduled time slot.
 */
export class Task {
  #id;
  #activityId;
  #title;
  #description;
  #requiredSkill;
  #slots;
  #timeSlot;

  /**
   * @param {Object} data
   * @param {string} [data.id]
   * @param {string} data.activityId
   * @param {string} data.title
   * @param {string} [data.description]
   * @param {string} [data.requiredSkill]
   * @param {number} [data.slots]
   * @param {string} data.timeSlot e.g. "Morning (09:00 - 12:00)", "Afternoon (13:00 - 16:00)"
   */
  constructor({
    id,
    activityId,
    title,
    description = '',
    requiredSkill = 'General Support',
    slots = 2,
    timeSlot = 'Morning (09:00 - 12:00)'
  }) {
    if (!activityId) {
      throw new Error('Task must be linked to an Activity (activityId required)');
    }
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
  set requiredSkill(val) {
    this.#requiredSkill = (val || 'General Support').trim();
  }

  get slots() { return this.#slots; }
  set slots(val) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Task slots must be at least 1');
    }
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
