/**
 * Message protocol for communication between the content script (host page) and
 * the detached popup window (panel.html).
 *
 * Communication uses a long-lived chrome.runtime port named 'prism-panel'.
 * The popup creates the port; the content script listens via onConnect.
 *
 * Element references CANNOT cross the message boundary — they are serialized to
 * { selector, snippet } by content.ts using serializeResult() before sending.
 * When the popup sends HIGHLIGHT, the content script resolves the Element from its
 * own in-memory result arrays using the { auditType, index } key.
 */

// ────────────────────────────────────────────────────────────────────────────
// Command messages: Popup → Content Script
// ────────────────────────────────────────────────────────────────────────────

export type CommandMessage =
  | { type: 'PANEL_READY' }
  | { type: 'RUN_AXE' }
  | { type: 'RUN_AUTO_KEYBOARD' }
  | { type: 'START_MANUAL' }
  | { type: 'STOP_MANUAL' }
  | { type: 'RESET_MANUAL' }
  | { type: 'RUN_HEADINGS' }
  | { type: 'RUN_LANDMARKS' }
  | { type: 'RUN_CONTRAST' }
  | { type: 'RUN_FOCUS_MGMT' }
  | { type: 'RUN_LIVE_REGIONS' }
  | { type: 'RUN_TOUCH_TARGETS' }
  | { type: 'RUN_ALT_TEXT' }
  | { type: 'RUN_ACC_NAMES' }
  | { type: 'RUN_ARIA' }
  | { type: 'RUN_FORM_LABELS' }
  | { type: 'RUN_SR_WALKTHROUGH' }
  | { type: 'RUN_READING_ORDER' }
  | { type: 'RUN_SCORECARD' }
  | { type: 'START_PARTIAL_SCAN' }
  | { type: 'START_SCOPE_PICK' }
  | { type: 'SET_SCOPE_SELECTOR'; selector: string }
  | { type: 'CLEAR_SCOPE' }
  | { type: 'EXPORT_REPORT' }
  | { type: 'EXPORT_SCORECARD' }
  | { type: 'HIGHLIGHT'; auditType: AuditType; index: number }
  | { type: 'HIGHLIGHT_BY_SELECTOR'; selector: string; color?: string; label?: string }
  | { type: 'PREPARE_DEVTOOLS_INSPECT'; selector: string }
  | { type: 'SHOW_COMPONENT_FLOW'; componentName: string; instanceIdx: number }
  | { type: 'CANCEL_TAB_WALK' };

// ────────────────────────────────────────────────────────────────────────────
// Result messages: Content Script → Popup
// ────────────────────────────────────────────────────────────────────────────
// All result data has been serialized — Element references replaced with
// { selector: string; snippet: string } plain objects (see dom-utils.serializeResult).

export type ResultMessage =
  | { type: 'LOADING'; label: string }
  | { type: 'AXE_RESULTS'; violations: any; components: any; dedupedIssues: any; regions: any }
  | { type: 'KEYBOARD_RESULTS'; issues: any; flows: any }
  | { type: 'HEADING_RESULTS'; result: any }
  | { type: 'LANDMARK_RESULTS'; result: any }
  | { type: 'CONTRAST_RESULTS'; issues: any }
  | { type: 'FOCUS_MGMT_RESULTS'; issues: any }
  | { type: 'LIVE_REGION_RESULTS'; result: any }
  | { type: 'TOUCH_TARGET_RESULTS'; issues: any }
  | { type: 'ALT_TEXT_RESULTS'; issues: any }
  | { type: 'ACC_NAME_RESULTS'; result: any }
  | { type: 'ARIA_RESULTS'; result: any }
  | { type: 'FORM_LABELS_RESULTS'; result: any }
  | { type: 'SR_WALKTHROUGH_RESULTS'; entries: any }
  | { type: 'READING_ORDER_RESULTS'; entries: any }
  | { type: 'SCORECARD_RESULTS'; result: any }
  | { type: 'TRAIL_UPDATE'; trail: SerializedTrailEntry[] }
  | { type: 'TRAIL_COMPLETE'; trail: SerializedTrailEntry[] }
  | { type: 'SCOPE_SET'; label: string }
  | { type: 'SCOPE_PICK_STARTED' }
  | { type: 'SCOPE_SET_FROM_SELECTOR_FAILED' }
  | { type: 'DEVTOOLS_INSPECT_READY'; tempId: string }
  | { type: 'CONTENT_READY'; url: string; title: string }
  // ── Animated tab walk ──────────────────────────────────────────────────
  | { type: 'TAB_WALK_START'; total: number }
  | { type: 'TAB_WALK_STEP'; index: number; total: number; element: SerializedTrailEntry; focusReceived: boolean }
  | { type: 'TAB_WALK_COMPLETE'; issues: any; flows: any; missedElements: SerializedTrailEntry[] };

// ────────────────────────────────────────────────────────────────────────────
// Shared types
// ────────────────────────────────────────────────────────────────────────────

export type AuditType =
  | 'axe'
  | 'keyboard'
  | 'manual'
  | 'headings'
  | 'landmarks'
  | 'contrast'
  | 'focus-mgmt'
  | 'live-regions'
  | 'touch-targets'
  | 'alt-text'
  | 'acc-names'
  | 'aria'
  | 'form-labels'
  | 'component-flow';

export interface SerializedTrailEntry {
  index: number;
  tag: string;
  label: string;
  selector: string;
  snippet: string;
}

// Port name used by chrome.runtime.connect() and chrome.runtime.onConnect
export const PORT_NAME = 'prism-panel';
