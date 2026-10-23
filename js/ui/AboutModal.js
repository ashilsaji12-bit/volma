import { modal } from './Modal.js';

export function openAboutModal() {
  const content = `
    <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main);">
      
      <!-- Project Header -->
      <div style="background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.12), rgba(var(--accent-rgb), 0.12)); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
        <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--primary-500);">
          Volunteer Management System (VMS)
        </h4>
        <p style="color: var(--text-muted); font-size: 0.85rem;">
          A full-stack, responsive web application designed for organizing volunteers for college events, workshops, and community outreach drives.
        </p>
      </div>

      <!-- Team Members -->
      <div style="margin-bottom: 1.25rem;">
        <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
          Project Team &bull; Group 12 (S3 CSE DS)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.6rem;">
          <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--primary-500);">
            <strong>Aadhi Lakshmi S</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 01</div>
          </div>
          <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--primary-500);">
            <strong>Anusree Anilkumar</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 17</div>
          </div>
          <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-500);">
            <strong>Sooraj Rajendran</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 50</div>
          </div>
          <div style="background: var(--bg-subtle); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-500);">
            <strong>George Thankachan</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Roll No: 55</div>
          </div>
        </div>
      </div>

      <!-- OOP Concepts in Viva -->
      <div style="margin-bottom: 1rem;">
        <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
          OOP Concepts Implementation (Viva Reference)
        </h5>
        <div style="background: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.825rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div>
            <strong style="color: var(--primary-500);">1. Encapsulation:</strong>
            ES6 private class fields (e.g. <code>#id</code>, <code>#name</code>, <code>#email</code>) guarded by getter and setter validations (e.g. email regex, 10-digit phone checks).
          </div>
          <div>
            <strong style="color: var(--primary-500);">2. Inheritance:</strong>
            <code>Volunteer</code> and <code>Coordinator</code> extend the base class <code>Person</code> via <code>extends Person</code> and delegate initialization using <code>super()</code>.
          </div>
          <div>
            <strong style="color: var(--primary-500);">3. Polymorphism:</strong>
            Subclasses override <code>getRoleDescription()</code> and <code>getSummary()</code> dynamically, allowing runtime polymorphic behavior across person types.
          </div>
          <div>
            <strong style="color: var(--primary-500);">4. Abstraction:</strong>
            <code>StorageService</code> abstracts persistence interactions behind a clean CRUD repository interface, decoupling domain models from storage mechanisms.
          </div>
        </div>
      </div>

    </div>
  `;

  modal.open({
    title: 'About Volunteer Management System',
    body: content,
    buttons: [
      {
        label: 'Close',
        className: 'btn-secondary',
        onClick: () => modal.close()
      }
    ]
  });
}
