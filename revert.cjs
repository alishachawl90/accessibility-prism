const fs = require('fs');

// 1. Revert pre-screen.ts
let ps = fs.readFileSync('src/ui/views/pre-screen.ts', 'utf8');
ps = ps.replace(
  'const base = `padding: 14px !important; border-radius: 10px !important; cursor: pointer !important; text-align: left !important; font-size: 14px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important; display: flex !important; align-items: center !important; gap: 14px !important; width: 100% !important;`;',
  'const base = `padding: 14px !important; background: white !important; border: 1px solid #E5E7EB !important; border-radius: 10px !important; cursor: pointer !important; text-align: left !important; font-size: 14px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important; transition: border-color 0.15s, box-shadow 0.15s !important; display: flex !important; align-items: center !important; gap: 14px !important; width: 100% !important;`;'
);
fs.writeFileSync('src/ui/views/pre-screen.ts', ps);

// 2. Revert heading-results.ts
let hr = fs.readFileSync('src/ui/views/heading-results.ts', 'utf8');
hr = hr.replace(
  '<div class="heading-node ${hasIssue ? \'has-issue\' : \'\'}" data-idx="${idx}" style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 10px 12px !important; padding-left: ${12 + indent}px !important; margin-bottom: 4px !important; border-left: 3px solid ${color} !important; border-radius: 8px !important; cursor: pointer !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">',
  '<div class="heading-node" data-idx="${idx}" style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 10px 12px !important; padding-left: ${12 + indent}px !important; margin-bottom: 4px !important; background: white !important; border: 1px solid ${hasIssue ? \'#FCA5A5\' : \'#E5E7EB\'} !important; border-left: 3px solid ${color} !important; border-radius: 8px !important; cursor: pointer !important; transition: border-color 0.15s !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">'
);
fs.writeFileSync('src/ui/views/heading-results.ts', hr);

// 3. Revert axe-issue-list.ts
let al = fs.readFileSync('src/ui/views/axe-issue-list.ts', 'utf8');
al = al.replace(
  /style="border-left: 3px solid \${impact\.badge} !important; padding: 16px !important; margin-bottom: 10px !important; cursor: pointer !important; box-shadow: 0 1px 2px rgba\(0,0,0,0\.04\) !important;"/,
  'style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid ${impact.badge} !important; border-radius: 8px !important; padding: 16px !important; margin-bottom: 10px !important; cursor: pointer !important; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;"'
);
al = al.replace(
  '<div class="comp-node" data-cidx="${cIdx}" data-iidx="${iIdx}" data-nidx="${nIdx}" style="padding: 8px 10px !important; margin-bottom: 4px !important; cursor: pointer !important; font-size: 12px !important; color: #374151 !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">',
  '<div class="comp-node" data-cidx="${cIdx}" data-iidx="${iIdx}" data-nidx="${nIdx}" style="padding: 8px 10px !important; margin-bottom: 4px !important; background: white !important; border: 1px solid #E5E7EB !important; border-radius: 6px !important; cursor: pointer !important; font-size: 12px !important; color: #374151 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; transition: border-color 0.15s !important;">'
);
al = al.replace(
  '<div class="group-node" data-pkey="${parentKey}" data-rule="${ruleId}" data-nidx="${nIdx}" style="padding: 8px 10px !important; margin-bottom: 4px !important; cursor: pointer !important; font-size: 12px !important; color: #374151 !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">',
  '<div class="group-node" data-pkey="${parentKey}" data-rule="${ruleId}" data-nidx="${nIdx}" style="padding: 8px 10px !important; margin-bottom: 4px !important; background: white !important; border: 1px solid #E5E7EB !important; border-radius: 6px !important; cursor: pointer !important; font-size: 12px !important; color: #374151 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; transition: border-color 0.15s !important;">'
);
fs.writeFileSync('src/ui/views/axe-issue-list.ts', al);

// 4. Revert results-template.ts (back button)
let rt = fs.readFileSync('src/ui/views/results-template.ts', 'utf8');
rt = rt.replace(
  '<button id="btn-back" class="a11y-btn-back" style="cursor:pointer !important;padding:4px 6px !important; margin-left: -4px !important; border-radius: 6px !important;display:flex !important;align-items:center !important;gap:4px !important;font-size:13px !important;color:#6B7280 !important;">${ICON_CHEVRON_LEFT}<span>${escHtml(config.backLabel || \'Back\')}</span></button>',
  '<button id="btn-back" style="background:none !important;border:none !important;cursor:pointer !important;padding:2px !important;display:flex !important;align-items:center !important;gap:4px !important;font-size:13px !important;color:#6B7280 !important;">${ICON_CHEVRON_LEFT}<span>${escHtml(config.backLabel || \'Back\')}</span></button>'
);
fs.writeFileSync('src/ui/views/results-template.ts', rt);

console.log("Reverted locally.");
