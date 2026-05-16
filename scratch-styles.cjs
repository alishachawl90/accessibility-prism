const fs = require('fs');
let styles = fs.readFileSync('src/ui/panel-styles.ts', 'utf8');

// We will add the CSS block
const newCSS = `
  /* Shared Node Styles (Cards, Components, Headings) */
  #a11y-analyzer-panel .rule-card,
  #a11y-analyzer-panel .comp-node,
  #a11y-analyzer-panel .group-node,
  #a11y-analyzer-panel .heading-node {
    background: white !important;
    border: 1px solid #E5E7EB !important;
    transition: all 0.15s !important;
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
`;

styles = styles.replace('  #a11y-analyzer-panel .a11y-issue-card:hover { border-color: var(--color-accent) !important; }', newCSS);

fs.writeFileSync('src/ui/panel-styles.ts', styles);
console.log("Updated panel-styles.ts");
