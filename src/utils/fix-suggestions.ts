import type { AxeViolation } from '../core/types';
import { escHtml } from './escape';

const WRAPPER =
  '<div style="margin-top: 10px; padding: 10px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px;">';
const TITLE =
  '<div style="font-size: 12px; font-weight: 600; color: #166534; margin-bottom: 6px;">💡 Fix Suggestion</div>';
const BODY_OPEN =
  '<div style="font-size: 12px; color: #374151; line-height: 1.6;">';
const BODY_CLOSE = '</div></div>';

function wrapSuggestion(innerHtml: string): string {
  return `${WRAPPER}${TITLE}${BODY_OPEN}${innerHtml}${BODY_CLOSE}`;
}

function failureSummaryBulletList(failureSummary: string): string {
  const lines = failureSummary
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return '<p style="margin:0;">No additional details available.</p>';
  }
  const items = lines
    .map((line) => `<li style="margin-bottom: 4px;">${escHtml(line)}</li>`)
    .join('');
  return `<ul style="margin: 0; padding-left: 1.25em;">${items}</ul>`;
}

type RuleGenerator = (violation: AxeViolation, nodeIndex: number) => string;

const ruleGenerators: Record<string, RuleGenerator> = {
  'color-contrast': () =>
    '<p style="margin:0 0 8px 0;">Check the <strong>foreground</strong> and <strong>background</strong> colors on this element and ensure they meet WCAG contrast requirements.</p>' +
    '<p style="margin:0;">Consider using a darker text color or lighter background.</p>',

  'image-alt': () =>
    '<p style="margin:0 0 8px 0;">Add a concise, descriptive <code>alt</code> attribute so screen readers can describe the image.</p>' +
    '<p style="margin:0;">Example: <code>&lt;img src="..." alt="descriptive text"&gt;</code></p>',

  label: () =>
    '<p style="margin:0 0 8px 0;">Associate a visible label with the control, or provide an accessible name.</p>' +
    '<p style="margin:0;">Use <code>&lt;label for="id"&gt;</code> pointing at the input <code>id</code>, or add <code>aria-label="…"</code> / <code>aria-labelledby</code> on the control.</p>',

  'button-name': () =>
    '<p style="margin:0 0 8px 0;">Buttons need an accessible name (visible text or an ARIA label).</p>' +
    '<p style="margin:0;">Add text inside the button, or use <code>aria-label="…"</code> / <code>aria-labelledby</code> if the visible label is elsewhere.</p>',

  'link-name': () =>
    '<p style="margin:0 0 8px 0;">Links must have discernible text for assistive technologies.</p>' +
    '<p style="margin:0;">Add meaningful link text, or use <code>aria-label="…"</code> / <code>aria-labelledby</code> when the text is not visible.</p>',

  list: () =>
    '<p style="margin:0 0 8px 0;">Use semantic list markup so lists are announced correctly.</p>' +
    '<p style="margin:0;">Example structure: <code>&lt;ul&gt;&lt;li&gt;Item one&lt;/li&gt;&lt;li&gt;Item two&lt;/li&gt;&lt;/ul&gt;</code> (or <code>&lt;ol&gt;</code> for ordered lists).</p>',

  'html-has-lang': () =>
    '<p style="margin:0 0 8px 0;">Set the document language on the root element.</p>' +
    '<p style="margin:0;">Example: <code>&lt;html lang="en"&gt;</code> (use the appropriate language code for your content).</p>',
};

/**
 * Returns HTML for a per-rule fix suggestion (and axe failure summary as fallback).
 */
export function generateFixSuggestion(violation: AxeViolation, nodeIndex: number): string {
  const node = violation.nodes[nodeIndex];
  if (!node) {
    return wrapSuggestion('<p style="margin:0;">No matching node for this issue.</p>');
  }

  const gen = ruleGenerators[violation.id];
  if (gen) {
    return wrapSuggestion(gen(violation, nodeIndex));
  }

  const summaryHtml = failureSummaryBulletList(node.failureSummary || '');
  return wrapSuggestion(
    '<p style="margin:0 0 8px 0;">Based on the automated check:</p>' + summaryHtml,
  );
}
