import { escHtml } from '../../utils/escape';
import { ICON_CHEVRON_LEFT, ICON_ALERT, ICON_CHEVRON_RIGHT } from '../icons';
import { BORDER } from '../tokens';

export function renderNavBar(title: string, showBack = false, backLabel = 'Back'): string {
  return `
    <div style="padding: 14px 16px !important; display: flex !important; align-items: center !important; gap: 8px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important;">
      ${showBack ? `<button id="btn-back" style="background:none !important;border:none !important;cursor:pointer !important;padding:2px !important;display:flex !important;align-items:center !important;gap:4px !important;font-size:13px !important;color:#6B7280 !important;">${ICON_CHEVRON_LEFT}<span>${escHtml(backLabel)}</span></button>` : ''}
      ${!showBack ? ICON_ALERT : ''}
      ${title ? `<h2 style="margin: 0 !important; font-size: 17px !important; font-weight: 700 !important; color: #1F2937 !important;">${escHtml(title)}</h2>` : ''}
    </div>
  `;
}

export function renderAccordion(key: string, headerHtml: string, badgeHtml: string, bodyHtml: string): string {
  return `
    <div style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid #E5E7EB !important; border-radius: 8px !important; margin-bottom: 10px !important; overflow: hidden !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
      <div class="acc-header" data-key="${key}" style="padding: 14px 16px !important; cursor: pointer !important; display: flex !important; justify-content: space-between !important; align-items: center !important; transition: background 0.1s;">
        <div style="display: flex !important; align-items: center !important; gap: 10px !important; flex: 1 !important; min-width: 0 !important;">
          <span class="acc-chevron" data-key="${key}" style="transition: transform 0.2s !important; flex-shrink: 0 !important; color: #6B7280 !important;">${ICON_CHEVRON_RIGHT}</span>
          ${headerHtml}
        </div>
        ${badgeHtml}
      </div>
      <div class="acc-body" data-key="${key}" style="display: none !important; padding: 8px 16px 14px 16px !important; border-top: 1px solid #F3F4F6 !important;">
        ${bodyHtml}
      </div>
    </div>
  `;
}

export function attachAccordionListeners(container: HTMLElement): void {
  container.querySelectorAll('.acc-header').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-key');
      const body = container.querySelector(`.acc-body[data-key="${key}"]`) as HTMLElement;
      const chevron = container.querySelector(`.acc-chevron[data-key="${key}"]`) as HTMLElement;
      if (body) {
        const isOpen = body.style.getPropertyValue('display') !== 'none';
        body.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
        if (chevron) chevron.style.setProperty('transform', isOpen ? '' : 'rotate(90deg)', 'important');
      }
    });
  });
}

export function renderSeverityBadge(severity: 'error' | 'warning' | 'info'): string {
  const map = {
    error: { bg: '#DC2626', label: 'Error' },
    warning: { bg: '#B45309', label: 'Warning' },
    info: { bg: '#1D4ED8', label: 'Info' },
  };
  const s = map[severity];
  return `<span class="a11y-badge" style="background: ${s.bg} !important; color: white !important;">${s.label}</span>`;
}

export function renderPriorityBadge(priority: 1 | 2 | 3 | 4): string {
  const map = {
    1: { bg: '#FEF2F2', text: '#EF4444', label: 'P1' },
    2: { bg: '#FFF7ED', text: '#F97316', label: 'P2' },
    3: { bg: '#FFFBEB', text: '#F59E0B', label: 'P3' },
    4: { bg: '#F3F4F6', text: '#6B7280', label: 'P4' },
  };
  const p = map[priority];
  return `<span style="background: ${p.bg} !important; color: ${p.text} !important; padding: 2px 8px !important; border-radius: 4px !important; font-size: 11px !important; font-weight: 700 !important;">${p.label}</span>`;
}

export function renderCountBadge(count: number, color = '#6366F1'): string {
  return `<span style="background: ${color}12 !important; color: ${color} !important; padding: 3px 10px !important; border-radius: 12px !important; font-size: 13px !important; font-weight: 600 !important;">${count}</span>`;
}

export function hoverListeners(container: HTMLElement, selector: string, hoverColor = '#6366F1', defaultColor = '#E5E7EB'): void {
  container.querySelectorAll(selector).forEach(el => {
    const htmlEl = el as HTMLElement;
    const savedLeftColor = htmlEl.style.borderLeftColor;
    htmlEl.addEventListener('mouseover', () => {
      htmlEl.style.borderColor = hoverColor;
    });
    htmlEl.addEventListener('mouseout', () => {
      htmlEl.style.borderColor = defaultColor;
      if (savedLeftColor) htmlEl.style.borderLeftColor = savedLeftColor;
    });
  });
}
