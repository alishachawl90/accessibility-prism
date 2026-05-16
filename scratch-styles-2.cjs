const fs = require('fs');

// Fix panel-styles.ts
let styles = fs.readFileSync('src/ui/panel-styles.ts', 'utf8');
styles = styles.replace(
  '#a11y-analyzer-panel .heading-node {',
  '#a11y-analyzer-panel .heading-node {\n    border-radius: 8px !important;'
);
styles = styles.replace(
  '#a11y-analyzer-panel .group-node,',
  '#a11y-analyzer-panel .group-node {\n    border-radius: 6px !important;\n  }\n  #a11y-analyzer-panel .group-node,'
);
styles = styles.replace(
  '#a11y-analyzer-panel .comp-node,',
  '#a11y-analyzer-panel .comp-node {\n    border-radius: 6px !important;\n  }\n  #a11y-analyzer-panel .comp-node,'
);
styles = styles.replace(
  '#a11y-analyzer-panel .rule-card,',
  '#a11y-analyzer-panel .rule-card {\n    border-radius: 8px !important;\n  }\n  #a11y-analyzer-panel .rule-card,'
);
fs.writeFileSync('src/ui/panel-styles.ts', styles);

// Fix axe-issue-list.ts rule-card inline style
let axe = fs.readFileSync('src/ui/views/axe-issue-list.ts', 'utf8');
axe = axe.replace(
  /style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid \${impact\.badge} !important; border-radius: 8px !important; padding: 16px !important; margin-bottom: 10px !important; cursor: pointer !important; transition: border-color 0\.15s; box-shadow: 0 1px 2px rgba\(0,0,0,0\.04\) !important;"/,
  'style="border-left: 3px solid ${impact.badge} !important; padding: 16px !important; margin-bottom: 10px !important; cursor: pointer !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;"'
);
fs.writeFileSync('src/ui/views/axe-issue-list.ts', axe);

console.log("Fixed styles");
