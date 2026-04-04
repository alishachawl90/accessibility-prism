import type { ScorecardResult, CategoryScore } from '../../core/scorecard';
import { escHtml } from '../../utils/escape';
import { renderNavBar } from './helpers';

function renderScoreRing(score: number, grade: string, color: string, size: number): string {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="6" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" />
      <text x="${size / 2}" y="${size / 2 + 2}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="${size > 80 ? 24 : 16}" font-weight="800" font-family="-apple-system, BlinkMacSystemFont, sans-serif" style="transform: rotate(90deg); transform-origin: center;">${grade}</text>
    </svg>
  `;
}

function renderCategoryCard(cat: CategoryScore, idx: number): string {
  const ring = renderScoreRing(cat.score, cat.grade, cat.color, 56);

  let actionsHtml = '';
  if (cat.topActions.length > 0) {
    actionsHtml = `<div style="margin-top: 10px !important; padding-top: 10px !important; border-top: 1px solid #F3F4F6 !important;">
      <div style="font-size: 11px !important; font-weight: 600 !important; color: #DC2626 !important; margin-bottom: 6px !important;">FIX FIRST</div>
      ${cat.topActions.map(a => `<div style="font-size: 12px !important; color: #374151 !important; line-height: 1.5 !important; padding-left: 12px !important; position: relative !important; margin-bottom: 4px !important;"><span style="position: absolute !important; left: 0 !important; color: #DC2626 !important;">→</span>${escHtml(a)}</div>`).join('')}
    </div>`;
  }

  let positivesHtml = '';
  if (cat.positives.length > 0) {
    positivesHtml = `<div style="margin-top: 8px !important;">
      ${cat.positives.map(p => `<div style="font-size: 12px !important; color: #15803D !important; line-height: 1.5 !important; padding-left: 12px !important; position: relative !important; margin-bottom: 2px !important;"><span style="position: absolute !important; left: 0 !important;">✓</span>${escHtml(p)}</div>`).join('')}
    </div>`;
  }

  return `
    <div class="cat-card" data-idx="${idx}" style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 4px solid ${cat.color} !important; border-radius: 10px !important; padding: 16px !important; margin-bottom: 10px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;">
      <div style="display: flex !important; align-items: flex-start !important; gap: 14px !important;">
        <div style="flex-shrink: 0 !important;">${ring}</div>
        <div style="flex: 1 !important; min-width: 0 !important;">
          <div class="a11y-card-header">
            <span style="font-size: 14px !important; font-weight: 700 !important; color: #1F2937 !important;">${escHtml(cat.label)}</span>
            <span style="font-size: 12px !important; font-weight: 600 !important; color: ${cat.color} !important;">${cat.score}/100</span>
          </div>
          <p style="margin: 0 !important; font-size: 13px !important; color: #4B5563 !important; line-height: 1.6 !important;">${escHtml(cat.narrative)}</p>
        </div>
      </div>
      ${actionsHtml}
      ${positivesHtml}
    </div>
  `;
}

export function renderScorecardResults(data: ScorecardResult): string {
  let html = renderNavBar('Accessibility Scorecard', true, 'Back');

  const overallRing = renderScoreRing(data.overallScore, data.overallGrade, data.categories.length > 0 ? data.categories.sort((a, b) => a.score - b.score)[0].color : '#6B7280', 90);
  const gradeDescriptions: Record<string, string> = {
    A: 'Excellent', B: 'Good', C: 'Needs Work', D: 'Poor', F: 'Critical',
  };

  html += `
    <div style="padding: 20px 16px !important; background: linear-gradient(135deg, #1E293B 0%, #334155 100%) !important; color: white !important;">
      <div style="display: flex !important; align-items: center !important; gap: 16px !important; margin-bottom: 14px !important;">
        <div style="flex-shrink: 0 !important;">${overallRing}</div>
        <div>
          <div style="font-size: 20px !important; font-weight: 800 !important; color: white !important;">${data.overallScore}/100</div>
          <div style="font-size: 13px !important; color: rgba(255,255,255,0.7) !important; font-weight: 500 !important;">${gradeDescriptions[data.overallGrade] || ''}</div>
        </div>
        <div style="margin-left: auto !important; text-align: right !important;">
          <div style="display: flex !important; gap: 6px !important; flex-wrap: wrap !important; justify-content: flex-end !important;">
            ${data.categories.map(c => `<span style="background: ${c.color} !important; color: white !important; padding: 3px 8px !important; border-radius: 4px !important; font-size: 10px !important; font-weight: 700 !important; white-space: nowrap !important;">${c.grade} ${c.label.split(' ')[0]}</span>`).join('')}
          </div>
        </div>
      </div>
      <p style="margin: 0 !important; font-size: 13px !important; color: rgba(255,255,255,0.85) !important; line-height: 1.6 !important;">${escHtml(data.summary)}</p>
      <div style="margin-top: 10px !important; font-size: 11px !important; color: rgba(255,255,255,0.5) !important; display: flex !important; gap: 12px !important;">
        <span>${escHtml(data.pageTitle.length > 40 ? data.pageTitle.substring(0, 37) + '...' : data.pageTitle)}</span>
        <span>${new Date(data.timestamp).toLocaleString()}</span>
      </div>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area" tabindex="0">`;

  data.categories.forEach((cat, idx) => {
    html += renderCategoryCard(cat, idx);
  });

  html += `
    <div style="padding: 12px 0 8px 0 !important; text-align: center !important;">
      <button id="btn-export-scorecard" style="padding: 10px 24px !important; background: #2563EB !important; color: white !important; border: none !important; border-radius: 8px !important; font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important; transition: background 0.15s !important;"
        onmouseover="this.style.background='#1D4ED8'"
        onmouseout="this.style.background='#2563EB'">
        Export Full Report
      </button>
    </div>
  `;

  html += `</div>`;
  return html;
}

export function attachScorecardListeners(container: HTMLElement, _data: ScorecardResult, actions: {
  onBack: () => void;
  onExportScorecard: () => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());
  container.querySelector('#btn-export-scorecard')?.addEventListener('click', () => actions.onExportScorecard());
}
