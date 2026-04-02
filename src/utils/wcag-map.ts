const WCAG_SC_NAMES: Record<string, string> = {
  '1.1.1': 'Non-text Content',
  '1.2.1': 'Audio-only and Video-only',
  '1.2.2': 'Captions',
  '1.2.3': 'Audio Description or Media Alternative',
  '1.2.4': 'Captions (Live)',
  '1.2.5': 'Audio Description',
  '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence',
  '1.3.3': 'Sensory Characteristics',
  '1.3.4': 'Orientation',
  '1.3.5': 'Identify Input Purpose',
  '1.4.1': 'Use of Color',
  '1.4.2': 'Audio Control',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.4': 'Resize Text',
  '1.4.5': 'Images of Text',
  '1.4.6': 'Contrast (Enhanced)',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text Contrast',
  '1.4.12': 'Text Spacing',
  '1.4.13': 'Content on Hover or Focus',
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.1.4': 'Character Key Shortcuts',
  '2.2.1': 'Timing Adjustable',
  '2.2.2': 'Pause, Stop, Hide',
  '2.3.1': 'Three Flashes or Below',
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.3': 'Focus Order',
  '2.4.4': 'Link Purpose (In Context)',
  '2.4.5': 'Multiple Ways',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  '2.4.11': 'Focus Not Obscured (Minimum)',
  '2.5.1': 'Pointer Gestures',
  '2.5.2': 'Pointer Cancellation',
  '2.5.3': 'Label in Name',
  '2.5.4': 'Motion Actuation',
  '2.5.5': 'Target Size (Enhanced)',
  '2.5.8': 'Target Size (Minimum)',
  '3.1.1': 'Language of Page',
  '3.1.2': 'Language of Parts',
  '3.2.1': 'On Focus',
  '3.2.2': 'On Input',
  '3.2.6': 'Consistent Help',
  '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions',
  '3.3.3': 'Error Suggestion',
  '3.3.4': 'Error Prevention',
  '3.3.7': 'Redundant Entry',
  '3.3.8': 'Accessible Authentication',
  '4.1.1': 'Parsing',
  '4.1.2': 'Name, Role, Value',
  '4.1.3': 'Status Messages',
};

export interface WcagInfo {
  level: 'A' | 'AA' | 'AAA';
  levelColor: string;
  scNumber: string;
  scName: string;
  fullLabel: string;
}

/**
 * Parse axe-core tags array into structured WCAG info.
 * Tags look like: ["wcag2a", "wcag111", "best-practice", "cat.forms"]
 * - "wcag2a" / "wcag2aa" / "wcag2aaa" / "wcag21a" etc. indicate the level
 * - "wcag111" indicates SC 1.1.1, "wcag253" indicates SC 2.5.3
 */
export function parseWcagInfo(tags: string[]): WcagInfo {
  if (!tags || tags.length === 0) {
    return { level: 'A', levelColor: '#E03E79', scNumber: '', scName: '', fullLabel: '' };
  }

  const joined = tags.join(',').toLowerCase();

  let level: 'A' | 'AA' | 'AAA' = 'A';
  let levelColor = '#E03E79';
  if (joined.includes('wcag2aaa') || joined.includes('wcag21aaa') || joined.includes('wcag22aaa')) {
    level = 'AAA';
    levelColor = '#0288D1';
  } else if (joined.includes('wcag2aa') || joined.includes('wcag21aa') || joined.includes('wcag22aa')) {
    level = 'AA';
    levelColor = '#62529D';
  }

  let scNumber = '';
  let scName = '';
  const scTag = tags.find(t => /^wcag\d{3,4}$/i.test(t));
  if (scTag) {
    const digits = scTag.replace(/^wcag/i, '');
    if (digits.length === 3) {
      scNumber = `${digits[0]}.${digits[1]}.${digits[2]}`;
    } else if (digits.length === 4) {
      scNumber = `${digits[0]}.${digits[1]}.${digits.substring(2)}`;
    }
    scName = WCAG_SC_NAMES[scNumber] || '';
  }

  const fullLabel = scNumber
    ? (scName ? `${scNumber} ${scName}` : scNumber)
    : '';

  return { level, levelColor, scNumber, scName, fullLabel };
}

/**
 * Extract contextual text from a DOM element for occurrence display.
 * Shows meaningful content instead of raw HTML.
 */
export function getElementContext(el: Element | null): string {
  if (!el) return 'Element not found';

  const tag = el.tagName.toLowerCase();

  if (tag === 'img') {
    const alt = el.getAttribute('alt');
    if (alt) return `Image: "${alt}"`;
    return 'Image without alt text';
  }

  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    const label = el.getAttribute('aria-label')
      || el.getAttribute('placeholder')
      || el.getAttribute('name');
    if (label) return `${tag}: "${label}"`;
    const id = el.getAttribute('id');
    if (id) {
      const labelEl = document.querySelector(`label[for="${id}"]`);
      if (labelEl?.textContent) return `${tag}: "${labelEl.textContent.trim().substring(0, 60)}"`;
    }
    return `${tag} without label`;
  }

  if (tag === 'a') {
    const text = el.textContent?.trim().substring(0, 60);
    if (text) return `Link: "${text}"`;
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return `Link: "${ariaLabel}"`;
    return 'Link without text';
  }

  if (tag === 'button' || el.getAttribute('role') === 'button') {
    const text = el.textContent?.trim().substring(0, 60);
    if (text) return `Button: "${text}"`;
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return `Button: "${ariaLabel}"`;
    return 'Button without label';
  }

  const textContent = el.textContent?.trim();
  if (textContent && textContent.length > 0) {
    return `"${textContent.substring(0, 80)}${textContent.length > 80 ? '...' : ''}"`;
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.substring(0, 60);

  return `<${tag}> element`;
}
