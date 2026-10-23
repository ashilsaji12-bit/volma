import { activityService } from '../services/ActivityService.js';
import { assignmentService } from '../services/AssignmentService.js';
import { volunteerService } from '../services/VolunteerService.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';
import { isNonEmpty, isPositiveNumber } from '../utils/validators.js';
import { escapeHtml, formatDate, getStatusBadgeClass } from '../utils/formatters.js';

export class ActivitiesView {
  #container;
  #filterCategory = '';
  #filterStatus = '';

  constructor(containerId = 'view-activities') {
    this.#container = document.getElementById(containerId);
  }

  render() {
    let activities = activityService.getAllActivities();

    if (this.#filterCategory) {
      activities = activities.filter(a => a.category === this.#filterCategory);
    }
    if (this.#filterStatus) {
      activities = activities.filter(a => a.status === this.#filterStatus);
    }

    this.#container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Campus Activities & Programs</h2>
          <p class="section-description">Organize events, allocate task requirements, and monitor volunteer fulfillment progress.</p>
        </div>
        <button class="btn btn-primary" id="btn-add-activity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Activity
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <select id="act-filter-cat" class="filter-select">
          <option value="">All Categories</option>
          <option value="College Event" ${this.#filterCategory === 'College Event' ? 'selected' : ''}>College Event</option>
          <option value="Community Program" ${this.#filterCategory === 'Community Program' ? 'selected' : ''}>Community Program</option>
          <option value="Workshop" ${this.#filterCategory === 'Workshop' ? 'selected' : ''}>Workshop</option>
        </select>

        <select id="act-filter-status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Upcoming" ${this.#filterStatus === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
          <option value="Ongoing" ${this.#filterStatus === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
          <option value="Completed" ${this.#filterStatus === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>

        ${(this.#filterCategory || this.#filterStatus) ? `
          <button class="btn btn-ghost btn-sm" id="btn-clear-act-filters">Clear Filters</button>
        ` : ''}
      </div>

      <!-- Activities Grid -->
      ${activities.length === 0 ? `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h4 class="empty-state-title">No Activities Found</h4>
          <p class="empty-state-description">Plan your next college event or outreach activity by clicking "Create Activity".</p>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
          ${activities.map(act => {
            const stats = activityService.getActivitySlotStats(act.id);
            const tasks = activityService.getTasksForActivity(act.id);
            return `
              <div class="card card-hover" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <span class="badge badge-neutral">${escapeHtml(act.category)}</span>
                    <span class="badge ${getStatusBadgeClass(act.status)}">${act.status}</span>
                  </div>

                  <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.3;">
                    ${escapeHtml(act.title)}
                  </h3>

                  <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4;">
                    ${escapeHtml(act.description || 'No description provided.')}
                  </p>

                  <div style="background-color: var(--bg-subtle); padding: 0.75rem 0.9rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:var(--text-subtle);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <strong>Date:</strong> ${formatDate(act.date)}
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:var(--text-subtle);"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <strong>Venue:</strong> ${escapeHtml(act.venue)}
                    </div>
                  </div>

                  <!-- Slot Fulfillment Progress -->
                  <div style="margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;">
                      <span>Volunteer Slots: <strong>${stats.filledSlots} / ${stats.totalSlots || act.requiredVolunteers}</strong></span>
                      <span style="font-weight: 700; color: var(--primary-500);">${stats.percentage}% Filled</span>
                    </div>
                    <div class="progress-container">
                      <div class="progress-bar ${stats.percentage === 100 ? 'complete' : ''}" style="width: ${stats.percentage}%;"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                      ${tasks.length} task(s) configured
                    </div>
                  </div>
                </div>

                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <button class="btn btn-secondary btn-sm btn-view-act" data-id="${act.id}">
                    View Tasks & Details
                  </button>
                  <div style="display: flex; gap: 0.35rem;">
                    <button class="btn-icon btn-edit-act" title="Edit Activity" data-id="${act.id}">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                    </button>
                    <button class="btn-icon btn-del-act" title="Delete Activity" data-id="${act.id}" style="color:var(--danger-500);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    this.#attachEvents();
  }

  #attachEvents() {
    const addBtn = this.#container.querySelector('#btn-add-activity');
    if (addBtn) addBtn.addEventListener('click', () => this.#openActivityFormModal());

    const catFilter = this.#container.querySelector('#act-filter-cat');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.#filterCategory = e.target.value;
        this.render();
      });
    }

    const statusFilter = this.#container.querySelector('#act-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.#filterStatus = e.target.value;
        this.render();
      });
    }

    const clearBtn = this.#container.querySelector('#btn-clear-act-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.#filterCategory = '';
        this.#filterStatus = '';
        this.render();
      });
    }

    this.#container.querySelectorAll('.btn-view-act').forEach(btn => {
      btn.addEventListener('click', () => this.#openActivityDetailsModal(btn.dataset.id));
    });

    this.#container.querySelectorAll('.btn-edit-act').forEach(btn => {
      btn.addEventListener('click', () => this.#openActivityFormModal(btn.dataset.id));
    });

    this.#container.querySelectorAll('.btn-del-act').forEach(btn => {
      btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
    });
  }

  #openActivityFormModal(id = null) {
    const isEdit = !!id;
    const existing = isEdit ? activityService.getActivityById(id) : null;

    const formHtml = `
      <form id="activity-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="af-title">Event / Activity Title <span class="required">*</span></label>
          <input type="text" id="af-title" class="form-control" placeholder="e.g. Annual Tech Symposium" value="${existing ? escapeHtml(existing.title) : ''}" required>
          <div class="form-error-msg" id="err-af-title">Title is required.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="af-desc">Description</label>
          <textarea id="af-desc" class="form-control" rows="3" placeholder="Brief outline of the program...">${existing ? escapeHtml(existing.description) : ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="af-date">Event Date <span class="required">*</span></label>
            <input type="date" id="af-date" class="form-control" value="${existing ? existing.date : new Date().toISOString().split('T')[0]}" required>
            <div class="form-error-msg" id="err-af-date">Date is required.</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="af-venue">Venue <span class="required">*</span></label>
            <input type="text" id="af-venue" class="form-control" placeholder="e.g. Seminar Hall 1" value="${existing ? escapeHtml(existing.venue) : ''}" required>
            <div class="form-error-msg" id="err-af-venue">Venue is required.</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="af-category">Category</label>
            <select id="af-category" class="form-control">
              <option value="College Event" ${(!existing || existing.category === 'College Event') ? 'selected' : ''}>College Event</option>
              <option value="Community Program" ${existing && existing.category === 'Community Program' ? 'selected' : ''}>Community Program</option>
              <option value="Workshop" ${existing && existing.category === 'Workshop' ? 'selected' : ''}>Workshop</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="af-status">Status</label>
            <select id="af-status" class="form-control">
              <option value="Upcoming" ${(!existing || existing.status === 'Upcoming') ? 'selected' : ''}>Upcoming</option>
              <option value="Ongoing" ${existing && existing.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
              <option value="Completed" ${existing && existing.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="af-target">Target Volunteers</label>
          <input type="number" id="af-target" class="form-control" min="1" value="${existing ? existing.requiredVolunteers : 5}">
        </div>
      </form>
    `;

    modal.open({
      title: isEdit ? 'Edit Activity Details' : 'Create New Activity',
      body: formHtml,
      buttons: [
        {
          label: 'Cancel',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          label: isEdit ? 'Save Changes' : 'Create Activity',
          className: 'btn-primary',
          onClick: () => {
            const form = document.getElementById('activity-form');
            const title = form.querySelector('#af-title').value.trim();
            const description = form.querySelector('#af-desc').value.trim();
            const date = form.querySelector('#af-date').value;
            const venue = form.querySelector('#af-venue').value.trim();
            const category = form.querySelector('#af-category').value;
            const status = form.querySelector('#af-status').value;
            const requiredVolunteers = form.querySelector('#af-target').value;

            let hasErrors = false;

            if (!isNonEmpty(title)) {
              form.querySelector('#err-af-title').classList.add('visible');
              form.querySelector('#af-title').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-af-title').classList.remove('visible');
              form.querySelector('#af-title').classList.remove('is-invalid');
            }

            if (!isNonEmpty(venue)) {
              form.querySelector('#err-af-venue').classList.add('visible');
              form.querySelector('#af-venue').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-af-venue').classList.remove('visible');
              form.querySelector('#af-venue').classList.remove('is-invalid');
            }

            if (!date) {
              form.querySelector('#err-af-date').classList.add('visible');
              form.querySelector('#af-date').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-af-date').classList.remove('visible');
              form.querySelector('#af-date').classList.remove('is-invalid');
            }

            if (hasErrors) return;

            try {
              if (isEdit) {
                activityService.updateActivity(id, {
                  title,
                  description,
                  date,
                  venue,
                  category,
                  status,
                  requiredVolunteers: parseInt(requiredVolunteers, 10) || 5
                });
                toast.success(`Activity "${title}" updated.`);
              } else {
                activityService.createActivity({
                  title,
                  description,
                  date,
                  venue,
                  category,
                  status,
                  requiredVolunteers: parseInt(requiredVolunteers, 10) || 5
                });
                toast.success(`Activity "${title}" created.`);
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

  #openActivityDetailsModal(id) {
    const act = activityService.getActivityById(id);
    if (!act) return;

    const tasks = activityService.getTasksForActivity(id);
    const stats = activityService.getActivitySlotStats(id);

    const bodyHtml = `
      <div style="margin-bottom: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700;">${escapeHtml(act.title)}</h3>
            <span class="badge badge-neutral" style="margin-top: 4px;">${escapeHtml(act.category)}</span>
          </div>
          <span class="badge ${getStatusBadgeClass(act.status)}">${act.status}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 1rem; line-height: 1.4;">
          ${escapeHtml(act.description || 'No description provided.')}
        </p>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1rem;">
          <div><strong>Date:</strong> ${formatDate(act.date)}</div>
          <div><strong>Venue:</strong> ${escapeHtml(act.venue)}</div>
          <div><strong>Total Task Slots:</strong> ${stats.totalSlots}</div>
          <div><strong>Filled:</strong> ${stats.filledSlots} (${stats.percentage}%)</div>
        </div>

        <div class="progress-container" style="margin-bottom: 1.5rem;">
          <div class="progress-bar ${stats.percentage === 100 ? 'complete' : ''}" style="width: ${stats.percentage}%;"></div>
        </div>

        <!-- Associated Tasks List -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700;">Activity Tasks & Volunteers</h4>
          <a href="#tasks" class="btn btn-secondary btn-sm" id="btn-goto-tasks">Manage All Tasks &rarr;</a>
        </div>

        ${tasks.length === 0 ? `
          <div style="text-align: center; padding: 1.5rem; background: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-muted);">
            No tasks have been created for this activity yet.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 240px; overflow-y: auto;">
            ${tasks.map(task => {
              const taskAssignments = assignmentService.getAssignmentsForTask(task.id, true);
              const assignedVolunteers = taskAssignments.map(asg => {
                const vol = volunteerService.getById(asg.volunteerId);
                return vol ? vol.name : 'Unknown';
              });

              return `
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; background: var(--bg-surface);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(task.title)}</div>
                    <span class="badge ${taskAssignments.length >= task.slots ? 'badge-completed' : 'badge-upcoming'}">
                      ${taskAssignments.length} / ${task.slots} Filled
                    </span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                    <span>Skill: <strong>${escapeHtml(task.requiredSkill)}</strong></span>
                    <span>Time: <strong>${escapeHtml(task.timeSlot)}</strong></span>
                  </div>
                  <div style="font-size: 0.75rem;">
                    <strong>Assigned:</strong> ${assignedVolunteers.length > 0
                      ? assignedVolunteers.map(n => `<span style="display:inline-block; background:var(--bg-subtle); padding:2px 6px; border-radius:4px; margin-right:4px;">${escapeHtml(n)}</span>`).join('')
                      : '<span style="color:var(--text-subtle);">None yet</span>'
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    modal.open({
      title: 'Activity Overview',
      body: bodyHtml,
      buttons: [
        {
          label: 'Close',
          className: 'btn-secondary',
          onClick: () => modal.close()
        }
      ]
    });

    const gotoTasksBtn = document.getElementById('btn-goto-tasks');
    if (gotoTasksBtn) {
      gotoTasksBtn.addEventListener('click', () => modal.close());
    }
  }

  #confirmDelete(id) {
    const act = activityService.getActivityById(id);
    if (!act) return;

    modal.confirm({
      title: 'Delete Activity',
      message: `Are you sure you want to delete "${act.title}"? This will also remove its associated tasks and volunteer assignments.`,
      confirmText: 'Delete Activity',
      onConfirm: () => {
        activityService.deleteActivity(id);
        toast.info(`Activity "${act.title}" was deleted.`);
        this.render();
      }
    });
  }
}
