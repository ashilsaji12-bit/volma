import { activityService } from '../services/ActivityService.js';
import { assignmentService } from '../services/AssignmentService.js';
import { SKILL_OPTIONS, TIME_SLOT_OPTIONS } from '../services/SeedData.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';
import { isNonEmpty, isPositiveNumber } from '../utils/validators.js';
import { escapeHtml } from '../utils/formatters.js';

export class TasksView {
  #container;
  #filterActivity = '';
  #filterSkill = '';

  constructor(containerId = 'view-tasks') {
    this.#container = document.getElementById(containerId);
  }

  render() {
    const activities = activityService.getAllActivities();
    let tasks = activityService.getAllTasks();

    if (this.#filterActivity) {
      tasks = tasks.filter(t => t.activityId === this.#filterActivity);
    }
    if (this.#filterSkill) {
      tasks = tasks.filter(t => t.requiredSkill === this.#filterSkill);
    }

    this.#container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Event Tasks Management</h2>
          <p class="section-description">Define work packages, specify required skill sets, and allocate volunteer slots per activity.</p>
        </div>
        <button class="btn btn-primary" id="btn-add-task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Task
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select id="task-filter-act" class="filter-select">
          <option value="">All Activities</option>
          ${activities.map(a => `<option value="${a.id}" ${this.#filterActivity === a.id ? 'selected' : ''}>${escapeHtml(a.title)}</option>`).join('')}
        </select>

        <select id="task-filter-skill" class="filter-select">
          <option value="">All Skills</option>
          ${SKILL_OPTIONS.map(s => `<option value="${escapeHtml(s)}" ${this.#filterSkill === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
        </select>

        ${(this.#filterActivity || this.#filterSkill) ? `
          <button class="btn btn-ghost btn-sm" id="btn-clear-task-filters">Clear Filters</button>
        ` : ''}
      </div>

      <!-- Tasks Table -->
      ${tasks.length === 0 ? `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <h4 class="empty-state-title">No Tasks Found</h4>
          <p class="empty-state-description">Add specific responsibilities for volunteers by clicking "Add New Task".</p>
        </div>
      ` : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task Details</th>
                <th>Associated Event</th>
                <th>Required Skill</th>
                <th>Time Slot</th>
                <th>Slot Allocation</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(task => {
                const act = activityService.getActivityById(task.activityId);
                const assignments = assignmentService.getAssignmentsForTask(task.id, true);
                const isFull = assignments.length >= task.slots;

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${escapeHtml(task.title)}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(task.description || 'No description')}</div>
                    </td>
                    <td>
                      <span style="font-weight: 500;">${act ? escapeHtml(act.title) : 'Unknown Activity'}</span>
                    </td>
                    <td>
                      <span class="badge badge-skill">${escapeHtml(task.requiredSkill)}</span>
                    </td>
                    <td>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(task.timeSlot)}</div>
                    </td>
                    <td style="min-width: 140px;">
                      <div style="display:flex; justify-content:space-between; font-size: 0.75rem; margin-bottom: 3px;">
                        <span>${assignments.length} of ${task.slots} Filled</span>
                        <span style="font-weight:700;">${Math.round((assignments.length / task.slots) * 100)}%</span>
                      </div>
                      <div class="progress-container">
                        <div class="progress-bar ${isFull ? 'complete' : ''}" style="width: ${Math.min(100, Math.round((assignments.length / task.slots) * 100))}%;"></div>
                      </div>
                    </td>
                    <td style="text-align: right;">
                      <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm btn-suggest-task" data-id="${task.id}" title="Find matching volunteers">
                          Suggest
                        </button>
                        <button class="btn-icon btn-edit-task" data-id="${task.id}" title="Edit Task">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                        </button>
                        <button class="btn-icon btn-del-task" data-id="${task.id}" title="Delete Task" style="color:var(--danger-500);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    this.#attachEvents();
  }

  #attachEvents() {
    const addBtn = this.#container.querySelector('#btn-add-task');
    if (addBtn) addBtn.addEventListener('click', () => this.#openTaskFormModal());

    const actFilter = this.#container.querySelector('#task-filter-act');
    if (actFilter) {
      actFilter.addEventListener('change', (e) => {
        this.#filterActivity = e.target.value;
        this.render();
      });
    }

    const skillFilter = this.#container.querySelector('#task-filter-skill');
    if (skillFilter) {
      skillFilter.addEventListener('change', (e) => {
        this.#filterSkill = e.target.value;
        this.render();
      });
    }

    const clearBtn = this.#container.querySelector('#btn-clear-task-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.#filterActivity = '';
        this.#filterSkill = '';
        this.render();
      });
    }

    this.#container.querySelectorAll('.btn-suggest-task').forEach(btn => {
      btn.addEventListener('click', () => {
        // Trigger suggest dialog in assignments module or jump to assignment suggest
        window.location.hash = `#assignments?suggestTaskId=${btn.dataset.id}`;
      });
    });

    this.#container.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', () => this.#openTaskFormModal(btn.dataset.id));
    });

    this.#container.querySelectorAll('.btn-del-task').forEach(btn => {
      btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
    });
  }

  #openTaskFormModal(id = null) {
    const isEdit = !!id;
    const existing = isEdit ? activityService.getTaskById(id) : null;
    const activities = activityService.getAllActivities();

    if (activities.length === 0) {
      toast.warning('Please create at least one activity before adding tasks.');
      return;
    }

    const formHtml = `
      <form id="task-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="tf-act">Select Activity <span class="required">*</span></label>
          <select id="tf-act" class="form-control" ${isEdit ? 'disabled' : ''} required>
            ${activities.map(a => `<option value="${a.id}" ${existing && existing.activityId === a.id ? 'selected' : ''}>${escapeHtml(a.title)} (${formatDate(a.date)})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="tf-title">Task Title <span class="required">*</span></label>
          <input type="text" id="tf-title" class="form-control" placeholder="e.g. Helpdesk Registration" value="${existing ? escapeHtml(existing.title) : ''}" required>
          <div class="form-error-msg" id="err-tf-title">Task title is required.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="tf-desc">Description</label>
          <textarea id="tf-desc" class="form-control" rows="2" placeholder="Brief explanation of duties...">${existing ? escapeHtml(existing.description) : ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="tf-skill">Required Skill</label>
            <select id="tf-skill" class="form-control">
              ${SKILL_OPTIONS.map(s => `<option value="${escapeHtml(s)}" ${existing && existing.requiredSkill === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="tf-slots">Volunteer Slots (Capacity) <span class="required">*</span></label>
            <input type="number" id="tf-slots" class="form-control" min="1" max="50" value="${existing ? existing.slots : 2}" required>
            <div class="form-error-msg" id="err-tf-slots">Slots must be at least 1.</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="tf-time">Time Slot <span class="required">*</span></label>
          <select id="tf-time" class="form-control">
            ${TIME_SLOT_OPTIONS.map(t => `<option value="${escapeHtml(t)}" ${existing && existing.timeSlot === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
          </select>
        </div>
      </form>
    `;

    modal.open({
      title: isEdit ? 'Edit Task' : 'Add New Task',
      body: formHtml,
      buttons: [
        {
          label: 'Cancel',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          label: isEdit ? 'Save Changes' : 'Create Task',
          className: 'btn-primary',
          onClick: () => {
            const form = document.getElementById('task-form');
            const activityId = form.querySelector('#tf-act').value;
            const title = form.querySelector('#tf-title').value.trim();
            const description = form.querySelector('#tf-desc').value.trim();
            const requiredSkill = form.querySelector('#tf-skill').value;
            const slotsVal = form.querySelector('#tf-slots').value;
            const timeSlot = form.querySelector('#tf-time').value;

            let hasErrors = false;

            if (!isNonEmpty(title)) {
              form.querySelector('#err-tf-title').classList.add('visible');
              form.querySelector('#tf-title').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-tf-title').classList.remove('visible');
              form.querySelector('#tf-title').classList.remove('is-invalid');
            }

            if (!isPositiveNumber(slotsVal)) {
              form.querySelector('#err-tf-slots').classList.add('visible');
              form.querySelector('#tf-slots').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-tf-slots').classList.remove('visible');
              form.querySelector('#tf-slots').classList.remove('is-invalid');
            }

            if (hasErrors) return;

            try {
              if (isEdit) {
                activityService.updateTask(id, {
                  title,
                  description,
                  requiredSkill,
                  slots: parseInt(slotsVal, 10),
                  timeSlot
                });
                toast.success(`Task "${title}" updated.`);
              } else {
                activityService.createTask({
                  activityId,
                  title,
                  description,
                  requiredSkill,
                  slots: parseInt(slotsVal, 10),
                  timeSlot
                });
                toast.success(`Task "${title}" created.`);
              }
              modal.close();
              this.render();
            } catch (err) {
              toast.error(err.message);
            }
          }
        }
      ]
    });
  }

  #confirmDelete(id) {
    const task = activityService.getTaskById(id);
    if (!task) return;

    modal.confirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete task "${task.title}"? Any active volunteer assignments for this task will be cleared.`,
      confirmText: 'Delete Task',
      onConfirm: () => {
        activityService.deleteTask(id);
        toast.info(`Task "${task.title}" deleted.`);
        this.render();
      }
    });
  }
}
