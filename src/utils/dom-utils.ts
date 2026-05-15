/**
 * DOM utility functions that run in the host-page context (content script).
 * Safe to use in content.ts and in the views when operating on live Elements.
 * These must NOT import anything from panel UI modules to stay context-agnostic.
 *
 * Both functions accept either a live Element OR a pre-serialized reference
 * `{ selector: string; snippet: string }` so that view files work unchanged in
 * both standalone mode (live Elements) and popup-window mode (serialized refs).
 */

export type SerializedElement = { selector: string; snippet: string };

/** getCssSelector(el) — works with a live Element or a pre-serialized ref. */
export function getCssSelector(el: Element | SerializedElement): string {
  if (!(el instanceof Element)) return (el as SerializedElement).selector;

  if (el.id) return `#${el.id}`;
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      parts.unshift(`#${current.id}`);
      break;
    }
    if (current.className && typeof current.className === 'string') {
      const meaningful = current.className
        .split(/\s+/)
        .filter(c => c && !/^(flex|grid|w-|h-|p-|m-|bg-|text-|border-|rounded|hidden|block|inline|relative|absolute|fixed)/.test(c))
        .slice(0, 2);
      if (meaningful.length) selector += '.' + meaningful.join('.');
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(selector);
    current = current.parentElement;
    if (parts.length >= 4) break;
  }
  return parts.join(' > ');
}

/** getSnippet(el) — works with a live Element or a pre-serialized ref. */
export function getSnippet(el: Element | SerializedElement, max = 120): string {
  if (!(el instanceof Element)) return (el as SerializedElement).snippet;

  const html = el.outerHTML;
  if (html.length <= max) return html;
  const tagEnd = html.indexOf('>');
  if (tagEnd >= 0 && tagEnd < max) return html.substring(0, max) + '…';
  return html.substring(0, max) + '…';
}

/**
 * Serialize a live Element to a plain JSON-safe ref.
 * Used by content.ts before sending results across the chrome.runtime message boundary.
 */
export function serializeElement(el: Element): SerializedElement {
  return { selector: getCssSelector(el), snippet: getSnippet(el) };
}

/**
 * Deep-clone a result object and replace all `Element` values with SerializedElement.
 * This makes any analysis result safe to pass through chrome.runtime.sendMessage.
 */
export function serializeResult<T>(result: T): T {
  return JSON.parse(JSON.stringify(result, (_key, value) => {
    if (typeof Element !== 'undefined' && value instanceof Element) {
      return serializeElement(value);
    }
    return value;
  })) as T;
}
