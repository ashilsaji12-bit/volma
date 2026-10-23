import { assignmentService } from '../services/AssignmentService.js';
import { volunteerService } from '../services/VolunteerService.js';
import { activityService } from '../services/ActivityService.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';
import { escapeHtml, formatDate, getStatusBadgeClass } from '../utils/formatters.js';

export class AssignmentsView {
  #container;
  #filterActivity = '';
  #filterStatus = '';

  constructor(containerId = 'view-assignments') {
    this.#container = document.getElementById(containerId);
  }

  render(suggestTaskId = null) {
    const activities = activityService.getAllActivities();
    let assignments = assignmentService.getAll();

    if (this.#filterActivity) {
      assignments = assignments.filter(a => a.activityId === this.#filterActivity);
    }
    if (this.#filterStatus) {
      assignments = assignments.filter(a => a.status === this.#filterStatus);
    }

    this.#container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Volunteer Task Assignments</h2>
          <p class="section-description">Match volunteers to event tasks, smart ranking suggestions, and conflict prevention safeguards.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" id="btn-suggest-modal-trigger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
            Suggest Volunteers
          </button>
          <button class="btn btn-primary" id="btn-create-assignment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Assignment
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select id="asg-filter-act" class="filter-select">
          <option value="">All Activities</option>
          ${activities.map(a => `<option value="${a.id}" ${this.#filterActivity === a.id ? 'selected' : ''}>${escapeHtml(a.title)}</option>`).join('')}
        </select>

        <select id="asg-filter-status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Assigned" ${this.#filterStatus === 'Assigned' ? 'selected' : ''}>Assigned (Active)</option>
          <option value="Completed" ${this.#filterStatus === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${this.#filterStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>

        ${(this.#filterActivity || this.#filterStatus) ? `
          <button class="btn btn-ghost btn-sm" id="btn-clear-asg-filters">Clear Filters</button>
        ` : ''}
      </div>

      <!-- Assignments Table -->
      ${assignments.length === 0 ? `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
          <h4 class="empty-state-title">No Assignments Found</h4>
          <p class="empty-state-description">Assign volunteers to pending tasks to fill required event slots.</p>
        </div>
      ` : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Event / Activity</th>
                <th>Assigned Task</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th style="text-align: right;">Update Status / Action</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(asg => {
                const vol = volunteerService.getById(asg.volunteerId);
                const act = activityService.getActivityById(asg.activityId);
                const task = activityService.getTaskById(asg.taskId);

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${vol ? escapeHtml(vol.name) : 'Unknown Volunteer'}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${vol ? escapeHtml(vol.phone) : ''}</div>
                    </td>
                    <td>
                      <div style="font-weight: 500;">${act ? escapeHtml(act.title) : 'Unknown Activity'}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${act ? formatDate(act.date) : ''}</div>
                    </td>
                    <td>
                      <div>${task ? escapeHtml(task.title) : 'Unknown Task'}</div>
                      <div style="font-size: 0.75rem; color: var(--accent-500); font-weight: 500;">
                        Req: ${task ? escapeHtml(task.requiredSkill) : 'General'}
                      </div>
                    </td>
                    <td>
                      <span style="font-size: 0.8rem; color: var(--text-muted);">${task ? escapeHtml(task.timeSlot) : 'N/A'}</span>
                    </td>
                    <td>
                      <span class="badge ${getStatusBadgeClass(asg.status)}">${asg.status}</span>
                    </td>
                    <td style="text-align: right;">
                      <div class="table-actions" style="justify-content: flex-end;">
                        ${asg.status === 'Assigned' ? `
                          <button class="btn btn-sm btn-secondary btn-mark-complete" data-id="${asg.id}" title="Mark task Completed">
                            Done
                          </button>
                          <button class="btn btn-sm btn-ghost btn-mark-cancel" data-id="${asg.id}" title="Cancel Assignment" style="color:var(--danger-500);">
                            Cancel
                          </button>
                        ` : `
                          <span style="font-size:0.75rem; color:var(--text-subtle); margin-right:4px;">Closed</span>
                        `}
                        <button class="btn-icon btn-del-asg" data-id="${asg.id}" title="Remove Record">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

    // If an incoming suggestTaskId was passed, immediately open the suggest modal
    if (suggestTaskId) {
      this.openSuggestModal(suggestTaskId);
    }
  }

  #attachEvents() {
    const createBtn = this.#container.querySelector('#btn-create-assignment');
    if (createBtn) createBtn.addEventListener('click', () => this.#openAssignModal());

    const suggestTrigger = this.#container.querySelector('#btn-suggest-modal-trigger');
    if (suggestTrigger) suggestTrigger.addEventListener('click', () => this.openSuggestModal());

    const actFilter = this.#container.querySelector('#asg-filter-act');
    if (actFilter) {
      actFilter.addEventListener('change', (e) => {
        this.#filterActivity = e.target.value;
        this.render();
      });
    }

    const statusFilter = this.#container.querySelector('#asg-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.#filterStatus = e.target.value;
        this.render();
      });
    }

    const clearBtn = this.#container.querySelector('#btn-clear-asg-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.#filterActivity = '';
        this.#filterStatus = '';
        this.render();
      });
    }

    // Status changes
    this.#container.querySelectorAll('.btn-mark-complete').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          assignmentService.updateStatus(btn.dataset.id, 'Completed');
          toast.success('Assignment marked as Completed!');
          this.render();
        } catch (err) {
          toast.error(err.message);
        }
      });
    });

    this.#container.querySelectorAll('.btn-mark-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          assignmentService.updateStatus(btn.dataset.id, 'Cancelled');
          toast.info('Assignment was Cancelled.');
          this.render();
        } catch (err) {
          toast.error(err.message);
        }
      });
    });

    this.#container.querySelectorAll('.btn-del-asg').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.confirm({
          title: 'Delete Assignment Record',
          message: 'Are you sure you want to permanently delete this assignment record?',
          confirmText: 'Delete Record',
          onConfirm: () => {
            assignmentService.delete(btn.dataset.id);
            toast.info('Assignment record deleted.');
            this.render();
          }
        });
      });
    });
  }

  #openAssignModal() {
    const volunteers = volunteerService.getAll().filter(v => v.status === 'Active');
    const tasks = activityService.getAllTasks();

    if (volunteers.length === 0) {
      toast.warning('No active volunteers available to assign.');
      return;
    }
    if (tasks.length === 0) {
      toast.warning('No tasks found. Please create a task first.');
      return;
    }

    const formHtml = `
      <form id="assign-form">
        <div class="form-group">
          <label class="form-label" for="asg-task-select">Select Task <span class="required">*</span></label>
          <select id="asg-task-select" class="form-control" required>
            ${tasks.map(t => {
              const act = activityService.getActivityById(t.activityId);
              const asgs = assignmentService.getAssignmentsForTask(t.id, true);
              const isFull = asgs.length >= t.slots;
              return `
                <option value="${t.id}" ${isFull ? 'disabled' : ''}>
                  ${escapeHtml(t.title)} (${act ? escapeHtml(act.title) : ''}) [${asgs.length}/${t.slots} slots] ${isFull ? '- FULL' : ''}
                </option>
              `;
            }).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="asg-vol-select">Select Active Volunteer <span class="required">*</span></label>
          <select id="asg-vol-select" class="form-control" required>
            ${volunteers.map(v => `
              <option value="${v.id}">
                ${escapeHtml(v.name)} - Skills: ${v.skills.slice(0, 2).join(', ') || 'General'}
              </option>
            `).join('')}
          </select>
        </div>

        <div style="background-color: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-muted);">
          <strong>Rule Validation Safeguards:</strong>
          <ul style="margin-left: 1.25rem; margin-top: 4px;">
            <li>Duplicate assignments are strictly prevented</li>
            <li>Exceeding task slot limit is prevented</li>
            <li>Double-booking a volunteer during the same date & time slot is prevented</li>
          </ul>
        </div>
      </form>
    `;

    modal.open({
      title: 'Manual Task Assignment',
      body: formHtml,
      buttons: [
        {
          label: 'Cancel',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          label: 'Assign Volunteer',
          className: 'btn-primary',
          onClick: () => {
            const form = document.getElementById('assign-form');
            const taskId = form.querySelector('#asg-task-select').value;
            const volunteerId = form.querySelector('#asg-vol-select').value;

            try {
              assignmentService.createAssignment({ volunteerId, taskId });
              const vol = volunteerService.getById(volunteerId);
              const task = activityService.getTaskById(taskId);
              toast.success(`Successfully assigned ${vol ? vol.name : 'volunteer'} to "${task ? task.title : 'task'}".`);
              modal.close();
              this.render();
            } catch (err) {
              // Displays clear, explicit conflict / error message
              toast.error(err.message);
            }
          }
        }
      ]
    });
  }

  /**
   * Smart Volunteer Suggestion Modal
   * @param {string} [initialTaskId]
   */
  openSuggestModal(initialTaskId = null) {
    const tasks = activityService.getAllTasks();
    if (tasks.length === 0) {
      toast.warning('No tasks available for suggestion.');
      return;
    }

    const selectedTaskId = initialTaskId || tasks[0].id;

    const renderModalContent = (taskId) => {
      const task = activityService.getTaskById(taskId);
      const act = activityService.getActivityById(task ? task.activityId : '');
      const suggestions = assignmentService.suggestVolunteersForTask(taskId);
      const existingAssignments = assignmentService.getAssignmentsForTask(taskId, true);
      const isTaskFull = existingAssignments.length >= (task ? task.slots : 0);

      const content = document.createElement('div');
      content.innerHTML = `
        <div style="margin-bottom: 1.25rem;">
          <label class="form-label" for="suggest-task-selector">Select Task to Match Volunteers:</label>
          <select id="suggest-task-selector" class="form-control" style="margin-bottom: 0.75rem;">
            ${tasks.map(t => {
              const a = activityService.getActivityById(t.activityId);
              return `<option value="${t.id}" ${t.id === taskId ? 'selected' : ''}>${escapeHtml(t.title)} (${a ? escapeHtml(a.title) : ''})</option>`;
            }).join('')}
          </select>

          ${task ? `
            <div style="background-color: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.825rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div><strong>Event:</strong> ${act ? escapeHtml(act.title) : ''}</div>
              <div><strong>Date:</strong> ${act ? formatDate(act.date) : ''}</div>
              <div><strong>Required Skill:</strong> <span class="badge badge-skill">${escapeHtml(task.requiredSkill)}</span></div>
              <div><strong>Time Slot:</strong> ${escapeHtml(task.timeSlot)}</div>
              <div><strong>Slots Available:</strong> ${Math.max(0, task.slots - existingAssignments.length)} of ${task.slots}</div>
              <div><strong>Current Status:</strong> ${isTaskFull ? '<span style="color:var(--danger-500); font-weight:700;">Task Full</span>' : '<span style="color:var(--success-500); font-weight:700;">Slots Open</span>'}</div>
            </div>
          ` : ''}
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">
          Ranked Volunteer Recommendations (${suggestions.length} candidates)
        </h4>

        ${suggestions.length === 0 ? `
          <div style="text-align: center; padding: 1.5rem; background-color: var(--bg-subtle); border-radius: var(--radius-md); color: var(--text-muted); font-size: 0.85rem;">
            No suitable unassigned volunteers found without schedule conflicts.
          </div>
        ` : `
          <div style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.65rem;">
            ${suggestions.map(({ volunteer, score, reasons }) => `
              <div class="suggestion-card">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 3px;">
                    <span style="font-weight: 700; color: var(--text-main);">${escapeHtml(volunteer.name)}</span>
                    <span class="score-badge">Match: ${score} pts</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 3px;">
                    Skills: ${volunteer.skills.join(', ') || 'General'}
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                    ${reasons.map(r => `<span style="font-size: 0.7rem; background: var(--bg-surface); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border-color);">${escapeHtml(r)}</span>`).join('')}
                  </div>
                </div>
                <button class="btn btn-primary btn-sm btn-quick-assign-vol" data-vol-id="${volunteer.id}" data-task-id="${taskId}" ${isTaskFull ? 'disabled' : ''}>
                  Assign
                </button>
              </div>
            `).join('')}
          </div>
        `}
      `;

      // Task selector change
      const selector = content.querySelector('#suggest-task-selector');
      if (selector) {
        selector.addEventListener('change', (e) => {
          renderModalContent(e.target.value);
        });
      }

      // Quick assign clicks
      content.querySelectorAll('.btn-quick-assign-vol').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            assignmentService.createAssignment({
              volunteerId: btn.dataset.volId,
              taskId: btn.dataset.taskId
            });
            const vol = volunteerService.getById(btn.dataset.volId);
            toast.success(`Assigned ${vol ? vol.name : 'volunteer'} to task!`);
            modal.close();
            this.render();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

      modal.open({
        title: 'Smart Volunteer Recommendations',
        body: content,
        buttons: [
          {
            label: 'Close',
            className: 'btn-secondary',
            onClick: () => modal.close()
          }
        ]
      });
    };

    renderModalContent(selectedTaskId);
  }
}
