/**
 * Class: Assignment
 * 
 * OOP CONCEPT: Association & State Encapsulation
 * Represents the assignment of a Volunteer to a Task within an Activity.
 * Encapsulates the assignment state (Assigned, Completed, Cancelled) and timestamp.
 */
export class Assignment {
  #id;
  #volunteerId;
  #taskId;
  #activityId;
  #status;
  #assignedDate;

  /**
   * @param {Object} data
   * @param {string} [data.id]
   * @param {string} data.volunteerId
   * @param {string} data.taskId
   * @param {string} data.activityId
   * @param {'Assigned'|'Completed'|'Cancelled'} [data.status]
   * @param {string} [data.assignedDate]
   */
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
    const validStatuses = ['Assigned', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(val)) {
      throw new Error(`Invalid status: ${val}. Allowed: ${validStatuses.join(', ')}`);
    }
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
