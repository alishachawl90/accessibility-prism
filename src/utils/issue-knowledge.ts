import type { KeyboardIssueType } from '../core/types';

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

export type FormLabelIssueType = 'missing-label' | 'missing-for' | 'empty-label' | 'duplicate-label' | 'implicit-label-only';

export const FORM_LABEL_KNOWLEDGE: Record<string, IssueKnowledge> = {
  'missing-label': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'Screen reader users hear "edit text" or "checkbox" without any description. They cannot determine what information this field requires.',
    fix: 'Add a visible <label> element with a for attribute matching the input\'s id, or use aria-label / aria-labelledby.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'missing-for': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'The label text exists visually near the input, but there is no programmatic association. Screen readers cannot announce the label when the input is focused.',
    fix: 'Add a for attribute to the <label> matching the input\'s id, or wrap the input inside the <label> element.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'empty-label': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'A <label> element is associated with this input but contains no text. Screen readers announce the field without a description.',
    fix: 'Add descriptive text inside the <label>, or use aria-label if a visible label is not desired.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'duplicate-label': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'Multiple labels are associated with this input, which can cause inconsistent announcements across different screen readers.',
    fix: 'Ensure each input has exactly one associated label. Remove duplicate for attributes or consolidate labels.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  'implicit-label-only': {
    wcag: '1.3.1',
    wcagName: 'Info and Relationships',
    wcagLevel: 'A',
    userImpact: 'The input relies on an implicit label (wrapping <label> without for attribute). Some older assistive technologies may not associate these correctly.',
    fix: 'Add an explicit for attribute to the <label> matching the input\'s id for maximum compatibility.',
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
  'required-attr': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element has an ARIA role but is missing required attributes. Screen readers may announce the element incorrectly or omit critical state information.',
    fix: 'Add the required ARIA attributes for this role. For example, role="checkbox" requires aria-checked.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'invalid-attr-value': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'An ARIA attribute on this element has an invalid value. Screen readers may misinterpret the element\'s state or properties.',
    fix: 'Ensure ARIA attribute values match the specification. For example, aria-expanded must be "true" or "false", not "yes".',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'orphaned-attr': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This element has ARIA attributes that are not supported by its role. Screen readers may ignore or misinterpret these attributes.',
    fix: 'Remove ARIA attributes that are not supported by the element\'s role, or change the role to one that supports them.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  'missing-name': {
    wcag: '4.1.2',
    wcagName: 'Name, Role, Value',
    wcagLevel: 'A',
    userImpact: 'This ARIA widget has no accessible name. Screen readers announce the role but not what it represents, leaving users guessing.',
    fix: 'Add aria-label, aria-labelledby, or visible text content to give the element an accessible name.',
    learnMoreUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
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
