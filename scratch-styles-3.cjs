const fs = require('fs');

let styles = fs.readFileSync('src/ui/panel-styles.ts', 'utf8');

// Find the block starting at `/* Shared Node Styles` up to the end of the hover block
const startIdx = styles.indexOf('/* Shared Node Styles');
// We will look for `.a11y-card-body {` which is right after our block
const endIdx = styles.indexOf('#a11y-analyzer-panel .a11y-card-body {');

if (startIdx > -1 && endIdx > -1) {
  const newBlock = `/* Shared Node Styles (Cards, Components, Headings) */
  #a11y-analyzer-panel .rule-card,
  #a11y-analyzer-panel .comp-node,
  #a11y-analyzer-panel .group-node,
  #a11y-analyzer-panel .heading-node {
    background: white !important;
    border: 1px solid #E5E7EB !important;
    transition: all 0.15s !important;
  }
  
  #a11y-analyzer-panel .rule-card,
  #a11y-analyzer-panel .heading-node {
    border-radius: 8px !important;
  }
  
  #a11y-analyzer-panel .comp-node,
  #a11y-analyzer-panel .group-node {
    border-radius: 6px !important;
  }

  /* Hover and Active/Expanded states */
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
    background: #FDF2F8 !important;
    border-color: #FBCFE8 !important;
  }

  /* Keep the body transparent when the card is expanded so it doesn't clash */
  #a11y-analyzer-panel .a11y-issue-card.is-expanded .a11y-card-body {
    background: transparent !important;
    border-top-color: #FBCFE8 !important;
  }

  /* Back Button Styles */
  #a11y-analyzer-panel .a11y-btn-back {
    background: none !important;
    border: none !important;
    transition: background 0.15s, color 0.15s !important;
  }
  #a11y-analyzer-panel .a11y-btn-back:hover {
    background: #F3F4F6 !important;
    color: #1F2937 !important;
  }
  
  /* Pre-screen Audit Button Styles */
  #a11y-analyzer-panel .a11y-audit-btn {
    background: white !important;
    border: 1px solid #E5E7EB !important;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s !important;
  }
  #a11y-analyzer-panel .a11y-audit-btn:hover {
    border-color: var(--audit-btn-hover, #6366F1) !important;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
    background: #FDF2F8 !important;
  }

  `;

  styles = styles.substring(0, startIdx) + newBlock + styles.substring(endIdx);
  fs.writeFileSync('src/ui/panel-styles.ts', styles);
  console.log("Updated panel-styles.ts properly.");
} else {
  console.log("Could not find insertion points.");
}
