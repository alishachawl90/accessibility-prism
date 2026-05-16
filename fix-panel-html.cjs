const fs = require('fs');

let html = fs.readFileSync('public/panel.html', 'utf8');

// We need to inject the hover styles for the popup mode
const insertPoint = html.indexOf('/* Pre-screen audit card buttons');
if (insertPoint > -1) {
  const css = `
    /* Hover and Active/Expanded states via CSS variables */
    .a11y-issue-card:hover,
    .a11y-issue-card.is-expanded,
    .rule-card:hover,
    .rule-card.is-expanded,
    .comp-node:hover,
    .comp-node.is-active,
    .group-node:hover,
    .group-node.is-active,
    .heading-node:hover,
    .heading-node.is-active {
      --node-bg: #FDF2F8;
      --node-border: #FBCFE8;
    }

    .a11y-issue-card.is-expanded .a11y-card-body {
      background: transparent !important;
      border-top-color: #FBCFE8 !important;
    }

    .a11y-btn-back {
      background: none !important;
      border: none !important;
      transition: background 0.15s, color 0.15s !important;
    }
    .a11y-btn-back:hover {
      --back-bg: #F3F4F6;
      --back-color: #1F2937;
    }

    .a11y-audit-btn:hover {
      --btn-border: var(--audit-btn-hover, #6366F1);
      --btn-bg: #FDF2F8;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
    }

    `;
  html = html.substring(0, insertPoint) + css + html.substring(insertPoint);
  fs.writeFileSync('public/panel.html', html);
  console.log("Updated panel.html with hover variables");
}
