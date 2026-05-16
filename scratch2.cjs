const fs = require('fs');
let panelContent = fs.readFileSync('src/ui/panel.ts', 'utf8');
let prismSvg = fs.readFileSync('public/icons/prism.svg', 'utf8').trim();

// The new SVG has viewBox="0 0 128 128"
// Let's modify the opening <svg> tag to inject width, height, and flex-shrink
prismSvg = prismSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">', '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" style="flex-shrink:0 !important;" viewBox="0 0 128 128">');

const targetStart = panelContent.indexOf('private static readonly PRISM_LOGO_SVG = `');
const targetEnd = panelContent.indexOf('`;', targetStart) + 2;

if (targetStart > -1 && targetEnd > targetStart) {
  panelContent = panelContent.substring(0, targetStart) +
                 'private static readonly PRISM_LOGO_SVG = `' + prismSvg + '`;' +
                 panelContent.substring(targetEnd);
                 
  fs.writeFileSync('src/ui/panel.ts', panelContent);
  console.log("Replaced PRISM_LOGO_SVG successfully.");
} else {
  console.log("Could not find PRISM_LOGO_SVG string.");
}
