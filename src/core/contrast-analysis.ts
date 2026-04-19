import type { ContrastIssue } from './types';

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function parseColor(colorStr: string): [number, number, number, number] | null {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    match[4] !== undefined ? parseFloat(match[4]) : 1,
  ];
}

function blendOnWhite(r: number, g: number, b: number, a: number): [number, number, number] {
  return [
    Math.round(r * a + 255 * (1 - a)),
    Math.round(g * a + 255 * (1 - a)),
    Math.round(b * a + 255 * (1 - a)),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getResolvedBackground(el: Element): [number, number, number] {
  let current: Element | null = el;
  while (current) {
    const cs = window.getComputedStyle(current);
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg[3] > 0.01) {
      if (bg[3] >= 0.99) return [bg[0], bg[1], bg[2]];
      return blendOnWhite(bg[0], bg[1], bg[2], bg[3]);
    }
    current = current.parentElement;
  }
  return [255, 255, 255];
}

function colorToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

export function analyzeContrast(root?: Element | Document): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const seen = new Set<Element>();
  const walkRoot = root instanceof Element ? root : document.body;

  const walker = document.createTreeWalker(walkRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (isExtension(parent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let count = 0;
  const MAX_NODES = 500;

  while (walker.nextNode() && count < MAX_NODES) {
    const textNode = walker.currentNode;
    const el = textNode.parentElement!;

    if (seen.has(el)) continue;
    seen.add(el);

    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    const fgParsed = parseColor(cs.color);
    if (!fgParsed) continue;

    const [fr, fg, fb] = fgParsed[3] < 0.99
      ? blendOnWhite(fgParsed[0], fgParsed[1], fgParsed[2], fgParsed[3])
      : [fgParsed[0], fgParsed[1], fgParsed[2]];

    const [br, bg, bb] = getResolvedBackground(el);

    const fgLum = relativeLuminance(fr, fg, fb);
    const bgLum = relativeLuminance(br, bg, bb);
    const ratio = contrastRatio(fgLum, bgLum);

    const fontSize = parseFloat(cs.fontSize);
    const fontWeight = parseInt(cs.fontWeight, 10) || (cs.fontWeight === 'bold' ? 700 : 400);
    const isBold = fontWeight >= 700;
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);

    const requiredAA = isLargeText ? 3 : 4.5;
    const requiredAAA = isLargeText ? 4.5 : 7;
    const passesAA = ratio >= requiredAA;
    const passesAAA = ratio >= requiredAAA;

    if (!passesAA) {
      const text = (textNode.textContent?.trim() || '').substring(0, 60);
      issues.push({
        element: el,
        text,
        foreground: colorToHex(fr, fg, fb),
        background: colorToHex(br, bg, bb),
        ratio: Math.round(ratio * 100) / 100,
        requiredAA,
        requiredAAA,
        passesAA,
        passesAAA,
        fontSize,
        isBold,
        isLargeText,
      });
      count++;
    }
  }

  issues.sort((a, b) => a.ratio - b.ratio);
  return issues;
}
