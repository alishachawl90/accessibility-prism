import { runAxe } from './axe-runner';
import type { AxeViolation } from './types';

let monitorActive = false;
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let rateLimitTimer: ReturnType<typeof setTimeout> | null = null;
let resultCallback: ((newResults: AxeViolation[]) => void) | null = null;

const mutatedElements = new Set<Element>();
let pendingMergedRoot: Element | null = null;
let lastScanAt = 0;

function isExcludedElement(el: Element | null): boolean {
  if (!el) return true;
  return !!(el.closest('#a11y-analyzer-panel') || el.closest('#a11y-analyzer-overlay'));
}

function nodeToElement(node: Node): Element | null {
  if (node.nodeType === Node.ELEMENT_NODE) return node as Element;
  return node.parentElement;
}

function shouldIgnoreMutationRecord(record: MutationRecord): boolean {
  const target = record.target;
  if (!(target instanceof Element)) return true;
  return isExcludedElement(target);
}

function collectElementsFromRecord(record: MutationRecord, bucket: Set<Element>): void {
  if (shouldIgnoreMutationRecord(record)) return;

  if (record.target instanceof Element && !isExcludedElement(record.target)) {
    bucket.add(record.target);
  }

  if (record.type !== 'childList') return;

  record.addedNodes.forEach((node) => {
    const el = nodeToElement(node);
    if (el && !isExcludedElement(el)) bucket.add(el);
  });

  if (record.removedNodes.length > 0 && record.target instanceof Element) {
    if (!isExcludedElement(record.target)) bucket.add(record.target);
  }
}

function lowestCommonAncestor(elements: Element[]): Element {
  if (elements.length === 0) return document.body;
  if (elements.length === 1) return elements[0];

  function lcaTwo(a: Element, b: Element): Element {
    const ancestors = new Set<Element>();
    let n: Element | null = a;
    while (n) {
      ancestors.add(n);
      n = n.parentElement;
    }
    n = b;
    while (n) {
      if (ancestors.has(n)) return n;
      n = n.parentElement;
    }
    return document.body;
  }

  return elements.reduce((acc, el) => lcaTwo(acc, el));
}

function clearDebounceTimer(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function clearRateLimitTimer(): void {
  if (rateLimitTimer !== null) {
    clearTimeout(rateLimitTimer);
    rateLimitTimer = null;
  }
}

function mergeScanRoot(next: Element): void {
  pendingMergedRoot = pendingMergedRoot
    ? lowestCommonAncestor([pendingMergedRoot, next])
    : next;
}

async function runScan(root: Element): Promise<void> {
  if (!resultCallback || !monitorActive) return;
  const results = await runAxe(root);
  if (monitorActive && resultCallback) {
    resultCallback(results);
  }
}

function scheduleRateLimitedScan(ancestor: Element): void {
  const now = Date.now();
  const elapsed = now - lastScanAt;

  mergeScanRoot(ancestor);

  if (elapsed >= 2000) {
    const root = pendingMergedRoot;
    pendingMergedRoot = null;
    clearRateLimitTimer();
    lastScanAt = Date.now();
    void runScan(root ?? document.body);
    return;
  }

  if (rateLimitTimer !== null) return;

  const delay = Math.max(0, 2000 - elapsed);
  rateLimitTimer = setTimeout(() => {
    rateLimitTimer = null;
    const root = pendingMergedRoot ?? document.body;
    pendingMergedRoot = null;
    lastScanAt = Date.now();
    void runScan(root);
  }, delay);
}

function flushDebouncedMutations(): void {
  debounceTimer = null;
  if (!monitorActive || mutatedElements.size === 0) {
    mutatedElements.clear();
    return;
  }

  const elements = [...mutatedElements];
  mutatedElements.clear();

  const ancestor = lowestCommonAncestor(elements);
  const root =
    ancestor === document.documentElement ? document.body : ancestor;

  scheduleRateLimitedScan(root);
}

function onMutations(records: MutationRecord[]): void {
  if (!monitorActive) return;

  for (const record of records) {
    collectElementsFromRecord(record, mutatedElements);
  }

  if (mutatedElements.size === 0) return;

  clearDebounceTimer();
  debounceTimer = setTimeout(flushDebouncedMutations, 500);
}

function attachToBody(): boolean {
  const body = document.body;
  if (!body) return false;

  observer = new MutationObserver(onMutations);
  observer.observe(body, { childList: true, subtree: true });
  return true;
}

export function startDomMonitor(callback: (newResults: AxeViolation[]) => void): void {
  stopDomMonitor();

  resultCallback = callback;
  monitorActive = true;
  mutatedElements.clear();
  pendingMergedRoot = null;
  lastScanAt = 0;

  if (attachToBody()) return;

  const onReady = (): void => {
    if (!monitorActive || observer) return;
    attachToBody();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    requestAnimationFrame(() => {
      if (!observer && monitorActive) attachToBody();
    });
  }
}

export function stopDomMonitor(): void {
  monitorActive = false;
  resultCallback = null;

  clearDebounceTimer();
  clearRateLimitTimer();

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  mutatedElements.clear();
  pendingMergedRoot = null;
}

export function isDomMonitorActive(): boolean {
  return monitorActive;
}
