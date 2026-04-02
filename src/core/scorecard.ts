import { runAxe } from './axe-runner';
import { analyzeHeadings } from './heading-analysis';
import { analyzeLandmarks } from './landmark-analysis';
import { analyzeContrast } from './contrast-analysis';
import { analyzeKeyboardFlow } from './keyboard-analysis';
import { analyzeFocusManagement } from './focus-management';
import { analyzeTouchTargets } from './touch-target-analysis';
import { analyzeAltText } from './alt-text-analysis';
import { analyzeAccessibleNames } from './acc-name-analysis';
import { validateAria } from './aria-validation';
import { analyzeFormLabels } from './form-labels-analysis';
import { analyzeLiveRegions } from './live-region-monitor';

export interface CategoryScore {
  id: string;
  label: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  narrative: string;
  topActions: string[];
  positives: string[];
  stats: Record<string, number>;
}

export interface ScorecardResult {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: CategoryScore[];
  pageUrl: string;
  pageTitle: string;
  timestamp: string;
  summary: string;
}

function toGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#16A34A';
    case 'B': return '#22C55E';
    case 'C': return '#F59E0B';
    case 'D': return '#F97316';
    case 'F': return '#EF4444';
    default: return '#6B7280';
  }
}

function clamp(n: number): number { return Math.max(0, Math.min(100, Math.round(n))); }

function scoreContentNaming(
  accNames: ReturnType<typeof analyzeAccessibleNames>,
  altText: ReturnType<typeof analyzeAltText>,
  formLabels: ReturnType<typeof analyzeFormLabels>
): CategoryScore {
  const totalElements = accNames.entries.length || 1;
  const missingNames = accNames.issueCount;
  const nameWarnings = accNames.warningCount;
  const altErrors = altText.filter(i => i.severity === 'error').length;
  const altWarnings = altText.filter(i => i.severity === 'warning').length;
  const formErrors = formLabels.issues.filter(i => i.severity === 'error').length;
  const formWarnings = formLabels.issues.filter(i => i.severity === 'warning').length;

  const errorPenalty = (missingNames + altErrors + formErrors) * 4;
  const warningPenalty = (nameWarnings + altWarnings + formWarnings) * 1.5;
  const score = clamp(100 - errorPenalty - warningPenalty);
  const grade = toGrade(score);

  const topActions: string[] = [];
  if (missingNames > 0) topActions.push(`Add accessible names to ${missingNames} interactive element${missingNames !== 1 ? 's' : ''} (buttons, links, inputs)`);
  if (altErrors > 0) topActions.push(`Add alt text to ${altErrors} image${altErrors !== 1 ? 's' : ''} missing descriptions`);
  if (formErrors > 0) topActions.push(`Label ${formErrors} form control${formErrors !== 1 ? 's' : ''} that screen readers can't identify`);
  if (formWarnings > 0) topActions.push(`Replace placeholder-only labels on ${formWarnings} field${formWarnings !== 1 ? 's' : ''} with proper <label> elements`);

  const positives: string[] = [];
  const namedPct = totalElements > 0 ? Math.round(((totalElements - missingNames) / totalElements) * 100) : 100;
  if (namedPct >= 95) positives.push(`${namedPct}% of interactive elements have proper accessible names`);
  if (altText.length === 0) positives.push('All images have appropriate alt text');
  if (formLabels.totalControls > 0 && formErrors === 0) positives.push('All form controls are properly labeled');

  let narrative: string;
  if (score >= 90) {
    narrative = `Content on this page is well-identified for assistive technology users. ${namedPct}% of interactive elements have accessible names, meaning screen readers can tell users what each button, link, and form field does.`;
  } else if (score >= 70) {
    narrative = `Most content is identifiable, but ${missingNames + altErrors + formErrors} element${(missingNames + altErrors + formErrors) !== 1 ? 's' : ''} lack proper labels. Screen reader users would encounter unnamed buttons or images, making ${Math.round(((missingNames + altErrors + formErrors) / totalElements) * 100)}% of interactions unclear.`;
  } else if (score >= 50) {
    narrative = `Screen reader users would struggle to identify a significant portion of this page. ${missingNames} element${missingNames !== 1 ? 's' : ''} have no accessible name — these get announced as "unlabeled" or skipped entirely.`;
  } else {
    narrative = `This page has serious content labeling gaps. ${missingNames} interactive elements are invisible to screen readers, and ${altErrors + formErrors} images and form fields lack descriptions. A blind user would be unable to complete most tasks.`;
  }

  return {
    id: 'content-naming', label: 'Content & Naming', score, grade, color: gradeColor(grade),
    narrative, topActions: topActions.slice(0, 3), positives,
    stats: { missingNames, altErrors, formErrors, totalElements },
  };
}

function scoreStructureNav(
  headings: ReturnType<typeof analyzeHeadings>,
  landmarks: ReturnType<typeof analyzeLandmarks>
): CategoryScore {
  const headingIssues = headings.issues.length;
  const headingErrors = headings.issues.filter(i => i.severity === 'error').length;
  const landmarkIssues = landmarks.issues.length;
  const landmarkErrors = landmarks.issues.filter(i => i.severity === 'error').length;
  const hasH1 = headings.headings.some(h => h.level === 1);
  const hasMain = landmarks.landmarks.some(l => l.role === 'main');
  const hasNav = landmarks.landmarks.some(l => l.role === 'navigation');

  const errorPenalty = (headingErrors + landmarkErrors) * 8;
  const warningPenalty = ((headingIssues - headingErrors) + (landmarkIssues - landmarkErrors)) * 3;
  const bonusPenalty = (!hasH1 ? 10 : 0) + (!hasMain ? 10 : 0) + (!hasNav ? 5 : 0);
  const score = clamp(100 - errorPenalty - warningPenalty - bonusPenalty);
  const grade = toGrade(score);

  const topActions: string[] = [];
  if (!hasH1) topActions.push('Add a main H1 heading — screen readers use it to identify the page topic');
  if (!hasMain) topActions.push('Add a <main> landmark so users can jump directly to primary content');
  if (!hasNav) topActions.push('Wrap navigation in <nav> so screen readers can find the menu');
  if (headingErrors > 0) topActions.push(`Fix ${headingErrors} heading hierarchy issue${headingErrors !== 1 ? 's' : ''} (skipped levels confuse navigation)`);

  const positives: string[] = [];
  if (hasH1) positives.push('Page has a clear H1 heading identifying the topic');
  if (hasMain && hasNav) positives.push('Main content and navigation landmarks are properly marked');
  if (headingIssues === 0) positives.push('Heading hierarchy is clean — no skipped levels');
  if (landmarks.landmarks.length >= 3) positives.push(`${landmarks.landmarks.length} landmarks provide clear page structure`);

  let narrative: string;
  if (score >= 90) {
    narrative = `The page has excellent structure. Screen reader users can navigate efficiently using ${headings.headings.length} headings and ${landmarks.landmarks.length} landmarks to jump between sections.`;
  } else if (score >= 70) {
    narrative = `Page structure is mostly good, but has some gaps. ${headingIssues > 0 ? `Heading hierarchy has ${headingIssues} issue${headingIssues !== 1 ? 's' : ''} that can confuse navigation.` : ''} ${!hasMain ? 'Missing a <main> landmark means users can\'t skip to primary content.' : ''}`;
  } else {
    narrative = `Screen reader users would have difficulty navigating this page. ${!hasH1 ? 'There\'s no H1 heading to identify the page. ' : ''}${!hasMain ? 'No main content landmark exists. ' : ''}Users rely on these structural elements to orient themselves — without them, they must read the entire page linearly.`;
  }

  return {
    id: 'structure-nav', label: 'Structure & Navigation', score, grade, color: gradeColor(grade),
    narrative, topActions: topActions.slice(0, 3), positives,
    stats: { headingCount: headings.headings.length, landmarkCount: landmarks.landmarks.length, headingIssues, landmarkIssues },
  };
}

function scoreKeyboardInteraction(
  kbIssues: ReturnType<typeof analyzeKeyboardFlow>,
  focusIssues: ReturnType<typeof analyzeFocusManagement>,
  touchIssues: ReturnType<typeof analyzeTouchTargets>
): CategoryScore {
  const kbErrors = kbIssues.filter(i => i.severity === 'error').length;
  const kbWarnings = kbIssues.filter(i => i.severity === 'warning').length;
  const focusErrors = focusIssues.filter(i => i.severity === 'error').length;
  const touchErrors = touchIssues.filter(i => i.severity === 'error').length;
  const touchWarnings = touchIssues.filter(i => i.severity === 'warning').length;

  const errorPenalty = (kbErrors + focusErrors + touchErrors) * 3;
  const warningPenalty = (kbWarnings + touchWarnings) * 1;
  const score = clamp(100 - errorPenalty - warningPenalty);
  const grade = toGrade(score);

  const topActions: string[] = [];
  if (kbErrors > 0) topActions.push(`Fix ${kbErrors} keyboard-inaccessible element${kbErrors !== 1 ? 's' : ''} — users can't reach them without a mouse`);
  if (focusErrors > 0) topActions.push(`Fix focus management in ${focusErrors} dialog${focusErrors !== 1 ? 's' : ''}/modal${focusErrors !== 1 ? 's' : ''}`);
  if (touchErrors > 0) topActions.push(`Increase size of ${touchErrors} touch target${touchErrors !== 1 ? 's' : ''} below minimum (24×24px)`);
  if (kbWarnings > 0) topActions.push(`Review ${kbWarnings} keyboard warning${kbWarnings !== 1 ? 's' : ''} (tab order, focus indicators)`);

  const positives: string[] = [];
  if (kbErrors === 0 && kbWarnings === 0) positives.push('All interactive elements are keyboard accessible');
  if (focusErrors === 0) positives.push('Focus management is properly implemented');
  if (touchErrors === 0 && touchWarnings === 0) positives.push('All touch targets meet minimum size requirements');

  let narrative: string;
  if (score >= 90) {
    narrative = `Keyboard and touch interaction is solid. Users who can't use a mouse can reach and operate all interactive elements on this page.`;
  } else if (score >= 70) {
    narrative = `Most interactions work without a mouse, but ${kbErrors + focusErrors} element${(kbErrors + focusErrors) !== 1 ? 's' : ''} have keyboard issues. Users relying on keyboard navigation would encounter some dead ends.`;
  } else {
    narrative = `Keyboard users would face significant barriers. ${kbErrors} interactive element${kbErrors !== 1 ? 's' : ''} can't be reached by keyboard at all, effectively blocking users who can't use a mouse or touchscreen.`;
  }

  return {
    id: 'keyboard-interaction', label: 'Keyboard & Interaction', score, grade, color: gradeColor(grade),
    narrative, topActions: topActions.slice(0, 3), positives,
    stats: { kbErrors, kbWarnings, focusErrors, touchErrors, touchWarnings },
  };
}

function scoreAriaSemantics(
  ariaResult: ReturnType<typeof validateAria>,
  liveRegions: ReturnType<typeof analyzeLiveRegions>
): CategoryScore {
  const ariaErrors = ariaResult.errorCount;
  const ariaWarnings = ariaResult.warningCount;
  const ariaInfo = ariaResult.issues.length - ariaErrors - ariaWarnings;
  const liveIssues = liveRegions.issues.length;

  const errorPenalty = ariaErrors * 5;
  const warningPenalty = (ariaWarnings + liveIssues) * 2;
  const infoPenalty = ariaInfo * 0.5;
  const score = clamp(100 - errorPenalty - warningPenalty - infoPenalty);
  const grade = toGrade(score);

  const brokenRefs = ariaResult.issues.filter(i => i.type === 'broken-reference').length;
  const hiddenFocusable = ariaResult.issues.filter(i => i.type === 'hidden-focusable').length;
  const invalidRoles = ariaResult.issues.filter(i => i.type === 'invalid-role').length;

  const topActions: string[] = [];
  if (brokenRefs > 0) topActions.push(`Fix ${brokenRefs} broken ARIA reference${brokenRefs !== 1 ? 's' : ''} (aria-labelledby/describedby pointing to missing elements)`);
  if (hiddenFocusable > 0) topActions.push(`Resolve ${hiddenFocusable} element${hiddenFocusable !== 1 ? 's' : ''} that are hidden from screen readers but still keyboard-focusable`);
  if (invalidRoles > 0) topActions.push(`Correct ${invalidRoles} invalid ARIA role${invalidRoles !== 1 ? 's' : ''}`);
  if (liveIssues > 0) topActions.push(`Review ${liveIssues} live region issue${liveIssues !== 1 ? 's' : ''} for proper dynamic content announcements`);

  const positives: string[] = [];
  if (ariaErrors === 0) positives.push('No critical ARIA errors — assistive technology integration is correct');
  if (brokenRefs === 0) positives.push('All ARIA references point to valid elements');
  if (liveRegions.regions.length > 0 && liveIssues === 0) positives.push('Live regions are properly configured for dynamic content');

  let narrative: string;
  if (score >= 90) {
    narrative = `ARIA usage is clean and correct. Assistive technologies can properly interpret the page structure, roles, and relationships between elements.`;
  } else if (score >= 70) {
    narrative = `ARIA implementation is mostly correct, but ${ariaErrors} error${ariaErrors !== 1 ? 's' : ''} could cause assistive technology to misinterpret parts of the page. ${brokenRefs > 0 ? `${brokenRefs} ARIA reference${brokenRefs !== 1 ? 's' : ''} point to elements that don't exist.` : ''}`;
  } else {
    narrative = `The technical wiring for assistive technology has significant issues. ${ariaErrors} ARIA errors mean screen readers may announce incorrect information or miss content entirely. This is the foundation — fixing these enables all other accessibility features to work correctly.`;
  }

  return {
    id: 'aria-semantics', label: 'ARIA & Semantics', score, grade, color: gradeColor(grade),
    narrative, topActions: topActions.slice(0, 3), positives,
    stats: { ariaErrors, ariaWarnings, brokenRefs, hiddenFocusable, liveRegionCount: liveRegions.regions.length },
  };
}

function scoreVisualClarity(
  contrastIssues: ReturnType<typeof analyzeContrast>,
  axeViolations: Awaited<ReturnType<typeof runAxe>>
): CategoryScore {
  const contrastErrors = contrastIssues.filter(i => !i.passesAA).length;
  const contrastWarnings = contrastIssues.filter(i => i.passesAA && !i.passesAAA).length;

  const visualAxeRules = ['color-contrast', 'link-in-text-block', 'meta-viewport'];
  const axeVisualErrors = axeViolations.filter(v => visualAxeRules.some(r => v.id.includes(r))).reduce((s, v) => s + v.nodes.length, 0);

  const errorPenalty = (contrastErrors + axeVisualErrors) * 3;
  const warningPenalty = contrastWarnings * 1;
  const score = clamp(100 - errorPenalty - warningPenalty);
  const grade = toGrade(score);

  const topActions: string[] = [];
  if (contrastErrors > 0) topActions.push(`Fix ${contrastErrors} text element${contrastErrors !== 1 ? 's' : ''} with insufficient contrast against their background (WCAG AA)`);
  if (contrastWarnings > 0) topActions.push(`Consider improving contrast on ${contrastWarnings} element${contrastWarnings !== 1 ? 's' : ''} to meet enhanced (AAA) standards`);
  if (axeVisualErrors > 0) topActions.push(`Address ${axeVisualErrors} additional visual accessibility issue${axeVisualErrors !== 1 ? 's' : ''} detected by automated scanning`);

  const positives: string[] = [];
  if (contrastErrors === 0) positives.push('All text meets WCAG AA contrast requirements — readable for low-vision users');
  if (contrastWarnings === 0 && contrastErrors === 0) positives.push('Text contrast meets enhanced AAA standards throughout');

  let narrative: string;
  if (score >= 90) {
    narrative = `Visual accessibility is excellent. Text has sufficient contrast against backgrounds, making content readable for users with low vision or color vision deficiencies.`;
  } else if (score >= 70) {
    narrative = `Most text is readable, but ${contrastErrors} element${contrastErrors !== 1 ? 's' : ''} fail WCAG AA contrast requirements. Users with low vision may struggle to read this content, especially in bright lighting conditions.`;
  } else {
    narrative = `Significant contrast issues affect readability. ${contrastErrors} text element${contrastErrors !== 1 ? 's' : ''} don't meet minimum contrast ratios. For the estimated 1 in 12 men with color vision deficiency, parts of this page may be unreadable.`;
  }

  return {
    id: 'visual-clarity', label: 'Visual Clarity', score, grade, color: gradeColor(grade),
    narrative, topActions: topActions.slice(0, 3), positives,
    stats: { contrastErrors, contrastWarnings, axeVisualErrors },
  };
}

function generateOverallSummary(categories: CategoryScore[], overall: number): string {
  const grade = toGrade(overall);
  const worst = [...categories].sort((a, b) => a.score - b.score)[0];
  const best = [...categories].sort((a, b) => b.score - a.score)[0];
  const totalErrors = categories.reduce((s, c) => s + Object.entries(c.stats).filter(([k]) => k.toLowerCase().includes('error')).reduce((a, [, v]) => a + v, 0), 0);

  if (grade === 'A') {
    return `This page demonstrates strong accessibility practices across all categories. ${best.label} is particularly well-implemented. ${totalErrors > 0 ? `There are ${totalErrors} minor issue${totalErrors !== 1 ? 's' : ''} to address for perfection.` : 'No critical issues were found.'}`;
  } else if (grade === 'B') {
    return `Good overall accessibility, with room for improvement in ${worst.label} (${worst.grade}). The page is usable for most assistive technology users, but ${totalErrors} issue${totalErrors !== 1 ? 's' : ''} should be addressed to ensure no one is blocked.`;
  } else if (grade === 'C') {
    return `This page has a mixed accessibility profile. ${best.label} works well (${best.grade}), but ${worst.label} scores ${worst.grade} and needs attention. Some assistive technology users would encounter barriers completing tasks.`;
  } else if (grade === 'D') {
    return `Accessibility needs significant improvement. ${worst.label} is the most critical area (${worst.grade}). Users relying on screen readers, keyboard navigation, or other assistive technology would face frequent barriers on this page.`;
  } else {
    return `This page has critical accessibility barriers across multiple categories. ${worst.label} (${worst.grade}) and other areas need urgent attention. Many users with disabilities would be unable to use this page effectively. Prioritize the top actions in each category.`;
  }
}

export async function runFullScorecard(): Promise<ScorecardResult> {
  const [axeResults, headings, landmarks, contrast, kbIssues, focusIssues, touchIssues, altText, accNames, ariaResult, formLabels, liveRegions] = await Promise.all([
    runAxe(),
    Promise.resolve(analyzeHeadings()),
    Promise.resolve(analyzeLandmarks()),
    Promise.resolve(analyzeContrast()),
    Promise.resolve(analyzeKeyboardFlow()),
    Promise.resolve(analyzeFocusManagement()),
    Promise.resolve(analyzeTouchTargets()),
    Promise.resolve(analyzeAltText()),
    Promise.resolve(analyzeAccessibleNames()),
    Promise.resolve(validateAria()),
    Promise.resolve(analyzeFormLabels()),
    Promise.resolve(analyzeLiveRegions()),
  ]);

  const categories: CategoryScore[] = [
    scoreContentNaming(accNames, altText, formLabels),
    scoreStructureNav(headings, landmarks),
    scoreKeyboardInteraction(kbIssues, focusIssues, touchIssues),
    scoreAriaSemantics(ariaResult, liveRegions),
    scoreVisualClarity(contrast, axeResults.filter(v => v.resultType === 'violation')),
  ];

  const overallScore = clamp(Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length));
  const overallGrade = toGrade(overallScore);
  const summary = generateOverallSummary(categories, overallScore);

  return {
    overallScore,
    overallGrade,
    categories,
    pageUrl: location.href,
    pageTitle: document.title || 'Untitled Page',
    timestamp: new Date().toISOString(),
    summary,
  };
}
