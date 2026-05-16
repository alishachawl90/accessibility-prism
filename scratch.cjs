const fs = require('fs');
let panelContent = fs.readFileSync('src/ui/panel.ts', 'utf8');
let faviconSvg = fs.readFileSync('public/favicon.svg', 'utf8').trim();

// Replace width/height and add flex-shrink
faviconSvg = faviconSvg.replace('width="48" height="46"', 'width="22" height="22" style="flex-shrink:0 !important;"');

// In panel.ts, find PRISM_LOGO_SVG and replace it
const targetStart = panelContent.indexOf('private static readonly PRISM_LOGO_SVG = `');
const targetEnd = panelContent.indexOf('`;', targetStart) + 2;

if (targetStart > -1 && targetEnd > targetStart) {
  panelContent = panelContent.substring(0, targetStart) +
                 'private static readonly PRISM_LOGO_SVG = `' + faviconSvg + '`;' +
                 panelContent.substring(targetEnd);
                 
  // Also fix the padding in the URL strip
  panelContent = panelContent.replace(
    'padding: 6px 16px 12px 16px !important; display: flex !important; align-items: center !important; gap: 8px !important;',
    'padding: 6px 16px !important; display: flex !important; align-items: center !important; gap: 8px !important; border-top: 1px solid #E5E7EB !important;'
  );
  
  fs.writeFileSync('src/ui/panel.ts', panelContent);
  console.log("Replaced successfully.");
} else {
  console.log("Could not find PRISM_LOGO_SVG string.");
}
