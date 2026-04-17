export interface OverlayState {
  issuesActive: boolean;
  componentsActive: boolean;
  flowActive: boolean;
}

function isFixedOrSticky(el: Element): boolean {
  let current: Element | null = el;
  while (current && current !== document.documentElement) {
    const pos = getComputedStyle(current).position;
    if (pos === 'fixed' || pos === 'sticky') return true;
    current = current.parentElement;
  }
  return false;
}

function getAbsoluteCoords(el: Element): { x: number; y: number; w: number; h: number } {
  const bounds = el.getBoundingClientRect();
  if (isFixedOrSticky(el)) {
    return { x: bounds.x + window.scrollX, y: bounds.y + window.scrollY, w: bounds.width, h: bounds.height };
  }
  return { x: bounds.x + window.scrollX, y: bounds.y + window.scrollY, w: bounds.width, h: bounds.height };
}

export function drawHighlight(el: Element, color: string, label?: string): SVGGElement {
  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns, "g");
  
  const rect = document.createElementNS(ns, "rect");
  const coords = getAbsoluteCoords(el);
  
  rect.setAttribute("x", coords.x.toString());
  rect.setAttribute("y", coords.y.toString());
  rect.setAttribute("width", coords.w.toString());
  rect.setAttribute("height", coords.h.toString());
  rect.setAttribute("fill", color);
  rect.setAttribute("fill-opacity", "0.2");
  rect.setAttribute("stroke", color);
  rect.setAttribute("stroke-width", "2");
  rect.style.pointerEvents = "none";
  g.appendChild(rect);

  if (label) {
    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", coords.x.toString());
    text.setAttribute("y", (coords.y - 5).toString());
    text.setAttribute("fill", color);
    text.setAttribute("font-size", "12");
    text.setAttribute("font-family", "sans-serif");
    text.setAttribute("font-weight", "bold");
    text.textContent = label;
    g.appendChild(text);
  }
  
  return g;
}

export function drawKeyboardFlowBox(el: Element, index: number): SVGGElement {
  return drawHighlight(el, 'blue', index.toString());
}

/**
 * Draws taba11y-style numbered badges on each element and connecting arrows
 * showing the tab navigation order.
 */
export function drawTabOrderOverlay(svg: SVGSVGElement, elements: Element[]) {
  const ns = "http://www.w3.org/2000/svg";

  // Add arrowhead marker definition
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(ns, 'defs');
    svg.appendChild(defs);
  }
  const marker = document.createElementNS(ns, 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const arrowPath = document.createElementNS(ns, 'path');
  arrowPath.setAttribute('d', 'M0,0 L8,3 L0,6 Z');
  arrowPath.setAttribute('fill', '#5C6BC0');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);

  const centers: { x: number; y: number }[] = [];

  elements.forEach((el, idx) => {
    const coords = getAbsoluteCoords(el);
    const cx = coords.x + coords.w / 2;
    const cy = coords.y + coords.h / 2;
    centers.push({ x: cx, y: cy });

    const g = document.createElementNS(ns, 'g');
    g.style.pointerEvents = 'none';

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', coords.x.toString());
    rect.setAttribute('y', coords.y.toString());
    rect.setAttribute('width', coords.w.toString());
    rect.setAttribute('height', coords.h.toString());
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#5C6BC0');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('stroke-dasharray', '4,2');
    rect.setAttribute('rx', '3');
    g.appendChild(rect);

    const badgeX = coords.x - 10;
    const badgeY = coords.y - 10;

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', badgeX.toString());
    circle.setAttribute('cy', badgeY.toString());
    circle.setAttribute('r', '12');
    circle.setAttribute('fill', '#5C6BC0');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    const numText = document.createElementNS(ns, 'text');
    numText.setAttribute('x', badgeX.toString());
    numText.setAttribute('y', (badgeY + 4).toString());
    numText.setAttribute('fill', 'white');
    numText.setAttribute('font-size', '11');
    numText.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    numText.setAttribute('font-weight', '700');
    numText.setAttribute('text-anchor', 'middle');
    numText.textContent = (idx + 1).toString();
    g.appendChild(numText);

    svg.appendChild(g);
  });

  // Draw connecting arrows between consecutive elements
  for (let i = 0; i < centers.length - 1; i++) {
    const from = centers[i];
    const to = centers[i + 1];

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', from.x.toString());
    line.setAttribute('y1', from.y.toString());
    line.setAttribute('x2', to.x.toString());
    line.setAttribute('y2', to.y.toString());
    line.setAttribute('stroke', '#5C6BC0');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-opacity', '0.5');
    line.setAttribute('stroke-dasharray', '6,3');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    line.style.pointerEvents = 'none';
    svg.appendChild(line);
  }
}

// Accessibility Insights-style heading markers
const HEADING_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#3B82F6', 5: '#8B5CF6', 6: '#6B7280',
};

export function drawHeadingMarkers(svg: SVGSVGElement, headings: { element: Element; level: number; text: string }[]) {
  const ns = 'http://www.w3.org/2000/svg';

  headings.forEach(h => {
    const coords = getAbsoluteCoords(h.element);
    if (coords.w === 0 && coords.h === 0) return;

    const x = coords.x;
    const y = coords.y;
    const color = HEADING_COLORS[h.level] || '#6B7280';
    const g = document.createElementNS(ns, 'g');
    g.style.pointerEvents = 'none';

    const outline = document.createElementNS(ns, 'rect');
    outline.setAttribute('x', x.toString());
    outline.setAttribute('y', y.toString());
    outline.setAttribute('width', coords.w.toString());
    outline.setAttribute('height', coords.h.toString());
    outline.setAttribute('fill', `${color}`);
    outline.setAttribute('fill-opacity', '0.08');
    outline.setAttribute('stroke', color);
    outline.setAttribute('stroke-width', '2');
    outline.setAttribute('rx', '3');
    g.appendChild(outline);

    const badgeW = 32;
    const badgeH = 20;
    const bx = x - 2;
    const by = y - badgeH - 4;

    const badge = document.createElementNS(ns, 'rect');
    badge.setAttribute('x', bx.toString());
    badge.setAttribute('y', by.toString());
    badge.setAttribute('width', badgeW.toString());
    badge.setAttribute('height', badgeH.toString());
    badge.setAttribute('rx', '4');
    badge.setAttribute('fill', color);
    g.appendChild(badge);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', (bx + badgeW / 2).toString());
    label.setAttribute('y', (by + 14).toString());
    label.setAttribute('fill', 'white');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
    label.setAttribute('font-weight', '700');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = `H${h.level}`;
    g.appendChild(label);

    svg.appendChild(g);
  });
}

// Accessibility Insights-style landmark markers
const LANDMARK_COLORS: Record<string, string> = {
  banner: '#6366F1', navigation: '#F97316', main: '#16A34A', complementary: '#8B5CF6',
  contentinfo: '#0891B2', search: '#F59E0B', form: '#3B82F6', region: '#6B7280',
};

export function drawLandmarkMarkers(svg: SVGSVGElement, landmarks: { element: Element; role: string; label: string }[]) {
  const ns = 'http://www.w3.org/2000/svg';

  landmarks.forEach(lm => {
    const coords = getAbsoluteCoords(lm.element);
    if (coords.w === 0 && coords.h === 0) return;

    const x = coords.x;
    const y = coords.y;
    const color = LANDMARK_COLORS[lm.role] || '#6B7280';
    const g = document.createElementNS(ns, 'g');
    g.style.pointerEvents = 'none';

    const outline = document.createElementNS(ns, 'rect');
    outline.setAttribute('x', x.toString());
    outline.setAttribute('y', y.toString());
    outline.setAttribute('width', coords.w.toString());
    outline.setAttribute('height', coords.h.toString());
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', color);
    outline.setAttribute('stroke-width', '2.5');
    outline.setAttribute('stroke-dasharray', '6,3');
    outline.setAttribute('rx', '4');
    g.appendChild(outline);

    const text = lm.label ? `${lm.role}: ${lm.label}` : lm.role;
    const badgeW = Math.max(text.length * 7 + 16, 60);
    const badgeH = 22;
    const bx = x;
    const by = y - badgeH - 2;

    const badge = document.createElementNS(ns, 'rect');
    badge.setAttribute('x', bx.toString());
    badge.setAttribute('y', by.toString());
    badge.setAttribute('width', badgeW.toString());
    badge.setAttribute('height', badgeH.toString());
    badge.setAttribute('rx', '4');
    badge.setAttribute('fill', color);
    g.appendChild(badge);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', (bx + 8).toString());
    label.setAttribute('y', (by + 15).toString());
    label.setAttribute('fill', 'white');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
    label.setAttribute('font-weight', '600');
    label.textContent = text.length > 30 ? text.substring(0, 30) + '...' : text;
    g.appendChild(label);

    svg.appendChild(g);
  });
}

export function drawReadingOrderMarkers(svg: SVGSVGElement, elements: { element: Element | null }[]) {
  const ns = 'http://www.w3.org/2000/svg';
  const color = '#5C6BC0';

  elements.forEach((item, idx) => {
    if (!item.element) return;
    const coords = getAbsoluteCoords(item.element);
    if (coords.w === 0 && coords.h === 0) return;

    const x = coords.x;
    const y = coords.y;
    const g = document.createElementNS(ns, 'g');
    g.style.pointerEvents = 'none';

    const outline = document.createElementNS(ns, 'rect');
    outline.setAttribute('x', x.toString());
    outline.setAttribute('y', y.toString());
    outline.setAttribute('width', coords.w.toString());
    outline.setAttribute('height', coords.h.toString());
    outline.setAttribute('fill', color);
    outline.setAttribute('fill-opacity', '0.05');
    outline.setAttribute('stroke', color);
    outline.setAttribute('stroke-width', '1.5');
    outline.setAttribute('stroke-opacity', '0.4');
    outline.setAttribute('rx', '2');
    g.appendChild(outline);

    const badgeR = 12;
    const bx = x - 4;
    const by = y - 4;

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', bx.toString());
    circle.setAttribute('cy', by.toString());
    circle.setAttribute('r', badgeR.toString());
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', bx.toString());
    label.setAttribute('y', (by + 4).toString());
    label.setAttribute('fill', 'white');
    label.setAttribute('font-size', '10');
    label.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
    label.setAttribute('font-weight', '700');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = (idx + 1).toString();
    g.appendChild(label);

    svg.appendChild(g);
  });
}

export function clearOverlay(svg: SVGSVGElement) {
  svg.innerHTML = '';
}

export function initializeOverlay(): SVGSVGElement {
  let svg = document.getElementById('a11y-analyzer-overlay') as SVGSVGElement | null;
  if (!svg) {
    const ns = "http://www.w3.org/2000/svg";
    svg = document.createElementNS(ns, 'svg');
    svg.id = 'a11y-analyzer-overlay';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = document.documentElement.scrollHeight + 'px';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '999998';
    document.body.appendChild(svg);
    
    const updateHeight = () => {
      svg!.style.height = document.documentElement.scrollHeight + 'px';
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(document.body);
  }
  return svg;
}
