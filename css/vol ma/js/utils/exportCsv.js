/**
 * Utility to export an array of data objects to CSV and trigger browser download
 * 
 * @param {Array<Object>} rows
 * @param {Array<{ key: string, label: string }>} columns
 * @param {string} filename
 */
export function exportToCsv(rows, columns, filename = 'export.csv') {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Header row
  const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const dataRows = rows.map(row => {
    return columns.map(c => {
      let val = row[c.key];
      if (Array.isArray(val)) {
        val = val.join('; ');
      } else if (val === null || val === undefined) {
        val = '';
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [header, ...dataRows].join('\r\n'); // UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
