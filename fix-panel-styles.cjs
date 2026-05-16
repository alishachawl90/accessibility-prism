const fs = require('fs');

let styles = fs.readFileSync('src/ui/panel-styles.ts', 'utf8');

// Replace the a11y-issue-card rule that we modified earlier
// We also need to fix a11y-issue-card. It's in the CSS.
// Let's modify a11y-issue-card background and border to use variables too!
styles = styles.replace(
  '    background: white !important;\n    border: 1px solid #E5E7EB !important;',
  '    background: var(--node-bg, white) !important;\n    border: 1px solid var(--node-border, #E5E7EB) !important;'
);

// Find the block we injected earlier and replace it with the new variable-based hover rules
const startIdx = styles.indexOf('/* Shared Node Styles');
const endIdx = styles.indexOf('  #a11y-analyzer-panel .a11y-card-body {');

if (startIdx > -1 && endIdx > -1) {
  const newBlock = `/* Hover and Active/Expanded states via CSS variables */
  #a11y-analyzer-panel .a11y-issue-card:hover,
  #a11y-analyzer-panel .a11y-issue-card.is-expanded,
  #a11y-analyzer-panel .rule-card:hover,
  #a11y-analyzer-panel .rule-card.is-expanded,
  #a11y-analyzer-panel .comp-node:hover,
  #a11y-analyzer-panel .comp-node.is-active,
  #a11y-analyzer-panel .group-node:hover,
  #a11y-analyzer-panel .group-node.is-active,
  #a11y-analyzer-panel .heading-node:hover,
  #a11y-analyzer-panel .heading-node.is-active {
    --node-bg: #FDF2F8;
    --node-border: #FBCFE8;
  }

  /* Keep the body transparent when the card is expanded so it doesn't clash */
  #a11y-analyzer-panel .a11y-issue-card.is-expanded .a11y-card-body {
    background: transparent !important;
    border-top-color: #FBCFE8 !important;
  }

  /* Back Button Hover via CSS variables */
  #a11y-analyzer-panel #btn-back:hover {
    --back-bg: #F3F4F6;
    --back-color: #1F2937;
  }

  /* Pre-screen Audit Button Hover via CSS variables */
  #a11y-analyzer-panel .a11y-audit-btn:hover {
    --btn-border: var(--audit-btn-hover, #6366F1);
    --btn-bg: #FDF2F8;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
  }

`;

  styles = styles.substring(0, startIdx) + newBlock + styles.substring(endIdx);
  fs.writeFileSync('src/ui/panel-styles.ts', styles);
  console.log("Updated panel-styles.ts with variable hovers.");
} else {
  console.log("Could not find the block to replace.");
}
