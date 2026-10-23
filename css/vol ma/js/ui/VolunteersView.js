import { volunteerService } from '../services/VolunteerService.js';
import { assignmentService } from '../services/AssignmentService.js';
import { SKILL_OPTIONS, AVAILABILITY_OPTIONS } from '../services/SeedData.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';
import { isValidEmail, isValidPhone, isNonEmpty } from '../utils/validators.js';
import { escapeHtml, formatDate, getStatusBadgeClass } from '../utils/formatters.js';

export class VolunteersView {
  #container;
  #currentFilters = {
    search: '',
    skill: '',
    availability: '',
    status: ''
  };

  constructor(containerId = 'view-volunteers') {
    this.#container = document.getElementById(containerId);
  }

  render() {
    const volunteers = volunteerService.searchAndFilter(this.#currentFilters);

    this.#container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Volunteers Directory</h2>
          <p class="section-description">Manage student volunteers, skill sets, availability schedules, and participation records.</p>
        </div>
        <button class="btn btn-primary" id="btn-add-volunteer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Volunteer
        </button>
      </div>

      <!-- Filter & Search Bar -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="vol-search-input" class="search-input" placeholder="Search by name, email, or phone..." value="${escapeHtml(this.#currentFilters.search)}">
        </div>

        <select id="vol-filter-skill" class="filter-select">
          <option value="">All Skills</option>
          ${SKILL_OPTIONS.map(s => `<option value="${escapeHtml(s)}" ${this.#currentFilters.skill === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
        </select>

        <select id="vol-filter-avail" class="filter-select">
          <option value="">All Availabilities</option>
          ${AVAILABILITY_OPTIONS.map(a => `<option value="${escapeHtml(a)}" ${this.#currentFilters.availability === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
        </select>

        <select id="vol-filter-status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Active" ${this.#currentFilters.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${this.#currentFilters.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
        </select>

        ${(this.#currentFilters.search || this.#currentFilters.skill || this.#currentFilters.availability || this.#currentFilters.status) ? `
          <button class="btn btn-ghost btn-sm" id="btn-clear-vol-filters" title="Reset Filters">
            Clear Filters
          </button>
        ` : ''}
      </div>

      <!-- Volunteers Table -->
      ${volunteers.length === 0 ? `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h4 class="empty-state-title">No Volunteers Found</h4>
          <p class="empty-state-description">Try adjusting your search criteria or register a new volunteer.</p>
        </div>
      ` : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Volunteer Name</th>
                <th>Contact Info</th>
                <th>Skills</th>
                <th>Availability</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${volunteers.map(vol => `
                <tr data-id="${vol.id}">
                  <td>
                    <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(vol.name)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">${escapeHtml(vol.getRoleDescription())}</div>
                  </td>
                  <td>
                    <div>${escapeHtml(vol.email)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(vol.phone)}</div>
                  </td>
                  <td style="max-width: 240px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                      ${vol.skills.slice(0, 3).map(s => `<span class="badge badge-skill">${escapeHtml(s)}</span>`).join('')}
                      ${vol.skills.length > 3 ? `<span class="badge badge-neutral">+${vol.skills.length - 3}</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                      ${vol.availability.join(', ') || 'Flexible'}
                    </div>
                  </td>
                  <td>
                    <span class="badge ${getStatusBadgeClass(vol.status)}">${vol.status}</span>
                  </td>
                  <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                      <button class="btn-icon btn-view-vol" title="View Profile & Participation" data-id="${vol.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      <button class="btn-icon btn-edit-vol" title="Edit Volunteer" data-id="${vol.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                      </button>
                      <button class="btn-icon btn-del-vol" title="Delete Volunteer" data-id="${vol.id}" style="color:var(--danger-500);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    this.#attachEvents();
  }

  #attachEvents() {
    // Add volunteer
    const addBtn = this.#container.querySelector('#btn-add-volunteer');
    if (addBtn) addBtn.addEventListener('click', () => this.#openVolunteerFormModal());

    // Search and filters
    const searchInput = this.#container.querySelector('#vol-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.#currentFilters.search = e.target.value;
        this.render();
      });
    }

    const skillFilter = this.#container.querySelector('#vol-filter-skill');
    if (skillFilter) {
      skillFilter.addEventListener('change', (e) => {
        this.#currentFilters.skill = e.target.value;
        this.render();
      });
    }

    const availFilter = this.#container.querySelector('#vol-filter-avail');
    if (availFilter) {
      availFilter.addEventListener('change', (e) => {
        this.#currentFilters.availability = e.target.value;
        this.render();
      });
    }

    const statusFilter = this.#container.querySelector('#vol-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.#currentFilters.status = e.target.value;
        this.render();
      });
    }

    const clearBtn = this.#container.querySelector('#btn-clear-vol-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.#currentFilters = { search: '', skill: '', availability: '', status: '' };
        this.render();
      });
    }

    // Row Actions
    this.#container.querySelectorAll('.btn-view-vol').forEach(btn => {
      btn.addEventListener('click', () => this.#openProfileModal(btn.dataset.id));
    });

    this.#container.querySelectorAll('.btn-edit-vol').forEach(btn => {
      btn.addEventListener('click', () => this.#openVolunteerFormModal(btn.dataset.id));
    });

    this.#container.querySelectorAll('.btn-del-vol').forEach(btn => {
      btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
    });
  }

  #openVolunteerFormModal(id = null) {
    const isEdit = !!id;
    const existing = isEdit ? volunteerService.getById(id) : null;

    const currentSkills = existing ? existing.skills : [];
    const currentAvail = existing ? existing.availability : [];

    const formHtml = `
      <form id="volunteer-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="vf-name">Full Name <span class="required">*</span></label>
          <input type="text" id="vf-name" class="form-control" placeholder="e.g. Aadhi Lakshmi S" value="${existing ? escapeHtml(existing.name) : ''}" required>
          <div class="form-error-msg" id="err-vf-name">Name is required.</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="vf-email">Email Address <span class="required">*</span></label>
            <input type="email" id="vf-email" class="form-control" placeholder="student@college.edu" value="${existing ? escapeHtml(existing.email) : ''}" required>
            <div class="form-error-msg" id="err-vf-email">Enter a valid email address.</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="vf-phone">Phone (10 Digits) <span class="required">*</span></label>
            <input type="tel" id="vf-phone" class="form-control" placeholder="9876543210" maxlength="10" value="${existing ? escapeHtml(existing.phone) : ''}" required>
            <div class="form-error-msg" id="err-vf-phone">Enter a valid 10-digit phone number.</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="vf-status">Status</label>
            <select id="vf-status" class="form-control">
              <option value="Active" ${(!existing || existing.status === 'Active') ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${existing && existing.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="vf-date">Joined Date</label>
            <input type="date" id="vf-date" class="form-control" value="${existing ? existing.joinedDate : new Date().toISOString().split('T')[0]}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Select Skills</label>
          <div class="skills-checkbox-grid">
            ${SKILL_OPTIONS.map(skill => `
              <label class="checkbox-label">
                <input type="checkbox" name="skills" value="${escapeHtml(skill)}" ${currentSkills.includes(skill) ? 'checked' : ''}>
                <span>${escapeHtml(skill)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Select Availability Schedules</label>
          <div class="skills-checkbox-grid">
            ${AVAILABILITY_OPTIONS.map(avail => `
              <label class="checkbox-label">
                <input type="checkbox" name="availability" value="${escapeHtml(avail)}" ${currentAvail.includes(avail) ? 'checked' : ''}>
                <span>${escapeHtml(avail)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </form>
    `;

    modal.open({
      title: isEdit ? 'Edit Volunteer Details' : 'Register New Volunteer',
      body: formHtml,
      buttons: [
        {
          label: 'Cancel',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          label: isEdit ? 'Save Changes' : 'Register Volunteer',
          className: 'btn-primary',
          onClick: () => {
            const form = document.getElementById('volunteer-form');
            const name = form.querySelector('#vf-name').value.trim();
            const email = form.querySelector('#vf-email').value.trim();
            const phone = form.querySelector('#vf-phone').value.trim();
            const status = form.querySelector('#vf-status').value;
            const joinedDate = form.querySelector('#vf-date').value;

            const selectedSkills = Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
            const selectedAvail = Array.from(form.querySelectorAll('input[name="availability"]:checked')).map(cb => cb.value);

            let hasErrors = false;

            // Name validation
            if (!isNonEmpty(name)) {
              form.querySelector('#err-vf-name').classList.add('visible');
              form.querySelector('#vf-name').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-vf-name').classList.remove('visible');
              form.querySelector('#vf-name').classList.remove('is-invalid');
            }

            // Email validation
            if (!isValidEmail(email)) {
              form.querySelector('#err-vf-email').classList.add('visible');
              form.querySelector('#vf-email').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-vf-email').classList.remove('visible');
              form.querySelector('#vf-email').classList.remove('is-invalid');
            }

            // Phone validation
            if (!isValidPhone(phone)) {
              form.querySelector('#err-vf-phone').classList.add('visible');
              form.querySelector('#vf-phone').classList.add('is-invalid');
              hasErrors = true;
            } else {
              form.querySelector('#err-vf-phone').classList.remove('visible');
              form.querySelector('#vf-phone').classList.remove('is-invalid');
            }

            if (hasErrors) return;

            try {
              if (isEdit) {
                volunteerService.update(id, {
                  name,
                  email,
                  phone,
                  status,
                  joinedDate,
                  skills: selectedSkills,
                  availability: selectedAvail
                });
                toast.success(`Volunteer "${name}" updated successfully.`);
              } else {
                volunteerService.create({
                  name,
                  email,
                  phone,
                  status,
                  joinedDate,
                  skills: selectedSkills,
                  availability: selectedAvail
                });
                toast.success(`Volunteer "${name}" registered successfully.`);
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

  #openProfileModal(id) {
    const vol = volunteerService.getById(id);
    if (!vol) return;

    const participation = assignmentService.getVolunteerParticipation(id);

    const bodyHtml = `
      <div style="margin-bottom: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.75rem;">
          <div>
            <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main);">${escapeHtml(vol.name)}</h3>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              ${escapeHtml(vol.getRoleDescription())}
            </div>
            <div style="font-size: 0.8rem; color: var(--primary-500); margin-top: 2px; font-weight:500;">
              Polymorphic Summary: "${escapeHtml(vol.getSummary())}"
            </div>
          </div>
          <span class="badge ${getStatusBadgeClass(vol.status)}">${vol.status}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; background-color: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem;">
          <div><strong>Email:</strong> ${escapeHtml(vol.email)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(vol.phone)}</div>
          <div><strong>Member Since:</strong> ${formatDate(vol.joinedDate)}</div>
          <div><strong>Available:</strong> ${vol.availability.join(', ') || 'Flexible'}</div>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Registered Skills</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
          ${vol.skills.length > 0
            ? vol.skills.map(s => `<span class="badge badge-skill">${escapeHtml(s)}</span>`).join('')
            : '<span style="font-size:0.8rem; color:var(--text-muted);">No specific skills recorded</span>'}
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700;">Participation Record</h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            Completed: <strong>${participation.completed}</strong> / Total: <strong>${participation.total}</strong>
          </span>
        </div>

        ${participation.assignments.length === 0 ? `
          <div style="padding: 1.5rem; text-align: center; background-color: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-muted);">
            No tasks assigned yet.
          </div>
        ` : `
          <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
            <table class="data-table" style="font-size: 0.8rem;">
              <thead>
                <tr>
                  <th>Event / Activity</th>
                  <th>Task Title</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${participation.assignments.map(asg => `
                  <tr>
                    <td style="font-weight: 600;">${escapeHtml(asg.activityTitle)}</td>
                    <td>${escapeHtml(asg.taskTitle)}</td>
                    <td>${escapeHtml(asg.taskTimeSlot)}</td>
                    <td><span class="badge ${getStatusBadgeClass(asg.status)}">${asg.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    modal.open({
      title: 'Volunteer Profile & History',
      body: bodyHtml,
      buttons: [
        {
          label: 'Close',
          className: 'btn-secondary',
          onClick: () => modal.close()
        }
      ]
    });
  }

  #confirmDelete(id) {
    const vol = volunteerService.getById(id);
    if (!vol) return;

    modal.confirm({
      title: 'Delete Volunteer',
      message: `Are you sure you want to remove "${vol.name}" from the system? Any existing assignments associated with this volunteer will also be updated.`,
      confirmText: 'Delete Volunteer',
      onConfirm: () => {
        volunteerService.delete(id);
        toast.info(`Volunteer "${vol.name}" was removed.`);
        this.render();
      }
    });
  }
}
