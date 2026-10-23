import { volunteerService } from '../services/VolunteerService.js';
import { activityService } from '../services/ActivityService.js';
import { assignmentService } from '../services/AssignmentService.js';
import { formatDate, escapeHtml, getStatusBadgeClass } from '../utils/formatters.js';

export class DashboardView {
  #container;

  constructor(containerId = 'view-dashboard') {
    this.#container = document.getElementById(containerId);
  }

  render() {
    const volunteers = volunteerService.getAll();
    const activities = activityService.getAllActivities();
    const tasks = activityService.getAllTasks();
    const assignments = assignmentService.getAll();

    // Stats calculations
    const totalVolunteers = volunteers.length;
    const activeVolunteers = volunteers.filter(v => v.status === 'Active').length;
    
    const activeActivities = activities.filter(a => a.status === 'Upcoming' || a.status === 'Ongoing').length;
    
    const activeAssignments = assignments.filter(a => a.status !== 'Cancelled');
    const totalSlots = tasks.reduce((sum, t) => sum + t.slots, 0);
    const filledSlots = activeAssignments.length;
    const openSlots = Math.max(0, totalSlots - filledSlots);

    // Upcoming activities (sorted by date)
    const upcomingActivities = activities
      .filter(a => a.status !== 'Completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);

    this.#container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Dashboard Overview</h2>
          <p class="section-description">Real-time status of college events, volunteer participation, and open task slots.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-primary" id="btn-quick-assign">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Assign Volunteer
          </button>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="cards-grid">
        <div class="card stat-card card-hover">
          <div class="stat-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <div class="stat-label">Total Volunteers</div>
            <div class="stat-value">${totalVolunteers}</div>
            <div class="stat-subtext">${activeVolunteers} active members</div>
          </div>
        </div>

        <div class="card stat-card card-hover">
          <div class="stat-icon indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <div class="stat-label">Active Activities</div>
            <div class="stat-value">${activeActivities}</div>
            <div class="stat-subtext">Across campus & community</div>
          </div>
        </div>

        <div class="card stat-card card-hover">
          <div class="stat-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div>
            <div class="stat-label">Open Task Slots</div>
            <div class="stat-value">${openSlots}</div>
            <div class="stat-subtext">${filledSlots} of ${totalSlots} slots assigned</div>
          </div>
        </div>

        <div class="card stat-card card-hover">
          <div class="stat-icon emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div>
            <div class="stat-label">Assignments Made</div>
            <div class="stat-value">${assignments.length}</div>
            <div class="stat-subtext">${assignments.filter(a => a.status === 'Completed').length} successfully completed</div>
          </div>
        </div>
      </div>

      <!-- Charts & Breakdown Section -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        
        <!-- Slot Fulfillment Chart -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.05rem; font-weight:700;">Task Slot Fulfillment</h3>
            <span class="badge badge-neutral">${totalSlots > 0 ? Math.round((filledSlots/totalSlots)*100) : 0}% Filled</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: center; height: 180px;">
            ${this.#renderDonutChart(filledSlots, openSlots)}
          </div>
          <div style="display: flex; justify-content: space-around; font-size: 0.85rem; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color: var(--primary-500);"></span>
              <span>Filled Slots: <strong>${filledSlots}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color: var(--border-color);"></span>
              <span>Open Slots: <strong>${openSlots}</strong></span>
            </div>
          </div>
        </div>

        <!-- In-Demand Skills Chart -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.05rem; font-weight:700;">Top Required Skills for Events</h3>
            <span class="badge badge-neutral">${tasks.length} Total Tasks</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; justify-content: center; min-height: 180px;">
            ${this.#renderSkillBarChart(tasks)}
          </div>
        </div>

      </div>

      <!-- Upcoming Activities Preview -->
      <div class="card" style="padding: 1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight:700;">Upcoming Events & Programs</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Activities requiring volunteer coordination</p>
          </div>
          <a href="#activities" class="btn btn-secondary btn-sm">View All Activities &rarr;</a>
        </div>

        ${upcomingActivities.length === 0 ? `
          <div class="empty-state">
            <p>No upcoming activities. Create your first event in the Activities tab!</p>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Category</th>
                  <th>Date & Venue</th>
                  <th>Volunteer Slots</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${upcomingActivities.map(act => {
                  const stats = activityService.getActivitySlotStats(act.id);
                  return `
                    <tr>
                      <td style="font-weight: 600;">${escapeHtml(act.title)}</td>
                      <td><span class="badge badge-neutral">${escapeHtml(act.category)}</span></td>
                      <td>
                        <div>${formatDate(act.date)}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(act.venue)}</div>
                      </td>
                      <td style="min-width: 140px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                          <span>${stats.filledSlots} of ${stats.totalSlots} slots</span>
                          <span><strong>${stats.percentage}%</strong></span>
                        </div>
                        <div class="progress-container">
                          <div class="progress-bar ${stats.percentage === 100 ? 'complete' : ''}" style="width: ${stats.percentage}%;"></div>
                        </div>
                      </td>
                      <td><span class="badge ${getStatusBadgeClass(act.status)}">${act.status}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    // Hook quick action
    const quickAssignBtn = this.#container.querySelector('#btn-quick-assign');
    if (quickAssignBtn) {
      quickAssignBtn.addEventListener('click', () => {
        window.location.hash = '#assignments';
      });
    }
  }

  /**
   * High-quality responsive SVG Donut Chart
   */
  #renderDonutChart(filled, open) {
    const total = filled + open;
    if (total === 0) {
      return `<div style="color:var(--text-muted); font-size:0.875rem;">No tasks created yet</div>`;
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const filledPercent = filled / total;
    const filledStroke = filledPercent * circumference;
    const openStroke = circumference - filledStroke;

    return `
      <svg width="160" height="160" viewBox="0 0 160 160">
        <!-- Background circle -->
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="20" />
        <!-- Filled segment -->
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--primary-500)" stroke-width="20"
          stroke-dasharray="${filledStroke} ${openStroke}"
          stroke-dashoffset="${circumference * 0.25}"
          stroke-linecap="round"
          style="transition: stroke-dasharray 0.6s ease;"
        />
        <text x="80" y="75" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text-main)">
          ${Math.round(filledPercent * 100)}%
        </text>
        <text x="80" y="95" text-anchor="middle" font-size="11" fill="var(--text-muted)">
          Fulfilled
        </text>
      </svg>
    `;
  }

  /**
   * Render horizontal skill bar breakdown
   */
  #renderSkillBarChart(tasks) {
    if (tasks.length === 0) {
      return `<div style="color:var(--text-muted); font-size:0.875rem;">No tasks defined yet</div>`;
    }

    const skillCounts = {};
    tasks.forEach(t => {
      skillCounts[t.requiredSkill] = (skillCounts[t.requiredSkill] || 0) + t.slots;
    });

    const sortedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const maxCount = Math.max(...sortedSkills.map(s => s[1]), 1);

    return sortedSkills.map(([skill, count]) => {
      const pct = Math.round((count / maxCount) * 100);
      return `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:3px;">
            <span style="font-weight:600;">${escapeHtml(skill)}</span>
            <span style="color:var(--text-muted);">${count} slots</span>
          </div>
          <div class="progress-container" style="height: 6px;">
            <div class="progress-bar" style="width: ${pct}%; background: var(--accent-500);"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}
