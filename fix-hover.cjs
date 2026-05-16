const fs = require('fs');

// 1. Update pre-screen.ts
let ps = fs.readFileSync('src/ui/views/pre-screen.ts', 'utf8');
ps = ps.replace(
  'background: white !important; border: 1px solid #E5E7EB !important;',
  'background: var(--btn-bg, white) !important; border: 1px solid var(--btn-border, #E5E7EB) !important;'
);
fs.writeFileSync('src/ui/views/pre-screen.ts', ps);

// 2. Update heading-results.ts
let hr = fs.readFileSync('src/ui/views/heading-results.ts', 'utf8');
hr = hr.replace(
  /background: white !important; border: 1px solid \$\{hasIssue \? '#FCA5A5' : '#E5E7EB'\} !important;/g,
  'background: var(--node-bg, white) !important; border: 1px solid var(--node-border, ${hasIssue ? \'#FCA5A5\' : \'#E5E7EB\'}) !important;'
);
fs.writeFileSync('src/ui/views/heading-results.ts', hr);

// 3. Update axe-issue-list.ts
let al = fs.readFileSync('src/ui/views/axe-issue-list.ts', 'utf8');
al = al.replace(
  /background: white !important; border: 1px solid #E5E7EB !important;/g,
  'background: var(--node-bg, white) !important; border: 1px solid var(--node-border, #E5E7EB) !important;'
);
fs.writeFileSync('src/ui/views/axe-issue-list.ts', al);

// 4. Update results-template.ts (back button & a11y-issue-card)
let rt = fs.readFileSync('src/ui/views/results-template.ts', 'utf8');
rt = rt.replace(
  'style="background:none !important;border:none !important;cursor:pointer !important;padding:2px !important;display:flex !important;align-items:center !important;gap:4px !important;font-size:13px !important;color:#6B7280 !important;"',
  'style="background: var(--back-bg, none) !important; border:none !important; cursor:pointer !important; padding:4px 6px !important; margin-left: -4px !important; border-radius: 6px !important; display:flex !important; align-items:center !important; gap:4px !important; font-size:13px !important; color: var(--back-color, #6B7280) !important; transition: background 0.15s, color 0.15s !important;"'
);
fs.writeFileSync('src/ui/views/results-template.ts', rt);

console.log("Updated inline styles to use CSS variables.");
