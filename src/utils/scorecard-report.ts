import type { ScorecardResult, CategoryScore } from '../core/scorecard';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gradeEmoji(grade: string): string {
  switch (grade) {
    case 'A': return '🟢';
    case 'B': return '🟡';
    case 'C': return '🟠';
    case 'D': return '🔴';
    case 'F': return '⛔';
    default: return '⚪';
  }
}

function renderCatSection(cat: CategoryScore): string {
  const actionsHtml = cat.topActions.length > 0
    ? `<div class="actions"><h4>🔧 Fix First</h4><ul>${cat.topActions.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>`
    : '';

  const positivesHtml = cat.positives.length > 0
    ? `<div class="positives"><h4>✅ What's Working</h4><ul>${cat.positives.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`
    : '';

  return `
    <div class="category" style="border-left-color: ${cat.color};">
      <div class="cat-header">
        <div class="cat-grade" style="background: ${cat.color};">${cat.grade}</div>
        <div class="cat-info">
          <h3>${esc(cat.label)} <span class="cat-score">${cat.score}/100</span></h3>
          <p>${esc(cat.narrative)}</p>
        </div>
      </div>
      ${actionsHtml}
      ${positivesHtml}
    </div>
  `;
}

export function generateScorecardHtml(data: ScorecardResult): string {
  const gradeDesc: Record<string, string> = {
    A: 'Excellent', B: 'Good', C: 'Needs Work', D: 'Poor', F: 'Critical',
  };

  const topAllActions = data.categories
    .flatMap(c => c.topActions.map(a => ({ action: a, category: c.label, score: c.score })))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accessibility Report — ${esc(data.pageTitle)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC; color: #1E293B; line-height: 1.6; }

  .container { max-width: 800px; margin: 0 auto; padding: 40px 24px; }

  .hero { background: linear-gradient(135deg, #1E293B 0%, #334155 100%); color: white; border-radius: 16px; padding: 40px; margin-bottom: 32px; }
  .hero h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .hero .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 24px; }

  .score-row { display: flex; align-items: center; gap: 24px; margin-bottom: 20px; }
  .big-score { font-size: 56px; font-weight: 800; line-height: 1; }
  .big-grade { font-size: 14px; color: rgba(255,255,255,0.7); font-weight: 500; }
  .grade-badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .grade-badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; color: white; }

  .summary-text { font-size: 15px; color: rgba(255,255,255,0.9); line-height: 1.7; }

  .meta { display: flex; gap: 16px; margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.4); }

  .section-title { font-size: 18px; font-weight: 700; margin: 32px 0 16px 0; color: #1E293B; display: flex; align-items: center; gap: 8px; }

  .category { background: white; border: 1px solid #E2E8F0; border-left: 5px solid #ccc; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
  .cat-header { display: flex; gap: 16px; align-items: flex-start; }
  .cat-grade { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; flex-shrink: 0; }
  .cat-info { flex: 1; }
  .cat-info h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .cat-score { font-size: 13px; font-weight: 600; color: #6B7280; }
  .cat-info p { font-size: 14px; color: #4B5563; }

  .actions, .positives { margin-top: 16px; padding-top: 16px; border-top: 1px solid #F1F5F9; }
  .actions h4 { font-size: 12px; font-weight: 700; color: #DC2626; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .positives h4 { font-size: 12px; font-weight: 700; color: #16A34A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .actions ul, .positives ul { list-style: none; padding: 0; }
  .actions li, .positives li { font-size: 13px; padding: 4px 0 4px 16px; position: relative; color: #374151; }
  .actions li::before { content: '→'; position: absolute; left: 0; color: #DC2626; font-weight: 600; }
  .positives li::before { content: '✓'; position: absolute; left: 0; color: #16A34A; font-weight: 600; }

  .top-actions { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
  .top-actions h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  .action-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F1F5F9; align-items: flex-start; }
  .action-item:last-child { border-bottom: none; }
  .action-num { width: 28px; height: 28px; border-radius: 50%; background: #2563EB; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .action-text { font-size: 14px; color: #374151; }
  .action-cat { font-size: 11px; color: #9CA3AF; font-weight: 500; }

  .footer { text-align: center; padding: 32px 0; font-size: 12px; color: #9CA3AF; }
  .footer a { color: #6366F1; text-decoration: none; }

  @media print {
    body { background: white; }
    .container { padding: 20px; }
    .hero { break-inside: avoid; }
    .category { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="container">

  <div class="hero">
    <h1>Accessibility Report</h1>
    <div class="subtitle">Automated analysis of ${esc(data.pageTitle)}</div>

    <div class="score-row">
      <div>
        <div class="big-score">${data.overallScore}</div>
        <div class="big-grade">${gradeDesc[data.overallGrade] || ''}</div>
      </div>
      <div class="grade-badges">
        ${data.categories.map(c => `<span class="grade-badge" style="background: ${c.color};">${gradeEmoji(c.grade)} ${c.grade} ${esc(c.label)}</span>`).join('')}
      </div>
    </div>

    <p class="summary-text">${esc(data.summary)}</p>

    <div class="meta">
      <span>${esc(data.pageUrl.length > 80 ? data.pageUrl.substring(0, 77) + '...' : data.pageUrl)}</span>
      <span>${new Date(data.timestamp).toLocaleString()}</span>
    </div>
  </div>

  ${topAllActions.length > 0 ? `
  <div class="top-actions">
    <h3>🎯 Top ${topAllActions.length} Actions</h3>
    ${topAllActions.map((a, i) => `
      <div class="action-item">
        <div class="action-num">${i + 1}</div>
        <div>
          <div class="action-text">${esc(a.action)}</div>
          <div class="action-cat">${esc(a.category)} · Score: ${a.score}/100</div>
        </div>
      </div>
    `).join('')}
  </div>` : ''}

  <div class="section-title">Detailed Breakdown</div>

  ${data.categories.map(c => renderCatSection(c)).join('')}

  <div class="footer">
    Generated by <strong>Accessibility Prism</strong> · ${new Date(data.timestamp).toLocaleString()}
  </div>

</div>
</body>
</html>`;
}
