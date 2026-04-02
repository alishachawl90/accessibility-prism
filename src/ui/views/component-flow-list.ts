import type { ComponentTabFlow } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

export function renderComponentFlowList(flows: ComponentTabFlow[]): string {
  let html = renderNavBar('Component Keyboard Flows', true, 'Back');

  html += `
    <div style="padding: 10px 16px; background: white; border-bottom: 1px solid #E5E7EB;">
      <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
        Select a component to inspect its keyboard tab flow, entry/exit points, and internal issues.
      </p>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (flows.length === 0) {
    html += `<div style="text-align: center; padding: 20px; color: #6B7280;">No focusable components detected.</div>`;
  } else {
    flows.forEach((flow, idx) => {
      const totalFocusable = flow.instances.reduce((s, inst) => s + inst.focusable.length, 0);
      const totalIssues = flow.instances.reduce((s, inst) => s + inst.issues.length, 0);
      const issueRatio = totalFocusable > 0 ? totalIssues / totalFocusable : 0;

      let borderColor = '#16A34A';
      let bgColor = '#F0FDF4';
      if (issueRatio > 0.5) { borderColor = '#EF4444'; bgColor = '#FEF2F2'; }
      else if (issueRatio > 0.25) { borderColor = '#F59E0B'; bgColor = '#FFF7ED'; }
      else if (totalIssues > 0) { borderColor = '#D97706'; bgColor = '#FFFBEB'; }

      html += `
        <div class="flow-card" data-idx="${idx}" style="background: white; border: 1px solid #E5E7EB; border-left: 4px solid ${borderColor}; border-radius: 8px; padding: 14px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600; font-size: 14px; color: #1F2937;">${escHtml(flow.component.name)}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px;">
            <span style="background: #EEF2FF; color: #6366F1; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
              ${flow.instances.length} instance${flow.instances.length !== 1 ? 's' : ''}
            </span>
            <span style="background: #F5F3FF; color: #8B5CF6; padding: 2px 8px; border-radius: 12px; font-weight: 500;">
              ${totalFocusable} tab stop${totalFocusable !== 1 ? 's' : ''}
            </span>
            ${totalIssues > 0 ? `
              <span style="background: ${bgColor}; color: ${borderColor}; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}
              </span>
            ` : `
              <span style="background: #F0FDF4; color: #15803D; padding: 2px 8px; border-radius: 12px; font-weight: 500;">
                No issues
              </span>
            `}
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  return html;
}

export function attachFlowListListeners(container: HTMLElement, _flows: ComponentTabFlow[], actions: {
  onBack: () => void;
  onSelectFlow: (idx: number) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());
  container.querySelectorAll('.flow-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      actions.onSelectFlow(idx);
    });
  });
  hoverListeners(container, '.flow-card', '#6366F1');
}
