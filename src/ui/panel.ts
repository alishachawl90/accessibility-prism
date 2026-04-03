import type { AxeViolation, ComponentCluster, ComponentIssue, KeyboardIssue, ComponentTabFlow, HeadingAnalysisResult, LandmarkAnalysisResult, ContrastIssue, FocusManagementIssue, LiveRegionResult, TouchTargetIssue, AltTextIssue, AccNameResult, AriaValidationResult, FormLabelsResult, AccNameEntry } from '../core/types';
import type { PageRegion } from '../core/region-detection';
import { PANEL_CSS } from './panel-styles';
import { BORDER, HEADER_BG } from './tokens';
import * as icons from './icons';

import { renderPreScreen, attachPreScreenListeners } from './views/pre-screen';
import { renderAxeIssueList, attachAxeListListeners, type GroupMode, type AxeListData } from './views/axe-issue-list';
import { renderAxeIssueDetails, attachAxeDetailsListeners } from './views/axe-issue-details';
import { renderKeyboardResults, attachKeyboardListeners, type KbGroupMode, type KbData } from './views/keyboard-results';
import { renderManualTracking, attachManualListeners, updateManualTrailLog } from './views/manual-tracking';
import { renderComponentFlowList, attachFlowListListeners } from './views/component-flow-list';
import { renderComponentFlowDetail, attachFlowDetailListeners } from './views/component-flow-detail';
import { renderHeadingResults, attachHeadingListeners } from './views/heading-results';
import { renderLandmarkResults, attachLandmarkListeners } from './views/landmark-results';
import { renderContrastResults, attachContrastListeners } from './views/contrast-results';
import { renderFocusMgmtResults, attachFocusMgmtListeners } from './views/focus-mgmt-results';
import { renderLiveRegionResults, attachLiveRegionListeners } from './views/live-region-results';
import { renderTouchTargetResults, attachTouchTargetListeners } from './views/touch-target-results';
import { renderAltTextResults, attachAltTextListeners } from './views/alt-text-results';
import { renderAccNameResults, attachAccNameListeners, type AccNameData } from './views/acc-name-results';
import { renderAriaResults, attachAriaListeners } from './views/aria-validation-results';
import { renderFormLabelsResults, attachFormLabelsListeners } from './views/form-labels-results';
import { renderSrWalkthrough, attachWalkthroughListeners, type WalkthroughData } from './views/sr-walkthrough';
import { renderReadingOrderResults, attachReadingOrderListeners } from './views/reading-order-results';
import { renderScorecardResults, attachScorecardListeners } from './views/scorecard-results';
import type { ScorecardResult } from '../core/scorecard';

interface PanelCallbacks {
  onRunAxe: () => void;
  onRunAutoKeyboard: () => void;
  onStartManualKeyboard: () => void;
  onStopManualKeyboard: () => void;
  onResetManualTrail: () => void;
  onExportReport: () => void;
  onViolationClick: (nodes: Element[]) => void;
  onShowComponentFlow: (flow: ComponentTabFlow, instanceIdx: number) => void;
  onRunHeadings: () => void;
  onRunLandmarks: () => void;
  onRunContrast: () => void;
  onRunFocusMgmt: () => void;
  onRunLiveRegions: () => void;
  onRunTouchTargets: () => void;
  onRunAltText: () => void;
  onPartialScan: () => void;
  onRunAccNames: () => void;
  onRunAriaValidation: () => void;
  onRunFormLabels: () => void;
  onRunSrWalkthrough: () => void;
  onRunReadingOrder: () => void;
  onRunScorecard: () => void;
  onExportScorecard: () => void;
  onClose: () => void;
}

type ViewName =
  | 'pre-screen'
  | 'axe-issue-list'
  | 'axe-issue-details'
  | 'keyboard-issues'
  | 'manual-tracking'
  | 'component-flow-list'
  | 'component-flow-detail'
  | 'heading-results'
  | 'landmark-results'
  | 'contrast-results'
  | 'focus-mgmt-results'
  | 'live-region-results'
  | 'touch-target-results'
  | 'alt-text-results'
  | 'acc-name-results'
  | 'aria-validation-results'
  | 'form-labels-results'
  | 'sr-walkthrough'
  | 'reading-order'
  | 'scorecard';

export class FloatingPanel {
  private container!: HTMLElement;
  private callbacks: PanelCallbacks;
  private collapsed = false;
  private currentView: ViewName = 'pre-screen';
  /** View that was last painted; used to save scroll before `currentView` updates ahead of `render()`. */
  private lastRenderedView: ViewName = 'pre-screen';
  private scrollPositions = new Map<ViewName, number>();
  /** When true, the next cross-view render keeps stored scroll for `currentView` (e.g. back navigation). */
  private preserveScrollOnNavigate = false;

  // Axe state
  private violations: AxeViolation[] = [];
  private components = new Map<string, ComponentCluster>();
  private dedupedIssues: ComponentIssue[] = [];
  private regions: PageRegion[] = [];
  private searchQuery = '';
  private filterSeverity: 'ALL' | 'AA' | 'AAA' = 'ALL';
  private groupMode: GroupMode = 'rule';
  private activeResultTypes = new Set<import('../core/types').AxeResultType>(['violation', 'needs-review', 'best-practice']);
  private filterImpact = new Set<string>(['critical', 'serious', 'moderate', 'minor']);
  private activeViolation: AxeViolation | null = null;

  // Keyboard state
  private keyboardIssues: KeyboardIssue[] = [];
  private componentFlows: ComponentTabFlow[] = [];
  private kbGroupMode: KbGroupMode = 'type';
  private kbSeverityFilter = new Set<'error' | 'warning' | 'info'>(['error', 'warning', 'info']);

  // Component flow state
  private activeFlowIdx = 0;
  private activeInstanceIdx = 0;

  // Manual tracking state
  private manualTrail: Element[] = [];

  // New analysis states
  private headingData: HeadingAnalysisResult = { headings: [], issues: [] };
  private landmarkData: LandmarkAnalysisResult = { landmarks: [], issues: [] };
  private contrastIssues: ContrastIssue[] = [];
  private focusMgmtIssues: FocusManagementIssue[] = [];
  private liveRegionData: LiveRegionResult = { regions: [], issues: [] };
  private liveRegionSeverityFilter = new Set<string>(['warning', 'info']);
  private touchTargetIssues: TouchTargetIssue[] = [];
  private altTextIssues: AltTextIssue[] = [];
  private altTextSeverityFilter = new Set<string>(['error', 'warning', 'info']);
  private formLabelsSeverityFilter = new Set<string>(['error', 'warning', 'info']);

  // Screen reader analysis states
  private accNameResult: AccNameResult = { entries: [], issueCount: 0, warningCount: 0 };
  private accNameSeverityFilter = new Set<string>(['error', 'warning', 'info']);
  private accNameSearch = '';
  private ariaResult: AriaValidationResult = { issues: [], errorCount: 0, warningCount: 0 };
  private ariaSeverityFilter = new Set<string>(['error', 'warning', 'info']);
  private formLabelsResult: FormLabelsResult = { issues: [], totalControls: 0, labeledControls: 0 };
  private walkthroughEntries: AccNameEntry[] = [];
  private walkthroughIndex = 0;
  private readingOrderEntries: AccNameEntry[] = [];

  // Scorecard
  private scorecardData: ScorecardResult | null = null;

  // Partial scan scope
  private scopeElement: Element | null = null;
  private scopeLabel = '';

  constructor(callbacks: PanelCallbacks) {
    this.callbacks = callbacks;
    this.createPanel();
    this.render();
  }

  // === Public API ===

  public hide() { this.container.style.setProperty('display', 'none', 'important'); }
  public show() { this.container.style.setProperty('display', 'flex', 'important'); }

  public setScopeElement(el: Element, label: string) {
    this.scopeElement = el;
    this.scopeLabel = label;
  }

  public clearScope() {
    this.scopeElement = null;
    this.scopeLabel = '';
  }

  public getScopeElement(): Element | null { return this.scopeElement; }

  public updateAxeResults(violations: AxeViolation[], components: Map<string, ComponentCluster>, dedupedIssues: ComponentIssue[], regions: PageRegion[]) {
    this.violations = violations;
    this.components = components;
    this.dedupedIssues = dedupedIssues;
    this.regions = regions;
    this.currentView = 'axe-issue-list';
    this.render();
  }

  public updateKeyboardResults(issues: KeyboardIssue[], componentFlows: ComponentTabFlow[]) {
    this.keyboardIssues = issues;
    this.componentFlows = componentFlows;
    this.currentView = 'keyboard-issues';
    this.render();
  }

  public updateManualTrail(trail: Element[]) {
    this.manualTrail = trail;
    if (this.currentView === 'manual-tracking') {
      updateManualTrailLog(trail);
    } else {
      this.currentView = 'manual-tracking';
      this.render();
    }
  }

  public updateHeadingResults(data: HeadingAnalysisResult) {
    this.headingData = data;
    this.currentView = 'heading-results';
    this.render();
  }

  public updateLandmarkResults(data: LandmarkAnalysisResult) {
    this.landmarkData = data;
    this.currentView = 'landmark-results';
    this.render();
  }

  public updateContrastResults(issues: ContrastIssue[]) {
    this.contrastIssues = issues;
    this.currentView = 'contrast-results';
    this.render();
  }

  public updateFocusMgmtResults(issues: FocusManagementIssue[]) {
    this.focusMgmtIssues = issues;
    this.currentView = 'focus-mgmt-results';
    this.render();
  }

  public updateLiveRegionResults(data: LiveRegionResult) {
    this.liveRegionData = data;
    this.currentView = 'live-region-results';
    this.render();
  }

  public updateTouchTargetResults(issues: TouchTargetIssue[]) {
    this.touchTargetIssues = issues;
    this.currentView = 'touch-target-results';
    this.render();
  }

  public updateAltTextResults(issues: AltTextIssue[]) {
    this.altTextIssues = issues;
    this.altTextSeverityFilter = new Set(['error', 'warning', 'info']);
    this.currentView = 'alt-text-results';
    this.render();
  }

  public updateAccNameResults(result: AccNameResult) {
    this.accNameResult = result;
    this.accNameSeverityFilter = new Set(['error', 'warning', 'info']);
    this.accNameSearch = '';
    this.currentView = 'acc-name-results';
    this.render();
  }

  public updateAriaResults(result: AriaValidationResult) {
    this.ariaResult = result;
    this.ariaSeverityFilter = new Set(['error', 'warning', 'info']);
    this.currentView = 'aria-validation-results';
    this.render();
  }

  public updateFormLabelsResults(result: FormLabelsResult) {
    this.formLabelsResult = result;
    this.formLabelsSeverityFilter = new Set(['error', 'warning', 'info']);
    this.currentView = 'form-labels-results';
    this.render();
  }

  public startWalkthrough(entries: AccNameEntry[]) {
    this.walkthroughEntries = entries;
    this.walkthroughIndex = 0;
    this.currentView = 'sr-walkthrough';
    this.render();
  }

  public showReadingOrder(entries: AccNameEntry[]) {
    this.readingOrderEntries = entries;
    this.currentView = 'reading-order';
    this.render();
  }

  public updateScorecardResults(data: ScorecardResult) {
    this.scorecardData = data;
    this.currentView = 'scorecard';
    this.render();
  }

  // === Panel creation ===

  private createPanel() {
    const existing = document.getElementById('a11y-analyzer-panel');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'a11y-analyzer-panel';
    this.container.setAttribute('data-a11y-extension', 'true');

    this.container.setAttribute('style', `
      position: fixed !important;
      bottom: 16px !important;
      right: 16px !important;
      width: 440px !important;
      max-height: 85vh !important;
      background: #FFFFFF !important;
      border: 1px solid ${BORDER} !important;
      border-radius: 14px !important;
      box-shadow: 0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06) !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 14px !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      color-scheme: light !important;
      color: #1F2937 !important;
    `.replace(/\n\s*/g, ' '));

    document.body.appendChild(this.container);
    this.injectScopedStyles();
  }

  private injectScopedStyles() {
    const id = 'a11y-panel-scoped-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = PANEL_CSS;
    document.head.appendChild(style);
  }

  // === Main render ===

  private render() {
    const scrollAreaBefore = this.container.querySelector('#scroll-area') as HTMLElement | null;
    if (scrollAreaBefore) {
      this.scrollPositions.set(this.lastRenderedView, scrollAreaBefore.scrollTop);
    }

    if (this.lastRenderedView !== this.currentView) {
      if (!this.preserveScrollOnNavigate) {
        this.scrollPositions.delete(this.currentView);
      }
    }
    this.preserveScrollOnNavigate = false;

    let html = this.renderHeader();

    if (!this.collapsed) {
      html += this.renderViewContent();
    }

    this.container.innerHTML = html;
    this.container.style.setProperty('max-height', this.collapsed ? 'auto' : '85vh', 'important');

    this.attachHeaderListeners();
    if (!this.collapsed) {
      this.attachViewListeners();
    }

    this.lastRenderedView = this.currentView;

    if (!this.collapsed && this.scrollPositions.has(this.currentView)) {
      const savedScroll = this.scrollPositions.get(this.currentView)!;
      const viewAtRestore = this.currentView;
      // Double-rAF ensures layout is complete before restoring scroll position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.currentView !== viewAtRestore) return;
          const scrollArea = this.container.querySelector('#scroll-area') as HTMLElement | null;
          if (scrollArea) scrollArea.scrollTop = savedScroll;
        });
      });
    }
  }

  private renderHeader(): string {
    return `
      <div id="panel-header" style="padding: 14px 16px !important; background: ${HEADER_BG} !important; color: white !important; display: flex !important; align-items: center !important; justify-content: space-between !important; cursor: pointer !important; border-radius: ${this.collapsed ? '12px' : '12px 12px 0 0'} !important; user-select: none !important;">
        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
          <span style="font-weight: 700 !important; font-size: 15px !important; letter-spacing: 0.2px !important; color: white !important;">Accessibility Prism</span>
          <span style="background: rgba(255,255,255,0.25) !important; padding: 2px 8px !important; border-radius: 4px !important; font-size: 11px !important; font-weight: 700 !important; color: white !important; line-height: 1.5 !important;">v1</span>
        </div>
        <div style="display: flex !important; align-items: center !important; gap: 4px !important;">
          <button id="btn-export" title="Download accessibility report" style="background: rgba(255,255,255,0.1) !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 6px !important; width: 30px !important; height: 30px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; color: rgba(255,255,255,0.85) !important; transition: all 0.15s;"
            onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.color='white';"
            onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.color='rgba(255,255,255,0.85)';">
            ${icons.ICON_EXPORT}
          </button>
          <button id="btn-close-panel" title="Close Accessibility Prism" style="background: rgba(255,255,255,0.1) !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 6px !important; width: 30px !important; height: 30px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; color: rgba(255,255,255,0.85) !important; transition: all 0.15s;"
            onmouseover="this.style.background='rgba(239,68,68,0.3)';this.style.color='white';"
            onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.color='rgba(255,255,255,0.85)';">
            ${icons.ICON_CLOSE}
          </button>
          <span id="collapse-icon" style="display: flex !important; align-items: center !important; color: rgba(255,255,255,0.85) !important; margin-left: 4px !important;">
            ${this.collapsed ? icons.ICON_MAXIMIZE : icons.ICON_MINIMIZE}
          </span>
        </div>
      </div>
    `;
  }

  public destroy() {
    this.container.remove();
    document.getElementById('a11y-panel-scoped-styles')?.remove();
  }

  private attachHeaderListeners() {
    const header = this.container.querySelector('#panel-header') as HTMLElement;
    if (header) {
      header.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('#btn-export') || target.closest('#btn-close-panel')) return;
        this.collapsed = !this.collapsed;
        this.render();
      });
    }

    this.container.querySelector('#btn-export')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onExportReport();
    });

    this.container.querySelector('#btn-close-panel')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onClose();
    });
  }

  // === View rendering delegation ===

  private renderScopeBanner(): string {
    if (!this.scopeElement) return '';
    return `
      <div style="padding: 8px 16px !important; background: #EFF6FF !important; border-bottom: 1px solid #BFDBFE !important; display: flex !important; align-items: center !important; gap: 8px !important; font-size: 12px !important; color: #1E40AF !important;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" style="flex-shrink: 0;">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span style="font-weight: 600 !important; color: #1E40AF !important;">Scoped:</span>
        <code style="background: #DBEAFE !important; padding: 1px 6px !important; border-radius: 4px !important; font-size: 11px !important; color: #1E3A8A !important; max-width: 240px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">${this.escHtml(this.scopeLabel)}</code>
        <button id="btn-clear-scope" style="margin-left: auto !important; background: none !important; border: 1px solid #93C5FD !important; border-radius: 4px !important; padding: 3px 10px !important; font-size: 12px !important; color: #1D4ED8 !important; cursor: pointer !important; font-weight: 600 !important; line-height: 1.5 !important;">Clear</button>
      </div>
    `;
  }

  private escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private renderViewContent(): string {
    const scopeBanner = this.renderScopeBanner();
    switch (this.currentView) {
      case 'pre-screen': return renderPreScreen();
      case 'axe-issue-list': return scopeBanner + renderAxeIssueList(this.getAxeListData());
      case 'axe-issue-details':
        if (!this.activeViolation) return scopeBanner + renderAxeIssueList(this.getAxeListData());
        return scopeBanner + renderAxeIssueDetails(this.activeViolation);
      case 'keyboard-issues': return renderKeyboardResults(this.getKbData());
      case 'manual-tracking': return renderManualTracking(this.manualTrail);
      case 'component-flow-list': return renderComponentFlowList(this.componentFlows);
      case 'component-flow-detail': {
        const flow = this.componentFlows[this.activeFlowIdx];
        if (!flow) return renderComponentFlowList(this.componentFlows);
        return renderComponentFlowDetail(flow, this.activeInstanceIdx);
      }
      case 'heading-results': return renderHeadingResults(this.headingData);
      case 'landmark-results': return renderLandmarkResults(this.landmarkData);
      case 'contrast-results': return renderContrastResults(this.contrastIssues);
      case 'focus-mgmt-results': return renderFocusMgmtResults(this.focusMgmtIssues);
      case 'live-region-results': return renderLiveRegionResults({ result: this.liveRegionData, severityFilter: this.liveRegionSeverityFilter });
      case 'touch-target-results': return renderTouchTargetResults(this.touchTargetIssues);
      case 'alt-text-results': return renderAltTextResults(this.altTextIssues, this.altTextSeverityFilter);
      case 'acc-name-results': return renderAccNameResults(this.getAccNameData());
      case 'aria-validation-results': return renderAriaResults(this.ariaResult, this.ariaSeverityFilter);
      case 'form-labels-results': return renderFormLabelsResults(this.formLabelsResult, this.formLabelsSeverityFilter);
      case 'sr-walkthrough': return renderSrWalkthrough(this.getWalkthroughData());
      case 'reading-order': return renderReadingOrderResults(this.readingOrderEntries);
      case 'scorecard': return this.scorecardData ? renderScorecardResults(this.scorecardData) : renderPreScreen();
      default: return renderPreScreen();
    }
  }

  private attachViewListeners() {
    const backToHome = () => {
      this.preserveScrollOnNavigate = true;
      this.currentView = 'pre-screen';
      this.clearScope();
      this.callbacks.onViolationClick([]);
      this.render();
    };
    const highlight = (els: Element[]) => this.callbacks.onViolationClick(els);

    this.container.querySelector('#btn-clear-scope')?.addEventListener('click', () => {
      this.preserveScrollOnNavigate = true;
      this.clearScope();
      this.currentView = 'pre-screen';
      this.callbacks.onViolationClick([]);
      this.render();
    });

    switch (this.currentView) {
      case 'pre-screen':
        attachPreScreenListeners(this.container, {
          onRunAxe: () => this.callbacks.onRunAxe(),
          onRunAutoKeyboard: () => this.callbacks.onRunAutoKeyboard(),
          onStartManual: () => { this.callbacks.onStartManualKeyboard(); this.currentView = 'manual-tracking'; this.render(); },
          onRunHeadings: () => this.callbacks.onRunHeadings(),
          onRunLandmarks: () => this.callbacks.onRunLandmarks(),
          onRunContrast: () => this.callbacks.onRunContrast(),
          onRunFocusMgmt: () => this.callbacks.onRunFocusMgmt(),
          onRunLiveRegions: () => this.callbacks.onRunLiveRegions(),
          onRunTouchTargets: () => this.callbacks.onRunTouchTargets(),
          onRunAltText: () => this.callbacks.onRunAltText(),
          onPartialScan: () => this.callbacks.onPartialScan(),
          onRunAccNames: () => this.callbacks.onRunAccNames(),
          onRunAriaValidation: () => this.callbacks.onRunAriaValidation(),
          onRunFormLabels: () => this.callbacks.onRunFormLabels(),
          onRunSrWalkthrough: () => this.callbacks.onRunSrWalkthrough(),
          onRunReadingOrder: () => this.callbacks.onRunReadingOrder(),
          onRunScorecard: () => this.callbacks.onRunScorecard(),
        });
        break;

      case 'axe-issue-list':
        attachAxeListListeners(this.container, this.getAxeListData(), {
          onBack: backToHome,
          onExport: () => this.callbacks.onExportReport(),
          onHighlight: highlight,
          onNavigateDetails: (v) => {
            this.activeViolation = v;
            this.currentView = 'axe-issue-details';
            this.render();
          },
          onFilterChange: (search, sev, mode, activeTypes, impactSet) => {
            this.searchQuery = search; this.filterSeverity = sev as any; this.groupMode = mode; this.activeResultTypes = activeTypes; this.filterImpact = impactSet;
            const cursorPos = (this.container.querySelector('#filter-search') as HTMLInputElement)?.selectionStart ?? search.length;
            this.render();
            const input = this.container.querySelector('#filter-search') as HTMLInputElement;
            if (input) { input.focus(); input.setSelectionRange(cursorPos, cursorPos); }
          },
        });
        break;

      case 'axe-issue-details':
        if (this.activeViolation) {
          attachAxeDetailsListeners(this.container, this.activeViolation, {
            onBack: () => {
              this.preserveScrollOnNavigate = true;
              this.currentView = 'axe-issue-list';
              this.render();
            },
            onHighlight: highlight,
          });
        }
        break;

      case 'keyboard-issues':
        attachKeyboardListeners(this.container, this.getKbData(), {
          onBack: backToHome,
          onHighlight: highlight,
          onNavigateFlow: () => { this.currentView = 'component-flow-list'; this.render(); },
          onGroupModeChange: (mode) => { this.kbGroupMode = mode; this.render(); },
          onSeverityFilterChange: (filter) => { this.kbSeverityFilter = filter; this.render(); },
        });
        break;

      case 'manual-tracking':
        attachManualListeners(this.container, {
          onReset: () => this.callbacks.onResetManualTrail(),
          onStop: () => this.callbacks.onStopManualKeyboard(),
          onBack: () => { this.callbacks.onStopManualKeyboard(); backToHome(); },
        });
        break;

      case 'component-flow-list':
        attachFlowListListeners(this.container, this.componentFlows, {
          onBack: () => {
            this.preserveScrollOnNavigate = true;
            this.currentView = this.keyboardIssues.length > 0 ? 'keyboard-issues' : 'pre-screen';
            this.callbacks.onViolationClick([]);
            this.render();
          },
          onSelectFlow: (idx) => { this.activeFlowIdx = idx; this.activeInstanceIdx = 0; this.currentView = 'component-flow-detail'; this.render(); },
        });
        break;

      case 'component-flow-detail': {
        const flow = this.componentFlows[this.activeFlowIdx];
        if (flow) {
          attachFlowDetailListeners(this.container, flow, this.activeInstanceIdx, {
            onBack: () => {
              this.preserveScrollOnNavigate = true;
              this.currentView = 'component-flow-list';
              this.callbacks.onViolationClick([]);
              this.render();
            },
            onHighlight: highlight,
            onPrev: () => { this.activeInstanceIdx--; this.render(); },
            onNext: () => { this.activeInstanceIdx++; this.render(); },
            onShowFlow: (f, idx) => this.callbacks.onShowComponentFlow(f, idx),
          });
        }
        break;
      }

      case 'heading-results':
        attachHeadingListeners(this.container, this.headingData, { onBack: backToHome, onHighlight: highlight });
        break;

      case 'landmark-results':
        attachLandmarkListeners(this.container, this.landmarkData, { onBack: backToHome, onHighlight: highlight });
        break;

      case 'contrast-results':
        attachContrastListeners(this.container, this.contrastIssues, { onBack: backToHome, onHighlight: highlight });
        break;

      case 'focus-mgmt-results':
        attachFocusMgmtListeners(this.container, this.focusMgmtIssues, { onBack: backToHome, onHighlight: highlight });
        break;

      case 'live-region-results':
        attachLiveRegionListeners(
          this.container,
          { result: this.liveRegionData, severityFilter: this.liveRegionSeverityFilter },
          {
            onBack: backToHome,
            onHighlight: highlight,
            onSeverityChange: next => {
              this.liveRegionSeverityFilter = next;
              this.render();
            },
          },
        );
        break;

      case 'touch-target-results':
        attachTouchTargetListeners(this.container, this.touchTargetIssues, { onBack: backToHome, onHighlight: highlight });
        break;

      case 'alt-text-results':
        attachAltTextListeners(
          this.container,
          this.altTextIssues,
          {
            onBack: backToHome,
            onHighlight: highlight,
            onSeverityChange: next => {
              this.altTextSeverityFilter = next;
              this.render();
            },
          },
          this.altTextSeverityFilter,
        );
        break;

      case 'acc-name-results':
        attachAccNameListeners(this.container, this.getAccNameData(), {
          onBack: backToHome,
          onHighlight: highlight,
          onSeverityChange: next => {
            this.accNameSeverityFilter = next;
            this.render();
          },
          onSearchInput: value => {
            this.accNameSearch = value;
            const cursorPos =
              (this.container.querySelector('.a11y-search-input') as HTMLInputElement)?.selectionStart ??
              value.length;
            this.render();
            const input = this.container.querySelector('.a11y-search-input') as HTMLInputElement;
            if (input) {
              input.focus();
              input.setSelectionRange(cursorPos, cursorPos);
            }
          },
        });
        break;

      case 'aria-validation-results':
        attachAriaListeners(
          this.container,
          this.ariaResult,
          {
            onBack: backToHome,
            onHighlight: highlight,
            onSeverityChange: next => {
              this.ariaSeverityFilter = next;
              this.render();
            },
          },
          this.ariaSeverityFilter,
        );
        break;

      case 'form-labels-results':
        attachFormLabelsListeners(
          this.container,
          this.formLabelsResult,
          {
            onBack: backToHome,
            onHighlight: highlight,
            onSeverityChange: next => {
              this.formLabelsSeverityFilter = next;
              this.render();
            },
          },
          this.formLabelsSeverityFilter,
        );
        break;

      case 'sr-walkthrough':
        attachWalkthroughListeners(this.container, this.getWalkthroughData(), {
          onBack: backToHome, onHighlight: highlight,
          onNavigate: (idx) => { this.walkthroughIndex = idx; this.render(); },
        });
        break;

      case 'reading-order':
        attachReadingOrderListeners(this.container, this.readingOrderEntries, { onBack: backToHome, onHighlight: highlight });
        break;

      case 'scorecard':
        if (this.scorecardData) {
          attachScorecardListeners(this.container, this.scorecardData, {
            onBack: backToHome,
            onExportScorecard: () => this.callbacks.onExportScorecard(),
          });
        }
        break;
    }
  }

  // === Data helpers ===

  private getAxeListData(): AxeListData {
    return {
      violations: this.violations, components: this.components, dedupedIssues: this.dedupedIssues,
      regions: this.regions, searchQuery: this.searchQuery, filterSeverity: this.filterSeverity,
      groupMode: this.groupMode, activeResultTypes: this.activeResultTypes,
      filterImpact: this.filterImpact,
    };
  }

  private getKbData(): KbData {
    return {
      issues: this.keyboardIssues, componentFlows: this.componentFlows, components: this.components,
      groupMode: this.kbGroupMode, severityFilter: this.kbSeverityFilter,
    };
  }

  private getAccNameData(): AccNameData {
    return {
      result: this.accNameResult,
      searchQuery: this.accNameSearch,
      activeSeverities: this.accNameSeverityFilter,
    };
  }

  private getWalkthroughData(): WalkthroughData {
    return { entries: this.walkthroughEntries, currentIndex: this.walkthroughIndex };
  }
}
