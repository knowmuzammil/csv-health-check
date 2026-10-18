'use strict';
// CSV parsing and analysis are separate from the interface so they can be tested.
const CSVHealth = (() => {
  function parse(text) {
    text = text.replace(/^\uFEFF/, '');
    if (!text.trim()) throw new Error('This file is empty. Choose a CSV containing a header and data.');
    const rows = []; let row = [], field = '', quoted = false, closed = false;
    function pushField() { row.push(field); field = ''; closed = false; }
    function pushRow() { pushField(); rows.push(row); row = []; }
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) { if (ch === '"') { if (text[i+1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } } else field += ch; }
      else if (ch === ',') pushField();
      else if (ch === '\r' || ch === '\n') { if (ch === '\r' && text[i+1] === '\n') i++; pushRow(); }
      else if (ch === '"' && field === '' && !closed) quoted = true;
      else { if (closed || ch === '"') throw new Error('Invalid CSV quoting. Quote fields containing commas or quotes, and escape quotes by doubling them.'); field += ch; }
    }
    if (quoted) throw new Error('A quoted field is not closed. Check the CSV and try again.');
    if (field || row.length || closed) pushRow();
    const headers = rows.shift();
    if (rows.length > 25000 || headers.length > 100) throw new Error('Use a smaller file: maximum 25,000 data rows and 100 columns.');
    const bad = rows.findIndex(r => r.length !== headers.length && !r.every(v => !v.trim()));
    if (bad !== -1) throw new Error(`Data row ${bad+1} has ${rows[bad].length} fields; the header has ${headers.length}. Check delimiters and quoted commas. No data was changed.`);
    return {headers, rows: rows.map(r => r.every(v => !v.trim()) && r.length !== headers.length ? headers.map(() => '') : r)};
  }
  function type(value) {
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return 'number';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const d = new Date(value+'T00:00:00Z'); if (!isNaN(d) && d.toISOString().slice(0,10) === value) return 'date'; }
    return 'text';
  }
  function analyse(data) {
    let missing = 0, spaces = 0, duplicates = 0, blank = 0; const seen = new Set();
    const columns = data.headers.map((name,index) => ({name:name || `Column ${index+1}`,missing:0,types:new Set()}));
    for (const row of data.rows) {
      const trimmed = row.map(v => v.trim());
      if (trimmed.every(v => !v)) blank++;
      const key = JSON.stringify(trimmed); if (seen.has(key)) duplicates++; seen.add(key);
      row.forEach((value,i) => { if (value !== value.trim()) spaces++; if (!value.trim()) { missing++; columns[i].missing++; } else columns[i].types.add(type(value.trim())); });
    }
    const mixed = columns.filter(c => c.types.size > 1 && (c.types.has('number') || c.types.has('date')));
    return {missing,spaces,duplicates,blank,columns,mixed};
  }
  function clean(data,options) {
    let trimmed = 0, removedEmpty = 0, removedDuplicates = 0; const seen = new Set(), rows = [];
    for (const source of data.rows) {
      const row = source.map(value => { if (options.trim && value !== value.trim()) trimmed++; return options.trim ? value.trim() : value; });
      if (options.blank && row.every(v => !v.trim())) { removedEmpty++; continue; }
      const key = JSON.stringify(row);
      if (options.dedupe && seen.has(key)) { removedDuplicates++; continue; }
      seen.add(key); rows.push(row);
    }
    return {headers:[...data.headers],rows,changes:{trimmed,removedEmpty,removedDuplicates}};
  }
  function stringify(data,protect = true) {
    const cell = value => { value = String(value); if (protect && /^[\s]*[=+@-]/.test(value)) value = "'"+value; return '"'+value.replaceAll('"','""')+'"'; };
    return '\uFEFF'+[data.headers,...data.rows].map(row => row.map(cell).join(',')).join('\r\n');
  }
  return {parse,analyse,clean,stringify};
})();
if (typeof module !== 'undefined') module.exports = CSVHealth;
