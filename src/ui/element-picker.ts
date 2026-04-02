const PICKER_OVERLAY_ID = 'a11y-element-picker-overlay';
const PICKER_TOOLTIP_ID = 'a11y-element-picker-tooltip';

function isExtensionElement(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') ||
         !!el.closest('#a11y-analyzer-overlay') ||
         !!el.closest(`#${PICKER_OVERLAY_ID}`) ||
         !!el.closest(`#${PICKER_TOOLTIP_ID}`);
}

function getElementLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = Array.from(el.classList).slice(0, 2).map(c => `.${c}`).join('');
  const role = el.getAttribute('role');
  const roleStr = role ? ` [role="${role}"]` : '';
  const label = `${tag}${id}${cls}${roleStr}`;
  return label.length > 60 ? label.substring(0, 57) + '...' : label;
}

export function getElementDescription(el: Element): string {
  return getElementLabel(el);
}

export function startElementPicker(onPick: (el: Element) => void, onCancel: () => void): () => void {
  let overlay: HTMLDivElement | null = null;
  let tooltip: HTMLDivElement | null = null;
  let currentTarget: Element | null = null;

  overlay = document.createElement('div');
  overlay.id = PICKER_OVERLAY_ID;
  overlay.setAttribute('style', `
    position: fixed !important;
    pointer-events: none !important;
    z-index: 999998 !important;
    border: 2px solid #2563EB !important;
    background: rgba(37, 99, 235, 0.08) !important;
    border-radius: 3px !important;
    transition: all 0.1s ease-out !important;
    display: none !important;
  `.replace(/\n\s*/g, ' '));
  document.body.appendChild(overlay);

  tooltip = document.createElement('div');
  tooltip.id = PICKER_TOOLTIP_ID;
  tooltip.setAttribute('style', `
    position: fixed !important;
    z-index: 999998 !important;
    background: #1F2937 !important;
    color: white !important;
    padding: 6px 10px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
    pointer-events: none !important;
    white-space: nowrap !important;
    display: none !important;
    max-width: 400px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
  `.replace(/\n\s*/g, ' '));
  document.body.appendChild(tooltip);

  const handleMouseMove = (e: MouseEvent) => {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || isExtensionElement(target)) {
      if (overlay) overlay.style.setProperty('display', 'none', 'important');
      if (tooltip) tooltip.style.setProperty('display', 'none', 'important');
      currentTarget = null;
      return;
    }

    currentTarget = target;
    const rect = target.getBoundingClientRect();

    if (overlay) {
      overlay.style.setProperty('top', `${rect.top}px`, 'important');
      overlay.style.setProperty('left', `${rect.left}px`, 'important');
      overlay.style.setProperty('width', `${rect.width}px`, 'important');
      overlay.style.setProperty('height', `${rect.height}px`, 'important');
      overlay.style.setProperty('display', 'block', 'important');
    }

    if (tooltip) {
      tooltip.textContent = getElementLabel(target);
      const tipTop = rect.top > 30 ? rect.top - 30 : rect.bottom + 6;
      tooltip.style.setProperty('top', `${tipTop}px`, 'important');
      tooltip.style.setProperty('left', `${Math.min(e.clientX + 12, window.innerWidth - 300)}px`, 'important');
      tooltip.style.setProperty('display', 'block', 'important');
    }
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (currentTarget && !isExtensionElement(currentTarget)) {
      cleanup();
      onPick(currentTarget);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      onCancel();
    }
  };

  function cleanup() {
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.body.style.cursor = '';
    overlay?.remove();
    tooltip?.remove();
    overlay = null;
    tooltip = null;
  }

  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  document.body.style.cursor = 'crosshair';

  return cleanup;
}
