/**
 * Main Application Orchestrator & Router
 * College Project: Volunteer Management System
 * Group 12 (S3 CSE DS)
 */

import { DashboardView } from './ui/DashboardView.js';
import { VolunteersView } from './ui/VolunteersView.js';
import { ActivitiesView } from './ui/ActivitiesView.js';
import { TasksView } from './ui/TasksView.js';
import { AssignmentsView } from './ui/AssignmentsView.js';
import { ReportsView } from './ui/ReportsView.js';
import { openAboutModal } from './ui/AboutModal.js';

class App {
  #views = {};
  #currentRoute = 'dashboard';

  init() {
    this.#initViews();
    this.#initTheme();
    this.#initNavigation();
    this.#initMobileDrawer();
    this.#initRouting();
  }

  #initViews() {
    this.#views = {
      dashboard: new DashboardView('view-dashboard'),
      volunteers: new VolunteersView('view-volunteers'),
      activities: new ActivitiesView('view-activities'),
      tasks: new TasksView('view-tasks'),
      assignments: new AssignmentsView('view-assignments'),
      reports: new ReportsView('view-reports')
    };
  }

  #initTheme() {
    const savedTheme = localStorage.getItem('vms_theme') || 'light';
    this.#applyTheme(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.#applyTheme(newTheme);
      });
    }
  }

  #applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vms_theme', theme);

    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      if (theme === 'dark') {
        // Moon to Sun icon
        themeIcon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
      } else {
        // Sun to Moon icon
        themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
  }

  #initMobileDrawer() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (mobileBtn && sidebar && backdrop) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('open');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      });
    }
  }

  #initNavigation() {
    // Nav items click handler
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', () => {
        // Close sidebar on mobile upon navigation
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
      });
    });

    // About project button
    const aboutBtn = document.getElementById('btn-about-project');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAboutModal();
      });
    }

    const headerAboutBtn = document.getElementById('header-about-btn');
    if (headerAboutBtn) {
      headerAboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAboutModal();
      });
    }
  }

  #initRouting() {
    window.addEventListener('hashchange', () => this.#handleRoute());
    // Initial route handling
    this.#handleRoute();
  }

  #handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    
    // Parse query params if any e.g. assignments?suggestTaskId=tsk_301
    const [route, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');

    const validRoutes = ['dashboard', 'volunteers', 'activities', 'tasks', 'assignments', 'reports'];
    const activeRoute = validRoutes.includes(route) ? route : 'dashboard';

    this.#currentRoute = activeRoute;

    // Update active nav link
    document.querySelectorAll('.nav-item').forEach(link => {
      const linkRoute = link.getAttribute('href').replace('#', '').split('?')[0];
      if (linkRoute === activeRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Header title
    const headerTitle = document.getElementById('page-header-title');
    if (headerTitle) {
      headerTitle.textContent = activeRoute.charAt(0).toUpperCase() + activeRoute.slice(1);
    }

    // Toggle view containers
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    const activeSection = document.getElementById(`view-${activeRoute}`);
    if (activeSection) {
      activeSection.classList.add('active');
    }

    // Render active view
    if (this.#views[activeRoute]) {
      if (activeRoute === 'assignments' && params.has('suggestTaskId')) {
        this.#views[activeRoute].render(params.get('suggestTaskId'));
      } else {
        this.#views[activeRoute].render();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
