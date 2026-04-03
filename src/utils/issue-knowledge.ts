import type { KeyboardIssueType } from '../core/types';
import { escHtml } from './escape';

export interface IssueKnowledge {
  wcag: string;
  wcagName: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  userImpact: string;
  fix: string;
  learnMoreUrl: string;
}

/**
 * Centralized knowledge base mapping issue types to WCAG criteria,
 * user impact descriptions, fix suggestions, and external links.
 */
export const KB_KNOWLEDGE: Record<KeyboardIssueType, IssueKnowledge> = {
  'not-focusable': {
    wcag: '2.1.1',
    wcagName: 'Keyboard',
    wcagLevel: 'A',
    userImpact: 'Keyboard-only users cannot reach or activate this interactive element. It is completely invisible to them.',
    fix: 'Use a natively focusable element (<button>, <a href>, <input>) or add tabindex="0" and appropriate keyboard event handlers.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html',
  },
  'positive-tabindex': {
    wcag: '2.4.3',
    wcagName: 'Focus Order',
    wcagLevel: 'A',
    userImpact: 'A positive tabindex forces this element to receive focus before elements that follow the natural DOM order, creating a confusing and unpredictable tab sequence.',
    fix: 'Remove the positive tabindex attribute. Rely on the natural DOM order for a logical tab sequence, or restructure the DOM to achieve the desired order.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
  'missing-skip-link': {
    wcag: '2.4.1',
    wcagName: 'Bypass Blocks',
    wcagLevel: 'A',
    userImpact: 'Keyboard users must tab through every navigation link on every page load to reach the main content. This is tedious and time-consuming.',
    fix: 'Add a visually hidden "Skip to main content" link as the first focusable element on the page, pointing to the main content area.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html',
  },
  'focus-trap-missing': {
    wcag: '2.1.2',
    wcagName: 'No Keyboard Trap',
    wcagLevel: 'A',
    userImpact: 'Keyboard users can enter a modal dialog or widget but cannot escape it, leaving them stuck and unable to use the rest of the page.',
    fix: 'Implement proper focus trapping within modal dialogs — allow Escape to close and Tab/Shift+Tab to cycle within the dialog, then restore focus on close.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html',
  },
  'tab-visual-mismatch': {
    wcag: '2.4.3',
    wcagName: 'Focus Order',
    wcagLevel: 'A',
    userImpact: 'The keyboard tab order does not match the visual layout. Users see one order on screen but experience a different one when tabbing, causing confusion.',
    fix: 'Ensure the DOM order matches the visual order. Avoid CSS tricks that reorder elements visually without changing the source order.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
  'missing-focus-style': {
    wcag: '2.4.7',
    wcagName: 'Focus Visible',
    wcagLevel: 'AA',
    userImpact: 'When this element receives keyboard focus, there is no visible indicator. Keyboard users cannot tell where they are on the page.',
    fix: 'Ensure a visible focus indicator exists. Use :focus-visible or :focus with a clear outline, box-shadow, or border that meets the minimum contrast ratio.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
  },
  'mouse-only-handler': {
    wcag: '2.1.1',
    wcagName: 'Keyboard',
    wcagLevel: 'A',
    userImpact: 'This element responds to mouse clicks but has no keyboard equivalent. Keyboard-only users cannot trigger this action.',
    fix: 'Add a keydown or keypress handler for Enter/Space, or use a natively interactive element (<button>) that handles keyboard events automatically.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html',
  },
  'phantom-focus': {
    wcag: '2.4.3',
    wcagName: 'Focus Order',
    wcagLevel: 'A',
    userImpact: 'This element receives keyboard focus but serves no interactive purpose, wasting the user\'s keystrokes and creating confusion.',
    fix: 'Remove tabindex="0" from non-interactive elements, or make the element interactive if it should be.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
  'redundant-focus': {
    wcag: '2.4.3',
    wcagName: 'Focus Order',
    wcagLevel: 'A',
    userImpact: 'This focusable element is nested inside another clickable element, requiring keyboard users to press Tab twice to pass through what appears to be a single control.',
    fix: 'Remove the inner tabindex or merge the click handlers so only one element in the group is focusable.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
  'focusable-in-aria-hidden': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element is hidden from screen readers via aria-hidden="true" but is still keyboard focusable. Screen reader users will reach it but hear nothing, creating a confusing "ghost" stop.',
    fix: 'Either remove aria-hidden from the parent, or add tabindex="-1" to prevent the element from receiving keyboard focus.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'no-accessible-name': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'Screen reader users will hear this element announced without a label — e.g., just "button" with no description of what it does.',
    fix: 'Add an accessible name via aria-label, aria-labelledby, or visible text content inside the element.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'double-tab-stop': {
    wcag: '2.4.3',
    wcagName: 'Focus Order',
    wcagLevel: 'A',
    userImpact: 'Users must press Tab multiple times to pass through what appears to be one control, slowing navigation and creating frustration.',
    fix: 'Use a single focusable element for each interactive control. Remove extra tabindex attributes or consolidate nested interactive elements.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
};

export const FORM_LABEL_KNOWLEDGE: Record<string, IssueKnowledge> = {
  'missing-label': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'Screen reader users hear "edit text" or "checkbox" without any description. They cannot determine what information this field requires.',
    fix: 'Add a visible <label> element with a for attribute matching the input\'s id, or use aria-label / aria-labelledby.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'placeholder-only': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'The placeholder text disappears when the user starts typing, leaving them with no label to remember what the field requires. Some screen readers do not announce placeholders.',
    fix: 'Add a persistent visible <label> element. Placeholders are hints, not labels.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'title-only': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'The field relies on the title attribute for its label. The title is not visible by default and requires hovering, which keyboard-only and touch users cannot do.',
    fix: 'Use a visible <label> element with a for attribute instead of relying on the title attribute.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'missing-fieldset-legend': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'A group of related controls (like radio buttons) lacks a <fieldset> and <legend>. Screen readers cannot convey the grouping context.',
    fix: 'Wrap related controls in a <fieldset> with a <legend> that describes the group purpose.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'ungrouped-radio': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'Radio buttons or checkboxes that belong together are not grouped. Screen readers announce each one independently, making the relationship unclear.',
    fix: 'Wrap related radio buttons or checkboxes in a <fieldset> with a <legend>.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
};

export const ARIA_KNOWLEDGE: Record<string, IssueKnowledge> = {
  'invalid-role': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'Screen readers cannot interpret this element because it has an unrecognized ARIA role. The element will be announced incorrectly or skipped entirely.',
    fix: 'Use a valid WAI-ARIA role from the specification, or remove the role attribute if a native HTML element provides the correct semantics.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'redundant-role': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element has an ARIA role that duplicates the semantics already provided by the native HTML element. While not harmful, it adds unnecessary code.',
    fix: 'Remove the redundant role attribute. Native HTML elements like <nav>, <button>, and <main> already convey the correct role.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'missing-required-prop': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element has an ARIA role but is missing required attributes. Screen readers may announce the element incorrectly or omit critical state information.',
    fix: 'Add the required ARIA attributes for this role. For example, role="checkbox" requires aria-checked.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'broken-reference': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'An aria-labelledby, aria-describedby, or aria-controls attribute references an ID that does not exist in the DOM. Screen readers will silently ignore the broken reference.',
    fix: 'Ensure the referenced ID exists in the document and matches exactly (case-sensitive).',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'hidden-focusable': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element is hidden from assistive technology via aria-hidden but remains keyboard focusable. Users encounter a "ghost" stop that announces nothing.',
    fix: 'Either remove aria-hidden from the container, or add tabindex="-1" to prevent keyboard focus.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'presentation-conflict': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element has role="presentation" or role="none" which removes its semantic meaning, but it also has ARIA attributes or is focusable, creating a conflict.',
    fix: 'Remove role="presentation" if the element needs to be interactive, or remove the conflicting ARIA attributes and tabindex.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'invalid-value': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'An ARIA attribute has an invalid value. Screen readers may misinterpret the element\'s state or properties.',
    fix: 'Ensure ARIA attribute values match the specification. For example, aria-expanded must be "true" or "false".',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'positive-tabindex': {
    wcag: '2.4.3',
    wcagName: 'Focus Order',
    wcagLevel: 'A',
    userImpact: 'A positive tabindex forces this element to receive focus out of the natural DOM order, creating an unpredictable tab sequence for keyboard users.',
    fix: 'Remove the positive tabindex. Rely on DOM order for logical tab sequence.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
};

export const CONTRAST_KNOWLEDGE: IssueKnowledge = {
  wcag: '1.4.3',
  wcagName: 'Contrast (Minimum)',
  wcagLevel: 'AA',
  userImpact: 'Users with low vision, color deficiencies, or those in bright environments may be unable to read this text because the color contrast between text and background is too low.',
  fix: 'Increase the contrast ratio to at least 4.5:1 for normal text or 3:1 for large text (18pt+). Adjust the text or background color.',
  learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
};

const WCAG_LEVEL_COLOR: Record<string, string> = { A: '#DC2626', AA: '#EA580C', AAA: '#CA8A04' };
const LINK_COLOR = '#1D4ED8';
const ICON_EXT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

/**
 * Render a standardised knowledge block showing WCAG context, user impact,
 * fix suggestion, and learn-more link for any issue type.
 */
export function renderKnowledgeBlock(k: IssueKnowledge): string {
  const levelColor = WCAG_LEVEL_COLOR[k.wcagLevel] || WCAG_LEVEL_COLOR.A;
  return `
    <div style="margin-top: 10px !important; border-top: 1px solid #F3F4F6 !important; padding-top: 10px !important;">
      <div style="display: flex !important; align-items: center !important; gap: 6px !important; margin-bottom: 8px !important; flex-wrap: wrap !important;">
        <span style="background: ${levelColor} !important; color: white !important; padding: 2px 8px !important; border-radius: 4px !important; font-weight: 700 !important; font-size: 11px !important;">${k.wcagLevel}</span>
        <span style="font-size: 12px !important; color: #4B5563 !important; font-weight: 500 !important;">WCAG ${k.wcag} — ${escHtml(k.wcagName)}</span>
      </div>
      <div style="background: #FEF2F2 !important; border: 1px solid #FECACA !important; border-radius: 6px !important; padding: 10px 12px !important; margin-bottom: 8px !important;">
        <div style="font-size: 11px !important; font-weight: 600 !important; color: #991B1B !important; margin-bottom: 4px !important; text-transform: uppercase !important; letter-spacing: 0.3px !important;">User Impact</div>
        <div style="font-size: 12px !important; color: #7F1D1D !important; line-height: 1.5 !important;">${escHtml(k.userImpact)}</div>
      </div>
      <div style="background: #F0FDF4 !important; border: 1px solid #BBF7D0 !important; border-radius: 6px !important; padding: 10px 12px !important; margin-bottom: 8px !important;">
        <div style="font-size: 11px !important; font-weight: 600 !important; color: #166534 !important; margin-bottom: 4px !important; text-transform: uppercase !important; letter-spacing: 0.3px !important;">How to Fix</div>
        <div style="font-size: 12px !important; color: #14532D !important; line-height: 1.5 !important;">${escHtml(k.fix)}</div>
      </div>
      <a href="${k.learnMoreUrl}" target="_blank" rel="noopener noreferrer" style="display: flex !important; align-items: center !important; gap: 6px !important; font-size: 12px !important; color: ${LINK_COLOR} !important; text-decoration: none !important; font-weight: 500 !important;">
        ${ICON_EXT}
        Learn more — WCAG ${k.wcag}
      </a>
    </div>`;
}
