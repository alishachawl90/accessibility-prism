/**
 * Panel UI entry point — loaded by panel.html (popup window) and by index.html (standalone test mode).
 *
 * POPUP WINDOW MODE (default):
 *   - Connects to the content script via chrome.runtime port 'prism-panel'
 *   - All PanelCallbacks dispatch CommandMessages to the content script
 *   - Receives ResultMessages and calls panel.update*() to re-render views
 *
 * STANDALONE TEST MODE (window.__A11Y_STANDALONE__ = true):
 *   - No chrome.runtime — wires analysis callbacks directly to FloatingPanel
 *   - Exactly the same wiring as the original main.ts
 *   - All 144 Playwright tests run in this mode unchanged
 */

import { FloatingPanel } from './ui/panel';
import {
  initializeOverlay, drawHighlight, drawTabOrderOverlay,
  drawHeadingMarkers, drawLandmarkMarkers, drawReadingOrderMarkers, clearOverlay,
} from './ui/overlay';
import { generateHtmlReport } from './utils/html-report';
import { startElementPicker, getElementDescription } from './ui/element-picker';
import { runFullScorecard, type ScorecardResult } from './core/scorecard';
import { generateScorecardHtml } from './utils/scorecard-report';
import { runAxe } from './core/axe-runner';
import { detectComponents } from './core/component-detection';
import { analyzeKeyboardFlow, getTabOrder, analyzeComponentTabFlows } from './core/keyboard-analysis';
import { deduplicateViolations } from './core/deduplication';
import { mapViolationsToRegions } from './core/region-detection';
import { analyzeHeadings } from './core/heading-analysis';
import { analyzeLandmarks } from './core/landmark-analysis';
import { analyzeContrast } from './core/contrast-analysis';
import { analyzeFocusManagement } from './core/focus-management';
import { analyzeLiveRegions } from './core/live-region-monitor';
import { analyzeTouchTargets } from './core/touch-target-analysis';
import { analyzeAltText } from './core/alt-text-analysis';
import { analyzeAccessibleNames, analyzeForSrWalkthrough } from './core/acc-name-analysis';
import { validateAria } from './core/aria-validation';
import { analyzeFormLabels } from './core/form-labels-analysis';
import type { AxeViolation, ComponentCluster, ComponentIssue, KeyboardIssue, ComponentTabFlow } from './core/types';
import type { PageRegion } from './core/region-detection';
import { PORT_NAME, type CommandMessage, type ResultMessage } from './messages';
import { createActivationButton } from './ui/activation-button';

// ────────────────────────────────────────────────────────────────────────────
// Standalone mode (used by test fixture index.html)
// ────────────────────────────────────────────────────────────────────────────

class StandaloneA11yUI {
  private panel!: FloatingPanel;
  private overlaySvg!: SVGSVGElement;

  private violations: AxeViolation[] = [];
  private components = new Map<string, ComponentCluster>();
  private dedupedIssues: ComponentIssue[] = [];
  private keyboardIssues: KeyboardIssue[] = [];
  private componentFlows: ComponentTabFlow[] = [];
  private regions: PageRegion[] = [];
  private manualFocusListener?: (e: FocusEvent) => void;
  private manualTrail: Element[] = [];
  private cancelPicker?: () => void;
  private latestScorecard: ScorecardResult | null = null;

  constructor() {
    this.overlaySvg = initializeOverlay();
    this.panel = new FloatingPanel({
      onRunAxe: () => this.runAutomatedAxe(),
      onRunAutoKeyboard: () => this.runAutoKeyboard(),
      onStartManualKeyboard: () => {},        // navigation only — panel.ts handles it
      onBeginManualRecording: () => this.startManualKeyboard(),
      onStopManualKeyboard: () => this.stopManualKeyboard(),
      onResetManualTrail: () => this.resetManualTrail(),
      onRefresh: () => { clearOverlay(this.overlaySvg); this.stopManualKeyboard(); this.dismissPicker(); },
      onExportReport: () => this.exportReport(),
      onViolationClick: (nodes) => this.handleViolationClick(nodes),
      onShowComponentFlow: (flow, instanceIdx) => this.showComponentFlow(flow, instanceIdx),
      onRunHeadings: () => this.runHeadingAnalysis(),
      onRunLandmarks: () => this.runLandmarkAnalysis(),
      onRunContrast: () => this.runContrastAnalysis(),
      onRunFocusMgmt: () => this.runFocusManagement(),
      onRunLiveRegions: () => this.runLiveRegionAnalysis(),
      onRunTouchTargets: () => this.runTouchTargetAnalysis(),
      onRunAltText: () => this.runAltTextAudit(),
      onPartialScan: () => this.startPartialScan(),
      onScopePick: () => this.startScopePicker(),
      onScopeSelector: (sel: string) => this.setScopeFromSelector(sel),
      onClearScope: () => { /* scope is a getter from panel.getScopeElement() — no extra cleanup needed */ },
      onRunAccNames: () => this.runAccNameInspector(),
      onRunAriaValidation: () => this.runAriaValidation(),
      onRunFormLabels: () => this.runFormLabelsAudit(),
      onRunSrWalkthrough: () => this.runSrWalkthrough(),
      onRunReadingOrder: () => this.runReadingOrder(),
      onRunScorecard: () => this.runScorecard(),
      onExportScorecard: () => this.exportScorecard(),
      onClose: () => this.destroy(),
    });
  }

  public destroy() {
    this.stopManualKeyboard();
    this.dismissPicker();
    clearOverlay(this.overlaySvg);
    this.overlaySvg.remove();
    this.panel.destroy();
    (window as any).__a11y_analyzer_instance = null;
    createActivationButton(() => { (window as any).A11yAnalyzerInit(); });
  }

  public handleViolationClick(nodes: Element[]) {
    clearOverlay(this.overlaySvg);
    if (!nodes.length) { this.stopManualKeyboard(); return; }
    nodes[0].scrollIntoView({ behavior: 'instant', block: 'center' });
    requestAnimationFrame(() => {
      nodes.forEach(node => this.overlaySvg.appendChild(drawHighlight(node, '#E03E79', 'Issue Focus')));
    });
  }

  public showComponentFlow(flow: ComponentTabFlow, instanceIdx: number) {
    clearOverlay(this.overlaySvg);
    const instance = flow.instances[instanceIdx];
    if (!instance) return;
    instance.root.scrollIntoView({ behavior: 'instant', block: 'center' });
    requestAnimationFrame(() => {
      this.overlaySvg.appendChild(drawHighlight(instance.root, '#388E3C', flow.component.name));
      drawTabOrderOverlay(this.overlaySvg, instance.focusable);
    });
  }

  private dismissPicker() {
    if (this.cancelPicker) { this.cancelPicker(); this.cancelPicker = undefined; }
  }

  private get scope(): Element | undefined {
    return this.panel.getScopeElement() ?? undefined;
  }

  async runAutomatedAxe() {
    this.dismissPicker();
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.panel.showLoading('Running automated tests…');
    await new Promise(r => requestAnimationFrame(r));
    this.components = detectComponents();
    this.violations = await runAxe();
    this.dedupedIssues = deduplicateViolations(this.violations, this.components);
    this.regions = mapViolationsToRegions(this.violations);
    this.panel.updateAxeResults(this.violations, this.components, this.dedupedIssues, this.regions);
  }

  async runAutoKeyboard() {
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.panel.showLoading('Analyzing keyboard accessibility…');
    await new Promise(r => requestAnimationFrame(r));
    this.components = detectComponents();
    this.keyboardIssues = analyzeKeyboardFlow();
    const tabOrder = getTabOrder();
    this.componentFlows = analyzeComponentTabFlows(this.components, tabOrder, this.keyboardIssues);
    drawTabOrderOverlay(this.overlaySvg, tabOrder);
    this.panel.updateKeyboardResults(this.keyboardIssues, this.componentFlows);
  }

  startManualKeyboard() {
    clearOverlay(this.overlaySvg);
    this.stopManualKeyboard();
    this.manualTrail = [];
    this.manualFocusListener = (e: FocusEvent) => {
      const target = e.target as Element;
      if (!target || target.closest('#a11y-analyzer-panel')) return;
      this.manualTrail.push(target);
      clearOverlay(this.overlaySvg);
      drawTabOrderOverlay(this.overlaySvg, this.manualTrail);
      this.panel.updateManualTrail(this.manualTrail);
    };
    document.addEventListener('focusin', this.manualFocusListener);
  }

  private resetManualTrail() {
    this.manualTrail = [];
    clearOverlay(this.overlaySvg);
    this.panel.updateManualTrail(this.manualTrail);
  }

  private stopManualKeyboard() {
    if (this.manualFocusListener) {
      document.removeEventListener('focusin', this.manualFocusListener);
      this.manualFocusListener = undefined;
    }
  }

  runHeadingAnalysis() {
    clearOverlay(this.overlaySvg);
    const result = analyzeHeadings(this.scope);
    drawHeadingMarkers(this.overlaySvg, result.headings);
    this.panel.updateHeadingResults(result);
  }

  runLandmarkAnalysis() {
    clearOverlay(this.overlaySvg);
    const result = analyzeLandmarks(this.scope);
    drawLandmarkMarkers(this.overlaySvg, result.landmarks);
    this.panel.updateLandmarkResults(result);
  }

  runContrastAnalysis() {
    clearOverlay(this.overlaySvg);
    this.panel.updateContrastResults(analyzeContrast(this.scope));
  }

  runFocusManagement() {
    clearOverlay(this.overlaySvg);
    this.panel.updateFocusMgmtResults(analyzeFocusManagement(this.scope));
  }

  runLiveRegionAnalysis() {
    clearOverlay(this.overlaySvg);
    this.panel.updateLiveRegionResults(analyzeLiveRegions(this.scope));
  }

  runTouchTargetAnalysis() {
    clearOverlay(this.overlaySvg);
    this.panel.updateTouchTargetResults(analyzeTouchTargets(this.scope));
  }

  runAltTextAudit() {
    clearOverlay(this.overlaySvg);
    this.panel.updateAltTextResults(analyzeAltText(this.scope));
  }

  runAccNameInspector() {
    clearOverlay(this.overlaySvg);
    this.panel.updateAccNameResults(analyzeAccessibleNames(this.scope));
  }

  runAriaValidation() {
    clearOverlay(this.overlaySvg);
    this.panel.updateAriaResults(validateAria(this.scope));
  }

  runFormLabelsAudit() {
    clearOverlay(this.overlaySvg);
    this.panel.updateFormLabelsResults(analyzeFormLabels(this.scope));
  }

  runSrWalkthrough() {
    clearOverlay(this.overlaySvg);
    this.panel.startWalkthrough(analyzeForSrWalkthrough(this.scope).entries);
  }

  runReadingOrder() {
    clearOverlay(this.overlaySvg);
    const result = analyzeAccessibleNames(this.scope);
    drawReadingOrderMarkers(this.overlaySvg, result.entries);
    this.panel.showReadingOrder(result.entries);
  }

  async runScorecard() {
    this.dismissPicker();
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.panel.showLoading('Running full scorecard…');
    await new Promise(r => requestAnimationFrame(r));
    const result = await runFullScorecard();
    this.latestScorecard = result;
    this.panel.updateScorecardResults(result);
  }

  startScopePicker() {
    this.panel.hide();
    clearOverlay(this.overlaySvg);
    this.cancelPicker = startElementPicker(
      (el: Element) => {
        this.cancelPicker = undefined;
        const label = getElementDescription(el);
        this.panel.setScopeElement(el, label);
        this.panel.show();
        this.overlaySvg.appendChild(drawHighlight(el, '#2563EB', 'Scope'));
      },
      () => { this.cancelPicker = undefined; this.panel.show(); }
    );
  }

  setScopeFromSelector(selector: string): boolean {
    try {
      const el = document.querySelector(selector);
      if (!el) return false;
      clearOverlay(this.overlaySvg);
      this.panel.setScopeElement(el, getElementDescription(el));
      this.overlaySvg.appendChild(drawHighlight(el, '#2563EB', 'Scope'));
      return true;
    } catch { return false; }
  }

  startPartialScan() {
    this.panel.hide();
    clearOverlay(this.overlaySvg);
    this.cancelPicker = startElementPicker(
      (el: Element) => {
        this.cancelPicker = undefined;
        const label = getElementDescription(el);
        this.panel.setScopeElement(el, label);
        this.panel.show();
        this.overlaySvg.appendChild(drawHighlight(el, '#2563EB', 'Scan scope'));
        this.runScopedAxe(el);
      },
      () => { this.cancelPicker = undefined; this.panel.clearScope(); this.panel.show(); }
    );
  }

  async runScopedAxe(root: Element) {
    this.stopManualKeyboard();
    this.panel.showLoading('Scanning selected region…');
    await new Promise(r => requestAnimationFrame(r));
    this.components = detectComponents();
    this.violations = await runAxe(root);
    this.dedupedIssues = deduplicateViolations(this.violations, this.components);
    this.regions = mapViolationsToRegions(this.violations);
    this.panel.updateAxeResults(this.violations, this.components, this.dedupedIssues, this.regions);
  }

  private exportReport() {
    const html = generateHtmlReport(this.violations, this.components, this.dedupedIssues, this.keyboardIssues);
    this.downloadBlob(html, `accessibility-prism-report-${Date.now()}.html`);
  }

  private exportScorecard() {
    if (!this.latestScorecard) return;
    this.downloadBlob(generateScorecardHtml(this.latestScorecard), `accessibility-prism-scorecard-${Date.now()}.html`);
  }

  private downloadBlob(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Popup window mode
// ────────────────────────────────────────────────────────────────────────────

class PopupWindowUI {
  private panel!: FloatingPanel;
  private port!: chrome.runtime.Port;
  private tabId = 0;

  // ── Tab focus helpers ────────────────────────────────────────────────────

  /** Switch focus to the page being inspected so the user can interact with it. */
  private focusInspectedTab() {
    if (!this.tabId) return;
    chrome.tabs.get(this.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;
      // Activate the tab inside its window, then focus that window.
      chrome.tabs.update(this.tabId, { active: true }, () => {
        if (tab.windowId) chrome.windows.update(tab.windowId, { focused: true });
      });
    });
  }

  /** Return focus to this popup window after page interaction is done. */
  private focusPopup() {
    chrome.windows.getCurrent({}, (win) => {
      if (win?.id != null) chrome.windows.update(win.id, { focused: true });
    });
  }

  // ── Constructor ──────────────────────────────────────────────────────────

  constructor() {
    this.panel = new FloatingPanel({
      isPopupWindow: true,
      onRunAxe: () => this.cmd({ type: 'RUN_AXE' }),
      onRunAutoKeyboard: () => this.cmd({ type: 'RUN_AUTO_KEYBOARD' }),
      // Clicking "Manual Keyboard Test" in the pre-screen just navigates to the
      // ready screen — the panel handles this internally, no command needed yet.
      onStartManualKeyboard: () => {},
      onBeginManualRecording: () => {
        // User clicked "Start Recording" — start listening and switch to the page.
        this.cmd({ type: 'START_MANUAL' });
        this.focusInspectedTab();
      },
      onStopManualKeyboard: () => this.cmd({ type: 'STOP_MANUAL' }),
      onResetManualTrail: () => this.cmd({ type: 'RESET_MANUAL' }),
      onHighlightBySelector: (sel: string) => this.cmd({ type: 'HIGHLIGHT_BY_SELECTOR', selector: sel }),
      onRefresh: () => this.cmd({ type: 'CLEAR_OVERLAY' }),
      onExportReport: () => this.cmd({ type: 'EXPORT_REPORT' }),
      onViolationClick: (nodes) => {
        // nodes here are serialized { selector, snippet } objects (not real Elements).
        // When nodes is empty (e.g. navigating back), clear the overlay instead.
        const sel = (nodes[0] as unknown as { selector?: string })?.selector;
        if (sel) this.cmd({ type: 'HIGHLIGHT_BY_SELECTOR', selector: sel });
        else this.cmd({ type: 'CLEAR_OVERLAY' });
      },
      onShowComponentFlow: (flow, instanceIdx) => this.cmd({ type: 'SHOW_COMPONENT_FLOW', componentName: flow.component.name, instanceIdx }),
      onRunHeadings: () => this.cmd({ type: 'RUN_HEADINGS' }),
      onRunLandmarks: () => this.cmd({ type: 'RUN_LANDMARKS' }),
      onRunContrast: () => this.cmd({ type: 'RUN_CONTRAST' }),
      onRunFocusMgmt: () => this.cmd({ type: 'RUN_FOCUS_MGMT' }),
      onRunLiveRegions: () => this.cmd({ type: 'RUN_LIVE_REGIONS' }),
      onRunTouchTargets: () => this.cmd({ type: 'RUN_TOUCH_TARGETS' }),
      onRunAltText: () => this.cmd({ type: 'RUN_ALT_TEXT' }),
      onPartialScan: () => this.cmd({ type: 'START_PARTIAL_SCAN' }),
      onScopePick: () => {
        this.cmd({ type: 'START_SCOPE_PICK' });
        // Focus the page so the user can click the element they want to scope.
        this.focusInspectedTab();
      },
      onScopeSelector: (sel: string) => {
        // Set up deferred re-run so SCOPE_SET reply triggers the audit (not here).
        this.panel.prepareScopePickRerun();
        this.cmd({ type: 'SET_SCOPE_SELECTOR', selector: sel });
        return false; // prevent applyScope() from re-running immediately
      },
      onClearScope: () => this.cmd({ type: 'CLEAR_SCOPE' }),
      onRunAccNames: () => this.cmd({ type: 'RUN_ACC_NAMES' }),
      onRunAriaValidation: () => this.cmd({ type: 'RUN_ARIA' }),
      onRunFormLabels: () => this.cmd({ type: 'RUN_FORM_LABELS' }),
      onRunSrWalkthrough: () => this.cmd({ type: 'RUN_SR_WALKTHROUGH' }),
      onRunReadingOrder: () => this.cmd({ type: 'RUN_READING_ORDER' }),
      onRunScorecard: () => this.cmd({ type: 'RUN_SCORECARD' }),
      onExportScorecard: () => this.cmd({ type: 'EXPORT_SCORECARD' }),
      onClose: () => window.close(),
      onCancelTabWalk: () => this.cmd({ type: 'CANCEL_TAB_WALK' }),
      onShowInDevTools: (_auditType, _index, selector) =>
        this.cmd({ type: 'PREPARE_DEVTOOLS_INSPECT', selector }),
    });

    // chrome.runtime.connect() reaches the background service worker, NOT content scripts.
    // Use chrome.tabs.connect(tabId) so the connection lands in the content script
    // running in the inspected tab. The tabId is passed via URL param by background.js.
    const params = new URLSearchParams(window.location.search);
    this.tabId = parseInt(params.get('tabId') ?? '0', 10);
    if (!this.tabId) {
      console.error('[Prism] No tabId in URL — cannot connect to content script');
      return;
    }
    this.port = chrome.tabs.connect(this.tabId, { name: PORT_NAME });
    this.port.onMessage.addListener((msg: ResultMessage) => this.handleResult(msg));
    this.port.onDisconnect.addListener(() => {
      console.warn('[Prism] Content script disconnected');
    });
    this.port.postMessage({ type: 'PANEL_READY' } as CommandMessage);
  }

  private cmd(msg: CommandMessage) {
    try { this.port.postMessage(msg); } catch { /* port closed */ }
  }

  private handleResult(msg: ResultMessage) {
    switch (msg.type) {
      case 'LOADING':
        this.panel.showLoading(msg.label);
        break;
      case 'AXE_RESULTS': {
        const compMap = new Map<string, ComponentCluster>(msg.components);
        this.panel.updateAxeResults(msg.violations, compMap, msg.dedupedIssues, msg.regions);
        break;
      }
      case 'KEYBOARD_RESULTS':
        this.panel.updateKeyboardResults(msg.issues, msg.flows);
        break;
      case 'TAB_WALK_START':
        this.panel.startTabWalk(msg.total);
        break;
      case 'TAB_WALK_STEP':
        this.panel.updateTabWalkStep(msg.index, msg.total);
        break;
      case 'TAB_WALK_COMPLETE':
        this.panel.updateKeyboardResults(msg.issues, msg.flows, msg.missedElements);
        // Walk finished — bring the results popup back into focus.
        this.focusPopup();
        break;
      case 'HEADING_RESULTS':
        this.panel.updateHeadingResults(msg.result);
        break;
      case 'LANDMARK_RESULTS':
        this.panel.updateLandmarkResults(msg.result);
        break;
      case 'CONTRAST_RESULTS':
        this.panel.updateContrastResults(msg.issues);
        break;
      case 'FOCUS_MGMT_RESULTS':
        this.panel.updateFocusMgmtResults(msg.issues);
        break;
      case 'LIVE_REGION_RESULTS':
        this.panel.updateLiveRegionResults(msg.result);
        break;
      case 'TOUCH_TARGET_RESULTS':
        this.panel.updateTouchTargetResults(msg.issues);
        break;
      case 'ALT_TEXT_RESULTS':
        this.panel.updateAltTextResults(msg.issues);
        break;
      case 'ACC_NAME_RESULTS':
        this.panel.updateAccNameResults(msg.result);
        break;
      case 'ARIA_RESULTS':
        this.panel.updateAriaResults(msg.result);
        break;
      case 'FORM_LABELS_RESULTS':
        this.panel.updateFormLabelsResults(msg.result);
        break;
      case 'SR_WALKTHROUGH_RESULTS':
        this.panel.startWalkthrough(msg.entries);
        break;
      case 'READING_ORDER_RESULTS':
        this.panel.showReadingOrder(msg.entries);
        break;
      case 'SCORECARD_RESULTS':
        this.panel.updateScorecardResults(msg.result);
        break;
      case 'TRAIL_UPDATE':
        this.panel.updateSerializedTrail(msg.trail);
        break;
      case 'TRAIL_COMPLETE':
        this.panel.updateSerializedTrail(msg.trail);
        // Manual keyboard recording finished — bring the popup back to the front.
        this.focusPopup();
        break;
      case 'SCOPE_SET':
        if (msg.label) this.panel.setScopeLabel(msg.label);
        else this.panel.clearScope();
        // Element was picked (or scope cleared) — return focus to the popup.
        this.focusPopup();
        break;
      case 'SCOPE_SET_FROM_SELECTOR_FAILED':
        // Selector didn't match anything — cancel the deferred re-run.
        this.panel.cancelPendingRerun();
        break;
      case 'SCOPE_PICK_STARTED':
        // Content script is ready for the pick — page focus was already requested
        // in onScopePick; just update the panel loading label.
        this.panel.showLoading('Click an element on the page to select scope…');
        break;
      case 'CONTENT_READY':
        this.panel.setPageInfo(msg.url, msg.title);
        break;
      case 'DEVTOOLS_INSPECT_READY':
        // Forward the resolved CSS selector to devtools.js so it can call
        // chrome.devtools.inspectedWindow.eval('inspect(...)').
        chrome.runtime.sendMessage({ type: 'DEVTOOLS_INSPECT', selector: msg.tempId });
        break;
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Boot
// ────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  const standalone = (window as any).__A11Y_STANDALONE__;

  if (standalone) {
    (window as any).A11yAnalyzerInit = () => {
      if ((window as any).__a11y_analyzer_instance) {
        console.warn('A11yAnalyzer already initialized');
        return;
      }
      (window as any).__a11y_analyzer_instance = new StandaloneA11yUI();
    };
    createActivationButton(() => { (window as any).A11yAnalyzerInit(); });
  } else {
    // Popup window — mount immediately when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new PopupWindowUI());
    } else {
      new PopupWindowUI();
    }
  }
}
