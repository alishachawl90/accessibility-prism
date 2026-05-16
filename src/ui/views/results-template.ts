import { escHtml } from '../../utils/escape';
import { SEV, BORDER, type SeverityKey } from '../tokens';
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_DOWN } from '../icons';

let activeAbortController: AbortController | null = null;

// ---------------------------------------------------------------------------
// Config interfaces
// ---------------------------------------------------------------------------

export interface ResultsPageConfig {
  title: string;
  backLabel?: string;
  stats: { label: string; value: string | number; color?: string }[];
  chips?: {
    levels: { key: string; label?: string; count: number }[];
    active: Set<string>;
  };
  search?: { value: string; placeholder: string };
  groupTabs?: { modes: { key: string; label: string }[]; active: string };
  toolbarHtml?: string;
  bodyHtml: string;
  emptyMessage?: string;
}

export interface IssueCardConfig {
  idx: number;
  borderColor: string;
  badgeHtml: string;
  titleHtml: string;
  descriptionHtml?: string;
  selector: string;
  snippet: string;
  extraBodyHtml?: string;
}

export interface ResultsPageActions {
  onBack: () => void;
  onSeverityChange?: (next: Set<string>) => void;
  onSearchInput?: (value: string) => void;
  onGroupChange?: (mode: string) => void;
  onHighlight: (idx: number) => void;
  onShowInDevTools?: (idx: number) => void;
  onToolbarAction?: (action: string) => void;
  autoHighlightOnExpand?: boolean;
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

// getCssSelector and getSnippet have moved to src/utils/dom-utils.ts
// Re-exported here so existing imports still compile during the migration.
export { getCssSelector, getSnippet } from '../../utils/dom-utils';

export function renderSeverityBadge(sev: string, labelOverride?: string): string {
  const s = SEV[sev as SeverityKey];
  if (!s) return '';
  const label = labelOverride || s.label;
  return `<span class="a11y-badge" style="background: ${s.badge} !important; color: white !important;">${escHtml(label)}</span>`;
}

// ---------------------------------------------------------------------------
// renderResultsPage — one function renders the entire page layout
// ---------------------------------------------------------------------------

export function renderResultsPage(config: ResultsPageConfig): string {
  let html = '';

  // Nav bar
  html += `
    <div style="padding: 14px 16px !important; display: flex !important; align-items: center !important; gap: 8px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important;">
      <button id="btn-back" style="background: var(--back-bg, none) !important; border:none !important; cursor:pointer !important; padding:4px 6px !important; margin-left: -4px !important; border-radius: 6px !important; display:flex !important; align-items:center !important; gap:4px !important; font-size:13px !important; color: var(--back-color, #6B7280) !important; transition: background 0.15s, color 0.15s !important;">${ICON_CHEVRON_LEFT}<span>${escHtml(config.backLabel || 'Back')}</span></button>
      <h2 style="margin: 0 !important; font-size: 17px !important; font-weight: 700 !important; color: #1F2937 !important;">${escHtml(config.title)}</h2>
    </div>`;

  // Stats strip
  if (config.stats.length > 0) {
    html += `<div class="a11y-stats-strip">`;
    config.stats.forEach(s => {
      const colorStyle = s.color ? `color: ${s.color} !important;` : '';
      html += `<span style="${colorStyle}">${s.value} ${escHtml(s.label)}</span>`;
    });
    html += `</div>`;
  }

  // Severity chip row
  if (config.chips) {
    html += `<div class="a11y-chip-row">`;
    config.chips.levels.forEach(level => {
      const s = SEV[level.key as SeverityKey];
      const isActive = config.chips!.active.has(level.key);
      const label = level.label || s?.label || level.key;
      const badgeColor = s?.badge || '#6B7280';
      const activeBg = s?.bg || '#F3F4F6';
      const activeBorder = s?.border || '#D1D5DB';
      html += `
        <button class="a11y-sev-chip" data-sev="${escHtml(level.key)}"
          style="${isActive ? `background: ${activeBg} !important; border-color: ${activeBorder} !important; color: ${badgeColor} !important;` : ''}">
          ${escHtml(label)}
          <span style="background: ${isActive ? badgeColor : '#D1D5DB'} !important; color: white !important; padding: 1px 6px !important; border-radius: 10px !important; font-size: 10px !important; font-weight: 700 !important; min-width: 16px !important; text-align: center !important;">${level.count}</span>
        </button>`;
    });
    html += `</div>`;
  }

  // Search input row
  if (config.search) {
    html += `
      <div style="padding: 10px 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important;">
        <input type="text" class="a11y-search-input" value="${escHtml(config.search.value)}" placeholder="${escHtml(config.search.placeholder)}" />
      </div>`;
  }

  // Group tabs row
  if (config.groupTabs) {
    html += `
      <div style="padding: 8px 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important; display: flex !important; gap: 8px !important;">
        ${config.groupTabs.modes.map(m =>
          `<button class="a11y-group-tab" data-mode="${escHtml(m.key)}" data-active="${m.key === config.groupTabs!.active}">${escHtml(m.label)}</button>`
        ).join('')}
      </div>`;
  }

  // Extra toolbar
  if (config.toolbarHtml) {
    html += `<div class="a11y-toolbar-row">${config.toolbarHtml}</div>`;
  }

  // Scroll area
  html += `<div id="scroll-area" class="a11y-scroll-area" tabindex="0">`;
  if (config.bodyHtml) {
    html += config.bodyHtml;
  } else if (config.emptyMessage) {
    html += `<div class="a11y-empty-success">${escHtml(config.emptyMessage)}</div>`;
  }
  html += `</div>`;

  return html;
}

// ---------------------------------------------------------------------------
// renderIssueCard — one function renders a single expandable card
// ---------------------------------------------------------------------------

export function renderIssueCard(config: IssueCardConfig): string {
  const safeSel = escHtml(config.selector);
  const safeSnip = escHtml(config.snippet);

  return `
    <div class="a11y-issue-card" data-idx="${config.idx}" style="border-left: 3px solid ${config.borderColor} !important;">
      <div class="a11y-card-header" style="padding: 12px 14px !important; cursor: pointer !important; display: flex !important; align-items: flex-start !important; gap: 8px !important;">
        ${config.badgeHtml}
        <div style="flex: 1 !important; min-width: 0 !important;">
          <div style="font-size: 13px !important; font-weight: 500 !important; color: #1F2937 !important; line-height: 1.5 !important;">${config.titleHtml}</div>
          ${config.descriptionHtml ? `<div style="font-size: 12px !important; color: #6B7280 !important; margin-top: 2px !important; line-height: 1.5 !important;">${config.descriptionHtml}</div>` : ''}
        </div>
        <span class="a11y-card-chevron">${ICON_CHEVRON_DOWN}</span>
      </div>
      <div class="a11y-card-body" style="display: none !important;">
        <div class="a11y-code-block">${safeSel}</div>
        <div class="a11y-code-block" style="margin-bottom: 8px !important;">${safeSnip}</div>
        ${config.extraBodyHtml || ''}
        <button class="a11y-highlight-btn" data-idx="${config.idx}">Highlight on page</button>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// attachResultsPageListeners — event delegation (2 listeners total)
// ---------------------------------------------------------------------------

export function attachResultsPageListeners(
  container: HTMLElement,
  actions: ResultsPageActions,
  chipState?: { active: Set<string> }
): AbortSignal {
  if (activeAbortController) activeAbortController.abort();
  activeAbortController = new AbortController();
  const { signal } = activeAbortController;

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Back button
    if (target.closest('#btn-back')) { actions.onBack(); return; }

    // Highlight button
    const highlightBtn = target.closest('.a11y-highlight-btn') as HTMLElement;
    if (highlightBtn) {
      e.stopPropagation();
      const idx = parseInt(highlightBtn.getAttribute('data-idx') || '0', 10);
      actions.onHighlight(idx);
      return;
    }

    // Severity chip toggle
    const sevChip = target.closest('.a11y-sev-chip') as HTMLElement;
    if (sevChip && actions.onSeverityChange && chipState) {
      const sev = sevChip.getAttribute('data-sev') || '';
      const next = new Set(chipState.active);
      if (next.has(sev)) {
        if (next.size > 1) next.delete(sev);
      } else {
        next.add(sev);
      }
      actions.onSeverityChange(next);
      return;
    }

    // Group tab
    const groupTab = target.closest('.a11y-group-tab') as HTMLElement;
    if (groupTab && actions.onGroupChange) {
      actions.onGroupChange(groupTab.getAttribute('data-mode') || '');
      return;
    }

    // Toolbar action
    const toolbarBtn = target.closest('[data-toolbar-action]') as HTMLElement;
    if (toolbarBtn && actions.onToolbarAction) {
      actions.onToolbarAction(toolbarBtn.getAttribute('data-toolbar-action') || '');
      return;
    }

    // Card expand/collapse
    const cardHeader = target.closest('.a11y-card-header');
    if (cardHeader) {
      const card = cardHeader.closest('.a11y-issue-card');
      const body = card?.querySelector('.a11y-card-body') as HTMLElement;
      const chevron = card?.querySelector('.a11y-card-chevron') as HTMLElement;
      if (body) {
        const wasExpanded = body.style.display !== 'none' && body.style.display !== '';
        body.style.setProperty('display', wasExpanded ? 'none' : 'block', 'important');
        if (chevron) chevron.style.transform = wasExpanded ? '' : 'rotate(180deg)';
        if (!wasExpanded) {
          card?.classList.add('is-expanded');
          // Auto-highlight on expand if enabled
          if (actions.autoHighlightOnExpand) {
            const idx = parseInt(card?.getAttribute('data-idx') || '0', 10);
            actions.onHighlight(idx);
          }
        } else {
          card?.classList.remove('is-expanded');
        }
      }
    }

    // Show in developer tools button
    const devtoolsBtn = target.closest('.a11y-devtools-btn') as HTMLElement;
    if (devtoolsBtn && actions.onShowInDevTools) {
      e.stopPropagation();
      const idx = parseInt(devtoolsBtn.getAttribute('data-idx') || '0', 10);
      actions.onShowInDevTools(idx);
      return;
    }
  }, { signal });

  // Search input — debounced
  const searchInput = container.querySelector('.a11y-search-input') as HTMLInputElement;
  if (searchInput && actions.onSearchInput) {
    let debounceTimer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => actions.onSearchInput!(searchInput.value), 250);
    }, { signal });
  }

  return signal;
}
