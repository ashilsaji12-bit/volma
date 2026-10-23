/**
 * Formatting Utilities
 */

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getStatusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'completed':
      return 'badge-active';
    case 'inactive':
    case 'cancelled':
      return 'badge-inactive';
    case 'upcoming':
    case 'assigned':
      return 'badge-upcoming';
    case 'ongoing':
      return 'badge-ongoing';
    default:
      return 'badge-neutral';
  }
}
