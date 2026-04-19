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
import { FloatingPanel } from './ui/panel';
import { initializeOverlay, drawHighlight, drawTabOrderOverlay, drawHeadingMarkers, drawLandmarkMarkers, drawReadingOrderMarkers, clearOverlay } from './ui/overlay';
import { generateHtmlReport } from './utils/html-report';
import { createActivationButton } from './ui/activation-button';
import { startElementPicker, getElementDescription } from './ui/element-picker';
import { runFullScorecard, type ScorecardResult } from './core/scorecard';
import { generateScorecardHtml } from './utils/scorecard-report';

class A11yAnalyzer {
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
      onStartManualKeyboard: () => this.startManualKeyboard(),
      onStopManualKeyboard: () => this.stopManualKeyboard(),
      onResetManualTrail: () => this.resetManualTrail(),
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
    createActivationButton(() => {
      (window as any).A11yAnalyzerInit();
    });
  }

  public handleViolationClick(nodes: Element[]) {
    clearOverlay(this.overlaySvg);
    if (nodes.length === 0) {
      this.stopManualKeyboard();
      return;
    }
    nodes[0].scrollIntoView({ behavior: 'instant', block: 'center' });
    requestAnimationFrame(() => {
      nodes.forEach(node => {
        this.overlaySvg.appendChild(drawHighlight(node, '#E03E79', 'Issue Focus'));
      });
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
    if (this.cancelPicker) {
      this.cancelPicker();
      this.cancelPicker = undefined;
    }
  }

  public async runAutomatedAxe() {
    this.dismissPicker();
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.panel.showLoading('Running automated tests…');
    await new Promise(r => requestAnimationFrame(r));

    console.log('[A11yAnalyzer] Detecting components...');
    this.components = detectComponents();

    console.log('[A11yAnalyzer] Running axe-core...');
    this.violations = await runAxe();

    console.log('[A11yAnalyzer] Deduplicating violations mapped to components...');
    this.dedupedIssues = deduplicateViolations(this.violations, this.components);

    console.log('[A11yAnalyzer] Mapping violations to page regions...');
    this.regions = mapViolationsToRegions(this.violations);

    console.log(`[A11yAnalyzer] Found ${this.violations.length} rules, ${this.components.size} components, ${this.regions.length} regions`);
    this.panel.updateAxeResults(this.violations, this.components, this.dedupedIssues, this.regions);
  }

  public async runAutoKeyboard() {
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.panel.showLoading('Analyzing keyboard accessibility…');
    await new Promise(r => requestAnimationFrame(r));

    console.log('[A11yAnalyzer] Detecting components...');
    this.components = detectComponents();

    console.log('[A11yAnalyzer] Analyzing keyboard flows...');
    this.keyboardIssues = analyzeKeyboardFlow();

    console.log('[A11yAnalyzer] Computing tab order...');
    const tabOrder = getTabOrder();

    console.log('[A11yAnalyzer] Analyzing component tab flows...');
    this.componentFlows = analyzeComponentTabFlows(this.components, tabOrder, this.keyboardIssues);

    drawTabOrderOverlay(this.overlaySvg, tabOrder);

    console.log(`[A11yAnalyzer] Found ${this.keyboardIssues.length} keyboard issues, ${this.componentFlows.length} component flows`);
    this.panel.updateKeyboardResults(this.keyboardIssues, this.componentFlows);
  }

  public startManualKeyboard() {
    clearOverlay(this.overlaySvg);
    this.stopManualKeyboard();
    this.manualTrail = [];

    this.manualFocusListener = (e: FocusEvent) => {
      const target = e.target as Element;
      if (!target) return;
      if (target.closest('#a11y-analyzer-panel')) return;

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

  // === New analysis methods ===

  public runHeadingAnalysis() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Analyzing heading structure...');
    const result = analyzeHeadings();
    console.log(`[A11yAnalyzer] Found ${result.headings.length} headings, ${result.issues.length} issues`);
    drawHeadingMarkers(this.overlaySvg, result.headings);
    this.panel.updateHeadingResults(result);
  }

  public runLandmarkAnalysis() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Analyzing landmarks...');
    const result = analyzeLandmarks();
    console.log(`[A11yAnalyzer] Found ${result.landmarks.length} landmarks, ${result.issues.length} issues`);
    drawLandmarkMarkers(this.overlaySvg, result.landmarks);
    this.panel.updateLandmarkResults(result);
  }

  public runContrastAnalysis() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Analyzing color contrast...');
    const issues = analyzeContrast();
    console.log(`[A11yAnalyzer] Found ${issues.length} contrast issues`);
    this.panel.updateContrastResults(issues);
  }

  public runFocusManagement() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Analyzing focus management...');
    const issues = analyzeFocusManagement();
    console.log(`[A11yAnalyzer] Found ${issues.length} focus management issues`);
    this.panel.updateFocusMgmtResults(issues);
  }

  public runLiveRegionAnalysis() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Scanning live regions...');
    const result = analyzeLiveRegions();
    console.log(`[A11yAnalyzer] Found ${result.regions.length} live regions, ${result.issues.length} issues`);
    this.panel.updateLiveRegionResults(result);
  }

  public runTouchTargetAnalysis() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Measuring touch targets...');
    const issues = analyzeTouchTargets();
    console.log(`[A11yAnalyzer] Found ${issues.length} undersized touch targets`);
    this.panel.updateTouchTargetResults(issues);
  }

  public runAltTextAudit() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Auditing alt text...');
    const issues = analyzeAltText();
    console.log(`[A11yAnalyzer] Found ${issues.length} alt text issues`);
    this.panel.updateAltTextResults(issues);
  }

  public runAccNameInspector() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Computing accessible names...');
    const result = analyzeAccessibleNames();
    console.log(`[A11yAnalyzer] Found ${result.entries.length} elements, ${result.issueCount} missing names, ${result.warningCount} warnings`);
    this.panel.updateAccNameResults(result);
  }

  public runAriaValidation() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Validating ARIA usage...');
    const result = validateAria();
    console.log(`[A11yAnalyzer] Found ${result.issues.length} ARIA issues (${result.errorCount} errors, ${result.warningCount} warnings)`);
    this.panel.updateAriaResults(result);
  }

  public runFormLabelsAudit() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Auditing form labels...');
    const result = analyzeFormLabels();
    console.log(`[A11yAnalyzer] Found ${result.totalControls} controls, ${result.issues.length} issues`);
    this.panel.updateFormLabelsResults(result);
  }

  public runSrWalkthrough() {
    clearOverlay(this.overlaySvg);
    // SR walk-through uses the W3C AccName spec (via dom-accessibility-api) to compute
    // accessible names, descriptions, roles, and announcements directly from the DOM.
    // This is the same algorithm browsers/screen readers use to derive their accessible
    // tree from the DOM. The chrome.automation API was attempted but is restricted to
    // whitelisted extensions only, so DOM-based AccName is the production path.
    const result = analyzeForSrWalkthrough();
    console.log(`[A11yAnalyzer] SR walk-through ready: ${result.entries.length} elements`);
    this.panel.startWalkthrough(result.entries);
  }

  public runReadingOrder() {
    clearOverlay(this.overlaySvg);
    console.log('[A11yAnalyzer] Computing reading order...');
    const result = analyzeAccessibleNames();
    drawReadingOrderMarkers(this.overlaySvg, result.entries);
    console.log(`[A11yAnalyzer] Reading order: ${result.entries.length} elements marked`);
    this.panel.showReadingOrder(result.entries);
  }

  public startPartialScan() {
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
      () => {
        this.cancelPicker = undefined;
        this.panel.clearScope();
        this.panel.show();
      }
    );
  }

  public async runScopedAxe(root: Element) {
    this.stopManualKeyboard();
    this.panel.showLoading('Scanning selected region…');
    await new Promise(r => requestAnimationFrame(r));

    console.log('[A11yAnalyzer] Running scoped axe-core on:', root);
    this.components = detectComponents();
    this.violations = await runAxe(root);
    this.dedupedIssues = deduplicateViolations(this.violations, this.components);
    this.regions = mapViolationsToRegions(this.violations);

    console.log(`[A11yAnalyzer] Scoped scan: ${this.violations.length} rules, ${this.violations.reduce((s, v) => s + v.nodes.length, 0)} nodes`);
    this.panel.updateAxeResults(this.violations, this.components, this.dedupedIssues, this.regions);
  }

  public async runScorecard() {
    this.dismissPicker();
    this.stopManualKeyboard();
    clearOverlay(this.overlaySvg);
    this.panel.showLoading('Running full scorecard…');
    await new Promise(r => requestAnimationFrame(r));
    console.log('[A11yAnalyzer] Running full scorecard...');
    const result = await runFullScorecard();
    this.latestScorecard = result;
    console.log(`[A11yAnalyzer] Scorecard complete: ${result.overallScore}/100 (${result.overallGrade})`);
    this.panel.updateScorecardResults(result);
  }

  public exportScorecard() {
    if (!this.latestScorecard) return;
    const html = generateScorecardHtml(this.latestScorecard);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-prism-scorecard-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public exportReport() {
    const html = generateHtmlReport(
      this.violations,
      this.components,
      this.dedupedIssues,
      this.keyboardIssues
    );

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-prism-report-${new Date().getTime()}.html`;
    a.click();

    URL.revokeObjectURL(url);
  }
}

if (typeof window !== 'undefined') {
  (window as any).A11yAnalyzerInit = () => {
    if ((window as any).__a11y_analyzer_instance) {
      console.warn('A11yAnalyzer already initialized');
      return;
    }
    (window as any).__a11y_analyzer_instance = new A11yAnalyzer();
  };

  createActivationButton(() => {
    (window as any).A11yAnalyzerInit();
  });
}
