import { volunteerService } from '../services/VolunteerService.js';
import { activityService } from '../services/ActivityService.js';
import { assignmentService } from '../services/AssignmentService.js';
import { exportToCsv } from '../utils/exportCsv.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';
import { formatDate } from '../utils/formatters.js';

export class ReportsView {
  #container;

  constructor(containerId = 'view-reports') {
    this.#container = document.getElementById(containerId);
  }

  render() {
    const volunteers = volunteerService.getAll();
    const activities = activityService.getAllActivities();
    const tasks = activityService.getAllTasks();
    const assignments = assignmentService.getAll();

    const activeVols = volunteers.filter(v => v.status === 'Active').length;
    const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
    const completionRate = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

    this.#container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Reports & Data Analytics</h2>
          <p class="section-description">Export data to CSV spreadsheets, generate print-friendly reports, and manage system database records.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" id="btn-print-report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Report
          </button>
          <button class="btn btn-danger" id="btn-reset-demo-data">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            Reset Demo Data
          </button>
        </div>
      </div>

      <!-- Quick Export Cards -->
      <div class="cards-grid" style="margin-bottom: 2rem;">
        
        <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <div class="stat-icon teal" style="width:40px;height:40px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              </div>
              <h3 style="font-size:1.1rem; font-weight:700;">Volunteers Data</h3>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Export all registered student volunteers with contact info, skills, and availability schedules.
            </p>
            <div style="font-size:0.8rem; color:var(--text-main); margin-bottom:1rem;">
              Total Records: <strong>${volunteers.length}</strong> (${activeVols} active)
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-volunteers" style="width:100%;">
            Download Volunteers CSV
          </button>
        </div>

        <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <div class="stat-icon indigo" style="width:40px;height:40px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line></svg>
              </div>
              <h3 style="font-size:1.1rem; font-weight:700;">Activities & Events</h3>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Export all college events, workshops, dates, venues, categories, and required volunteers.
            </p>
            <div style="font-size:0.8rem; color:var(--text-main); margin-bottom:1rem;">
              Total Activities: <strong>${activities.length}</strong> (${tasks.length} tasks)
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-activities" style="width:100%;">
            Download Activities CSV
          </button>
        </div>

        <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <div class="stat-icon emerald" style="width:40px;height:40px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h3 style="font-size:1.1rem; font-weight:700;">Assignments & Audit</h3>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Export full task allocation history, status tracking, timestamps, and volunteer participation.
            </p>
            <div style="font-size:0.8rem; color:var(--text-main); margin-bottom:1rem;">
              Total Allocations: <strong>${assignments.length}</strong> (${completionRate}% completed)
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-assignments" style="width:100%;">
            Download Assignments CSV
          </button>
        </div>

      </div>

      <!-- Print-Friendly Summary Table -->
      <div class="card" style="padding:1.5rem;">
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.5rem;">System Summary Snapshot</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;">
          Consolidated activity status and volunteer participation metrics.
        </p>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Event / Program</th>
                <th>Date & Venue</th>
                <th>Category</th>
                <th>Tasks Count</th>
                <th>Allocated / Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${activities.map(act => {
                const actTasks = activityService.getTasksForActivity(act.id);
                const stats = activityService.getActivitySlotStats(act.id);
                return `
                  <tr>
                    <td style="font-weight:600;">${act.title}</td>
                    <td>${formatDate(act.date)} &bull; ${act.venue}</td>
                    <td>${act.category}</td>
                    <td>${actTasks.length} tasks</td>
                    <td>${stats.filledSlots} of ${stats.totalSlots || act.requiredVolunteers} slots (${stats.percentage}%)</td>
                    <td><strong>${act.status}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.#attachEvents();
  }

  #attachEvents() {
    // Print report
    const printBtn = this.#container.querySelector('#btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Reset Demo Data
    const resetBtn = this.#container.querySelector('#btn-reset-demo-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        modal.confirm({
          title: 'Reset Demo Data',
          message: 'This will reset all volunteers, activities, tasks, and assignments back to the initial sample college dataset. Any custom records will be overwritten. Proceed?',
          confirmText: 'Reset Everything',
          onConfirm: () => {
            volunteerService.resetToDefault();
            activityService.resetToDefault();
            assignmentService.resetToDefault();
            toast.success('System demo dataset has been reloaded!');
            this.render();
          }
        });
      });
    }

    // Export Volunteers CSV
    const exportVolBtn = this.#container.querySelector('#btn-export-volunteers');
    if (exportVolBtn) {
      exportVolBtn.addEventListener('click', () => {
        const volunteers = volunteerService.getAll().map(v => v.toJSON());
        exportToCsv(
          volunteers,
          [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' },
            { key: 'joinedDate', label: 'Joined Date' },
            { key: 'skills', label: 'Skills' },
            { key: 'availability', label: 'Availability' }
          ],
          'Volunteers_Report.csv'
        );
        toast.success('Volunteers CSV downloaded successfully.');
      });
    }

    // Export Activities CSV
    const exportActBtn = this.#container.querySelector('#btn-export-activities');
    if (exportActBtn) {
      exportActBtn.addEventListener('click', () => {
        const activities = activityService.getAllActivities().map(a => a.toJSON());
        exportToCsv(
          activities,
          [
            { key: 'id', label: 'Activity ID' },
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'date', label: 'Date' },
            { key: 'venue', label: 'Venue' },
            { key: 'requiredVolunteers', label: 'Required Volunteers' },
            { key: 'status', label: 'Status' },
            { key: 'description', label: 'Description' }
          ],
          'Activities_Report.csv'
        );
        toast.success('Activities CSV downloaded successfully.');
      });
    }

    // Export Assignments CSV
    const exportAsgBtn = this.#container.querySelector('#btn-export-assignments');
    if (exportAsgBtn) {
      exportAsgBtn.addEventListener('click', () => {
        const assignments = assignmentService.getAll();
        const enriched = assignments.map(a => {
          const vol = volunteerService.getById(a.volunteerId);
          const act = activityService.getActivityById(a.activityId);
          const task = activityService.getTaskById(a.taskId);
          return {
            id: a.id,
            volunteerName: vol ? vol.name : a.volunteerId,
            volunteerEmail: vol ? vol.email : '',
            activityTitle: act ? act.title : a.activityId,
            activityDate: act ? act.date : '',
            taskTitle: task ? task.title : a.taskId,
            requiredSkill: task ? task.requiredSkill : '',
            timeSlot: task ? task.timeSlot : '',
            status: a.status,
            assignedDate: a.assignedDate
          };
        });

        exportToCsv(
          enriched,
          [
            { key: 'id', label: 'Assignment ID' },
            { key: 'volunteerName', label: 'Volunteer Name' },
            { key: 'volunteerEmail', label: 'Volunteer Email' },
            { key: 'activityTitle', label: 'Event / Activity' },
            { key: 'activityDate', label: 'Event Date' },
            { key: 'taskTitle', label: 'Task' },
            { key: 'requiredSkill', label: 'Skill' },
            { key: 'timeSlot', label: 'Time Slot' },
            { key: 'status', label: 'Status' },
            { key: 'assignedDate', label: 'Assigned Date' }
          ],
          'Assignments_Report.csv'
        );
        toast.success('Assignments CSV downloaded successfully.');
      });
    }
  }
}
