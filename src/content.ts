/**
 * Content script — runs in the host page context.
 *
 * In POPUP WINDOW MODE (the default Chrome extension mode):
 *   - Listens for the popup window to connect via chrome.runtime.connect (PORT_NAME = 'prism-panel')
 *   - Receives CommandMessages from the popup, runs analysis, serializes results, sends back
 *   - Owns all live Element references; the popup never receives Elements directly
 *   - Cleans up overlays and listeners when the popup disconnects
 *
 * In STANDALONE TEST MODE (window.__A11Y_STANDALONE__ = true, used by index.html + Playwright):
 *   - No chrome.runtime — analysis + UI are wired directly via callbacks (original main.ts behaviour)
 *   - See panel-ui.ts for the standalone wiring
 */

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
import type { PageRegion } from './core/region-detection';
import type { AxeViolation, ComponentCluster, ComponentIssue, KeyboardIssue, ComponentTabFlow } from './core/types';
import {
  initializeOverlay, drawHighlight, drawTabOrderOverlay,
  drawTabStopBadge, drawTabStopArrow,
  drawHeadingMarkers, drawLandmarkMarkers, drawReadingOrderMarkers, clearOverlay,
} from './ui/overlay';
import { generateHtmlReport } from './utils/html-report';
import { startElementPicker, getElementDescription } from './ui/element-picker';
import { runFullScorecard, type ScorecardResult } from './core/scorecard';
import { generateScorecardHtml } from './utils/scorecard-report';
import { serializeElement, serializeResult } from './utils/dom-utils';
import { PORT_NAME, type CommandMessage, type ResultMessage, type SerializedTrailEntry } from './messages';

// ────────────────────────────────────────────────────────────────────────────

class A11yContent {
  private overlaySvg!: SVGSVGElement;

  // Raw results with live Element refs — never sent across the message boundary
  private violations: AxeViolation[] = [];
  private components = new Map<string, ComponentCluster>();
  private dedupedIssues: ComponentIssue[] = [];
  private keyboardIssues: KeyboardIssue[] = [];
  private componentFlows: ComponentTabFlow[] = [];
  private regions: PageRegion[] = [];
  private manualTrail: Element[] = [];
  private latestScorecard: ScorecardResult | null = null;

  private manualFocusListener?: (e: FocusEvent) => void;
  private manualEscListener?: (e: KeyboardEvent) => void;
  private cancelPicker?: () => void;
  private scopeElement: Element | null = null;
  private port: chrome.runtime.Port | null = null;
  private tabWalkCancelled = false;

  constructor() {
    this.overlaySvg = initializeOverlay();
    this.listenForPopup();
  }

  // ── Port management ────────────────────────────────────────────────────

  private listenForPopup() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== PORT_NAME) return;
      this.port = port;
      this.send({ type: 'CONTENT_READY', url: window.location.href, title: document.title });

      port.onMessage.addListener((msg: CommandMessage) => this.handleCommand(msg));
      port.onDisconnect.addListener(() => this.handleDisconnect());
    });
  }

  private send(msg: ResultMessage) {
    if (this.port) {
      try { this.port.postMessage(msg); } catch { /* port may have closed */ }
    }
  }

  private handleDisconnect() {
    this.port = null;
    this.stopManualKeyboard();
    this.dismissPicker();
    clearOverlay(this.overlaySvg);
  }

  // ── Command dispatcher ────────────────────────────────────────────────

  private handleCommand(msg: CommandMessage) {
    switch (msg.type) {
      case 'PANEL_READY':      break;
      case 'RUN_AXE':          this.runAutomatedAxe(); break;
      case 'RUN_AUTO_KEYBOARD':this.runAutoKeyboard(); break;
      case 'START_MANUAL':     this.startManualKeyboard(); break;
      case 'STOP_MANUAL':      this.stopManualKeyboard(); break;
      case 'RESET_MANUAL':     this.resetManualTrail(); break;
      case 'RUN_HEADINGS':     this.runHeadingAnalysis(); break;
      case 'RUN_LANDMARKS':    this.runLandmarkAnalysis(); break;
      case 'RUN_CONTRAST':     this.runContrastAnalysis(); break;
      case 'RUN_FOCUS_MGMT':   this.runFocusManagement(); break;
      case 'RUN_LIVE_REGIONS': this.runLiveRegionAnalysis(); break;
      case 'RUN_TOUCH_TARGETS':this.runTouchTargetAnalysis(); break;
      case 'RUN_ALT_TEXT':     this.runAltTextAudit(); break;
      case 'RUN_ACC_NAMES':    this.runAccNameInspector(); break;
      case 'RUN_ARIA':         this.runAriaValidation(); break;
      case 'RUN_FORM_LABELS':  this.runFormLabelsAudit(); break;
      case 'RUN_SR_WALKTHROUGH':this.runSrWalkthrough(); break;
      case 'RUN_READING_ORDER':this.runReadingOrder(); break;
      case 'RUN_SCORECARD':    this.runScorecard(); break;
      case 'START_PARTIAL_SCAN':this.startPartialScan(); break;
      case 'START_SCOPE_PICK': this.startScopePicker(); break;
      case 'SET_SCOPE_SELECTOR':this.setScopeFromSelector(msg.selector); break;
      case 'CLEAR_SCOPE':      this.scopeElement = null; break;
      case 'EXPORT_REPORT':    this.exportReport(); break;
      case 'EXPORT_SCORECARD': this.exportScorecard(); break;
      case 'HIGHLIGHT':                this.highlight(msg.auditType, msg.index); break;
      case 'HIGHLIGHT_BY_SELECTOR':   this.highlightBySelector(msg.selector, msg.color, msg.label); break;
      case 'SHOW_COMPONENT_FLOW':     this.showComponentFlow(msg.componentName, msg.instanceIdx); break;
      case 'CANCEL_TAB_WALK':         this.tabWalkCancelled = true; break;
      case 'PREPARE_DEVTOOLS_INSPECT': this.prepareDevToolsInspect(msg.selector); break;
    }
  }

  // ── Scope helper ──────────────────────────────────────────────────────

  private get scope(): Element | undefined {
    return this.scopeElement ?? undefined;
  }

  // ── Highlight / overlay ───────────────────────────────────────────────

  private highlight(auditType: string, index: number) {
    clearOverlay(this.overlaySvg);
    const el = this.resolveElement(auditType, index);
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    requestAnimationFrame(() => {
      this.overlaySvg.appendChild(drawHighlight(el, '#E03E79', 'Issue Focus'));
    });
  }

  private prepareDevToolsInspect(selector: string) {
    let el: Element | null = null;
    try { el = document.querySelector(selector); } catch { /* invalid selector */ }
    if (!el) {
      console.warn('[Prism] Could not find element to inspect:', selector);
      return;
    }
    // Assign a stable temp ID so devtools.js can call inspect(document.querySelector('#tempId'))
    const tempId = '__prism_inspect__' + Date.now();
    const oldId = el.getAttribute('id');
    el.setAttribute('id', tempId);
    this.send({ type: 'DEVTOOLS_INSPECT_READY', tempId: `#${tempId}` });
    // Restore original ID after DevTools has had time to receive the message
    setTimeout(() => {
      if (oldId !== null) el!.setAttribute('id', oldId);
      else el!.removeAttribute('id');
    }, 2000);
  }

  private highlightBySelector(selector: string, color = '#E03E79', label = 'Issue Focus') {
    if (!selector) return;
    try {
      const el = document.querySelector(selector);
      if (!el) return;
      clearOverlay(this.overlaySvg);
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      requestAnimationFrame(() => {
        this.overlaySvg.appendChild(drawHighlight(el, color, label));
      });
    } catch { /* invalid selector */ }
  }

  private resolveElement(auditType: string, index: number): Element | null {
    switch (auditType) {
      case 'axe': {
        const v = this.violations[index];
        return v?.nodes?.[0]?.element ?? null;
      }
      case 'keyboard':    return this.keyboardIssues[index]?.element ?? null;
      case 'manual':      return this.manualTrail[index] ?? null;
      case 'component-flow': {
        const [flowIdx, instanceIdx] = String(index).split(':').map(Number);
        const flow = this.componentFlows[flowIdx];
        const inst = flow?.instances[instanceIdx ?? 0];
        return inst?.root ?? null;
      }
      default: return null;
    }
  }

  public handleViolationHighlight(nodes: Element[]) {
    clearOverlay(this.overlaySvg);
    if (!nodes.length) { this.stopManualKeyboard(); return; }
    nodes[0].scrollIntoView({ behavior: 'instant', block: 'center' });
    requestAnimationFrame(() => {
      nodes.forEach(node => this.overlaySvg.appendChild(drawHighlight(node, '#E03E79', 'Issue Focus')));
    });
  }

  private showComponentFlow(componentName: string, instanceIdx: number) {
    const flow = this.componentFlows.find(f => f.component.name === componentName);
    if (!flow) return;
    clearOverlay(this.overlaySvg);
    const instance = flow.instances[instanceIdx];
    if (!instance) return;
    instance.root.scrollIntoView({ behavior: 'instant', block: 'center' });
    requestAnimationFrame(() => {
      this.overlaySvg.appendChild(drawHighlight(instance.root, '#388E3C', flow.component.name));
      drawTabOrderOverlay(this.overlaySvg, instance.focusable);
    });
  }

  // ── Analysis methods ──────────────────────────────────────────────────

  async runAutomatedAxe() {
    this.dismissPicker();
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.send({ type: 'LOADING', label: 'Running automated tests…' });
    await new Promise(r => requestAnimationFrame(r));

    this.components = detectComponents();
    this.violations = await runAxe();
    this.dedupedIssues = deduplicateViolations(this.violations, this.components);
    this.regions = mapViolationsToRegions(this.violations);

    this.send({
      type: 'AXE_RESULTS',
      violations: serializeResult(this.violations),
      components: serializeResult([...this.components.entries()]),
      dedupedIssues: serializeResult(this.dedupedIssues),
      regions: serializeResult(this.regions),
    });
  }

  async runAutoKeyboard() {
    this.stopManualKeyboard();
    this.tabWalkCancelled = false;
    clearOverlay(this.overlaySvg);
    // Use the current scope if the user explicitly set one, otherwise walk the
    // full page. Scope is always cleared when Back is pressed (CLEAR_SCOPE),
    // so a leftover alt-text or axe scope can no longer bleed through here.
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise(r => requestAnimationFrame(r));
    await this.animatedTabWalk(this.scopeElement ?? undefined);
  }

  /**
   * Animated tab walk — visits each focusable element in DOM tab order,
   * draws numbered badges incrementally with a brief delay between steps,
   * scrolls the page to follow focus, and sends TAB_WALK_STEP messages.
   *
   * After the walk completes it runs the static keyboard analysis and reports
   * TAB_WALK_COMPLETE with full issues, component flows, and any missed elements.
   *
   * Phase 7B: "missed focus" detection — an element is "missed" when el.focus()
   * was called but document.activeElement !== el immediately after (e.g., the
   * element is display:none at runtime even though getTabOrder() included it, or
   * it is disabled, or a focus-trap intercepted focus).  These are reported as
   * SerializedTrailEntry[] in TAB_WALK_COMPLETE.missedElements so the panel can
   * show them as an experimental finding.
   */
  /**
   * @param walkScope  Pass `undefined` to walk the full page regardless of `this.scope`.
   *                   Callers can pass `this.scope` if they explicitly want a scoped walk.
   */
  private async animatedTabWalk(walkScope: Element | undefined, stepDelayMs = 300) {
    const effectiveScope = walkScope;   // undefined = full page
    const tabOrder = getTabOrder(effectiveScope);
    const total = tabOrder.length;

    this.send({ type: 'TAB_WALK_START', total });

    // If there are no focusable elements, resolve immediately.
    if (total === 0) {
      this.send({ type: 'TAB_WALK_COMPLETE', issues: [], flows: [], missedElements: [] });
      return;
    }

    const missedElements: SerializedTrailEntry[] = [];
    let prevCenter: { x: number; y: number } | null = null;

    for (let i = 0; i < total; i++) {
      if (this.tabWalkCancelled) break;

      const el = tabOrder[i];

      // Scroll the element into view on the host page
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(r => requestAnimationFrame(r));

      // Programmatically focus and check whether focus was actually received
      (el as HTMLElement).focus?.({ preventScroll: true });
      const focusReceived = document.activeElement === el;

      // Draw the badge and connecting arrow
      const center = drawTabStopBadge(this.overlaySvg, el, i + 1);
      if (prevCenter) drawTabStopArrow(this.overlaySvg, prevCenter, center);
      prevCenter = center;

      // Build step entry
      const ser = serializeElement(el);
      const stepEntry: SerializedTrailEntry = {
        index: i + 1,
        tag: el.tagName.toLowerCase(),
        label: ser.snippet,
        selector: ser.selector,
        snippet: ser.snippet,
      };

      if (!focusReceived) {
        missedElements.push(stepEntry);
      }

      this.send({ type: 'TAB_WALK_STEP', index: i + 1, total, element: stepEntry, focusReceived });

      // Delay between steps so the user can see the walk in progress
      await new Promise<void>(resolve => setTimeout(resolve, stepDelayMs));
    }

    if (this.tabWalkCancelled) {
      // Walk was cancelled — still resolve the popup so it doesn't stay stuck.
      // Skip the heavy static analysis and just report partial results.
      (document.activeElement as HTMLElement | null)?.blur?.();
      this.send({ type: 'TAB_WALK_COMPLETE', issues: [], flows: [], missedElements });
      return;
    }

    // Blur any focused element so we don't leave the host page in a focused state
    (document.activeElement as HTMLElement | null)?.blur?.();

    // Run static analysis — wrapped in try/catch so a failure never leaves the
    // popup stuck in the "Animated Tab Walk" loading state.
    try {
      this.components = detectComponents();
      this.keyboardIssues = analyzeKeyboardFlow(effectiveScope);
      this.componentFlows = analyzeComponentTabFlows(this.components, tabOrder, this.keyboardIssues);
    } catch (err) {
      console.error('[Prism] Tab walk post-analysis error:', err);
      this.keyboardIssues = [];
      this.componentFlows = [];
    }

    this.send({
      type: 'TAB_WALK_COMPLETE',
      issues: serializeResult(this.keyboardIssues),
      flows: serializeResult(this.componentFlows),
      missedElements,
    });
  }

  startManualKeyboard() {
    clearOverlay(this.overlaySvg);
    this.stopManualKeyboard();
    this.manualTrail = [];
    // Yield focus to host page so user can tab through it
    (document.activeElement as HTMLElement | null)?.blur?.();

    this.manualFocusListener = (e: FocusEvent) => {
      const target = e.target as Element;
      if (!target || target.closest('#a11y-analyzer-panel')) return;
      this.manualTrail.push(target);
      clearOverlay(this.overlaySvg);
      drawTabOrderOverlay(this.overlaySvg, this.manualTrail);
      const serializedTrail = this.buildSerializedTrail();
      this.send({ type: 'TRAIL_UPDATE', trail: serializedTrail });
    };

    document.addEventListener('focusin', this.manualFocusListener);

    // Pressing Esc on the host page stops recording and returns focus to the popup.
    this.manualEscListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.stopManualKeyboard();
      }
    };
    document.addEventListener('keydown', this.manualEscListener, { capture: true });
  }

  private resetManualTrail() {
    this.manualTrail = [];
    clearOverlay(this.overlaySvg);
    this.send({ type: 'TRAIL_UPDATE', trail: [] });
  }

  private stopManualKeyboard() {
    if (this.manualEscListener) {
      document.removeEventListener('keydown', this.manualEscListener, { capture: true });
      this.manualEscListener = undefined;
    }
    if (this.manualFocusListener) {
      document.removeEventListener('focusin', this.manualFocusListener);
      // Finalize trail
      this.send({ type: 'TRAIL_COMPLETE', trail: this.buildSerializedTrail() });
      this.manualFocusListener = undefined;
    }
  }

  private buildSerializedTrail(): SerializedTrailEntry[] {
    return this.manualTrail.map((el, index) => {
      const ser = serializeElement(el);
      const label = el.getAttribute('aria-label')
        || el.getAttribute('title')
        || el.textContent?.trim().slice(0, 40)
        || el.tagName.toLowerCase();
      return { index, tag: el.tagName.toLowerCase(), label, selector: ser.selector, snippet: ser.snippet };
    });
  }

  runHeadingAnalysis() {
    clearOverlay(this.overlaySvg);
    const result = analyzeHeadings(this.scope);
    drawHeadingMarkers(this.overlaySvg, result.headings);
    this.send({ type: 'HEADING_RESULTS', result: serializeResult(result) });
  }

  runLandmarkAnalysis() {
    clearOverlay(this.overlaySvg);
    const result = analyzeLandmarks(this.scope);
    drawLandmarkMarkers(this.overlaySvg, result.landmarks);
    this.send({ type: 'LANDMARK_RESULTS', result: serializeResult(result) });
  }

  runContrastAnalysis() {
    clearOverlay(this.overlaySvg);
    const issues = analyzeContrast(this.scope);
    this.send({ type: 'CONTRAST_RESULTS', issues: serializeResult(issues) });
  }

  runFocusManagement() {
    clearOverlay(this.overlaySvg);
    const issues = analyzeFocusManagement(this.scope);
    this.send({ type: 'FOCUS_MGMT_RESULTS', issues: serializeResult(issues) });
  }

  runLiveRegionAnalysis() {
    clearOverlay(this.overlaySvg);
    const result = analyzeLiveRegions(this.scope);
    this.send({ type: 'LIVE_REGION_RESULTS', result: serializeResult(result) });
  }

  runTouchTargetAnalysis() {
    clearOverlay(this.overlaySvg);
    const issues = analyzeTouchTargets(this.scope);
    this.send({ type: 'TOUCH_TARGET_RESULTS', issues: serializeResult(issues) });
  }

  runAltTextAudit() {
    clearOverlay(this.overlaySvg);
    const issues = analyzeAltText(this.scope);
    this.send({ type: 'ALT_TEXT_RESULTS', issues: serializeResult(issues) });
  }

  runAccNameInspector() {
    clearOverlay(this.overlaySvg);
    const result = analyzeAccessibleNames(this.scope);
    this.send({ type: 'ACC_NAME_RESULTS', result: serializeResult(result) });
  }

  runAriaValidation() {
    clearOverlay(this.overlaySvg);
    const result = validateAria(this.scope);
    this.send({ type: 'ARIA_RESULTS', result: serializeResult(result) });
  }

  runFormLabelsAudit() {
    clearOverlay(this.overlaySvg);
    const result = analyzeFormLabels(this.scope);
    this.send({ type: 'FORM_LABELS_RESULTS', result: serializeResult(result) });
  }

  runSrWalkthrough() {
    clearOverlay(this.overlaySvg);
    const result = analyzeForSrWalkthrough(this.scope);
    this.send({ type: 'SR_WALKTHROUGH_RESULTS', entries: serializeResult(result.entries) });
  }

  runReadingOrder() {
    clearOverlay(this.overlaySvg);
    const result = analyzeAccessibleNames(this.scope);
    drawReadingOrderMarkers(this.overlaySvg, result.entries);
    this.send({ type: 'READING_ORDER_RESULTS', entries: serializeResult(result.entries) });
  }

  async runScorecard() {
    this.dismissPicker();
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.send({ type: 'LOADING', label: 'Running full scorecard…' });
    await new Promise(r => requestAnimationFrame(r));
    const result = await runFullScorecard();
    this.latestScorecard = result;
    this.send({ type: 'SCORECARD_RESULTS', result: serializeResult(result) });
  }

  // ── Scope / picker ─────────────────────────────────────────────────────

  private startScopePicker() {
    clearOverlay(this.overlaySvg);
    this.send({ type: 'SCOPE_PICK_STARTED' });

    this.cancelPicker = startElementPicker(
      (el: Element) => {
        this.cancelPicker = undefined;
        this.scopeElement = el;
        const label = getElementDescription(el);
        this.overlaySvg.appendChild(drawHighlight(el, '#2563EB', 'Scope'));
        this.send({ type: 'SCOPE_SET', label });
      },
      () => {
        this.cancelPicker = undefined;
        this.send({ type: 'SCOPE_SET', label: '' });
      }
    );
  }

  private setScopeFromSelector(selector: string): boolean {
    try {
      const el = document.querySelector(selector);
      if (!el) { this.send({ type: 'SCOPE_SET_FROM_SELECTOR_FAILED' }); return false; }
      this.scopeElement = el;
      clearOverlay(this.overlaySvg);
      const label = getElementDescription(el);
      this.overlaySvg.appendChild(drawHighlight(el, '#2563EB', 'Scope'));
      this.send({ type: 'SCOPE_SET', label });
      return true;
    } catch {
      this.send({ type: 'SCOPE_SET_FROM_SELECTOR_FAILED' });
      return false;
    }
  }

  private startPartialScan() {
    clearOverlay(this.overlaySvg);
    this.send({ type: 'SCOPE_PICK_STARTED' });

    this.cancelPicker = startElementPicker(
      (el: Element) => {
        this.cancelPicker = undefined;
        this.scopeElement = el;
        const label = getElementDescription(el);
        this.overlaySvg.appendChild(drawHighlight(el, '#2563EB', 'Scan scope'));
        this.send({ type: 'SCOPE_SET', label });
        this.runScopedAxe(el);
      },
      () => {
        this.cancelPicker = undefined;
        this.scopeElement = null;
        this.send({ type: 'SCOPE_SET', label: '' });
      }
    );
  }

  private async runScopedAxe(root: Element) {
    this.stopManualKeyboard();
    this.send({ type: 'LOADING', label: 'Scanning selected region…' });
    await new Promise(r => requestAnimationFrame(r));

    this.components = detectComponents();
    this.violations = await runAxe(root);
    this.dedupedIssues = deduplicateViolations(this.violations, this.components);
    this.regions = mapViolationsToRegions(this.violations);

    this.send({
      type: 'AXE_RESULTS',
      violations: serializeResult(this.violations),
      components: serializeResult([...this.components.entries()]),
      dedupedIssues: serializeResult(this.dedupedIssues),
      regions: serializeResult(this.regions),
    });
  }

  // ── Export ─────────────────────────────────────────────────────────────

  private exportReport() {
    const html = generateHtmlReport(this.violations, this.components, this.dedupedIssues, this.keyboardIssues);
    this.downloadBlob(html, `accessibility-prism-report-${Date.now()}.html`);
  }

  private exportScorecard() {
    if (!this.latestScorecard) return;
    const html = generateScorecardHtml(this.latestScorecard);
    this.downloadBlob(html, `accessibility-prism-scorecard-${Date.now()}.html`);
  }

  private downloadBlob(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private dismissPicker() {
    if (this.cancelPicker) { this.cancelPicker(); this.cancelPicker = undefined; }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Initialisation
// ────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  const standalone = (window as any).__A11Y_STANDALONE__;

  if (standalone) {
    // Standalone test fixture mode — let panel-ui.ts wire everything directly
    // Export the class so panel-ui.ts can instantiate it without message passing
    (window as any).A11yContent = A11yContent;
  } else {
    // Popup window mode — guard against double injection
    if (!(window as any).__a11y_content_instance) {
      (window as any).__a11y_content_instance = new A11yContent();
    }
  }
}

export { A11yContent };
