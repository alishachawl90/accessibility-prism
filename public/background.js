/**
 * Accessibility Prism — Background Service Worker (MV3)
 *
 * Provides access to the browser's computed Accessibility Tree via chrome.automation,
 * which is the same data source used by ChromeVox and other screen readers.
 * Content scripts cannot call chrome.automation directly — this background worker
 * acts as the bridge.
 */

// Roles that AT ignores entirely — skip the node and do not traverse its children.
const SKIP_ROLES = new Set([
  'inlineTextBox',
  'ignored',
  'none',
  'presentation',
  'unknown',
]);

// Roles whose subtree we traverse but which are NOT announced as standalone items.
const TRANSPARENT_ROLES = new Set(['rootWebArea', 'webArea', 'group', 'div']);

// Roles that produce text announcements without a role suffix
// (a screen reader reads the text, not "paragraph" or "staticText").
const SILENT_ROLES = new Set(['staticText', 'paragraph']);

function isNodeVisible(node) {
  const state = node.state ?? {};
  return !state.invisible && !state.offscreen && !state.hidden;
}

/**
 * Decides whether this AX node should appear as a step in the SR walkthrough.
 * parentRole is needed to distinguish staticText under a generic container
 * (must be included — it's the only carrier of that text) from staticText
 * inside a heading/button/paragraph (parent already announces the text).
 */
function shouldInclude(node, parentRole) {
  const role = node.role;
  if (!role || SKIP_ROLES.has(role)) return false;
  if (TRANSPARENT_ROLES.has(role)) return false;

  if (role === 'staticText') {
    // Only surface when parent is a container with no semantic role of its own,
    // so the text would otherwise be silently skipped.
    const parentIsNeutral =
      parentRole === 'genericContainer' ||
      parentRole === 'group' ||
      parentRole == null;
    return parentIsNeutral && !!(node.name?.trim());
  }

  if (role === 'genericContainer') {
    // Only include if the browser has computed an accessible name for it
    // (e.g. via aria-label or aria-labelledby).
    return !!(node.name?.trim());
  }

  return true;
}

function buildAnnouncement(node) {
  const role = node.role;
  const name = (node.name ?? '').trim();
  const description = (node.description ?? '').trim();

  // Pure text roles — announce only the text, no role suffix.
  if (SILENT_ROLES.has(role)) {
    const parts = [name];
    if (description) parts.push(`— ${description}`);
    return parts.join(' ') || '(empty)';
  }

  const parts = [];
  if (name) parts.push(`"${name}"`);
  if (role && !TRANSPARENT_ROLES.has(role)) parts.push(role);
  if (node.hierarchicalLevel) parts.push(`level ${node.hierarchicalLevel}`);

  const state = node.state ?? {};
  const stateLabels = [];
  if (state.expanded)  stateLabels.push('expanded');
  if (state.collapsed) stateLabels.push('collapsed');
  if (state.checked)   stateLabels.push('checked');
  if (state.selected)  stateLabels.push('selected');
  if (state.pressed)   stateLabels.push('pressed');
  if (state.required)  stateLabels.push('required');
  if (state.disabled)  stateLabels.push('disabled');
  if (stateLabels.length) parts.push(stateLabels.join(', '));

  if (description) parts.push(`— ${description}`);

  return parts.join(', ') || '(empty)';
}

function serializeNode(node) {
  const state = node.state ?? {};
  const stateKeys = Object.keys(state).filter(k => state[k] === true);

  return {
    role:        node.role        ?? '',
    name:        (node.name       ?? '').trim(),
    description: (node.description ?? '').trim(),
    value:       (node.value      ?? '').trim(),
    htmlTag:     node.htmlTag     ?? '',
    level:       node.hierarchicalLevel ?? null,
    posInSet:    node.posInSet    ?? null,
    setSize:     node.setSize     ?? null,
    states:      stateKeys,
    announcement: buildAnnouncement(node),
  };
}

/**
 * Recursively walks the AX tree in DOM order, collecting SR-relevant nodes.
 * Stops descending into staticText nodes (their children are inlineTextBox fragments).
 */
function walkTree(node, results = [], parentRole = null) {
  if (!node) return results;
  if (!isNodeVisible(node)) return results;

  const role = node.role;

  // Hard skip — ignore this node and all its children.
  if (SKIP_ROLES.has(role)) return results;

  const isTransparent = TRANSPARENT_ROLES.has(role) || role === 'rootWebArea' || role === 'webArea';

  if (!isTransparent && shouldInclude(node, parentRole)) {
    results.push(serializeNode(node));
  }

  // staticText children are inlineTextBox fragments — not useful individually.
  if (role === 'staticText' || role === 'inlineTextBox') return results;

  const children = node.children ?? [];
  for (const child of children) {
    walkTree(child, results, role);
  }

  return results;
}

// ─── Message handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'get-ax-tree') return false;

  const tabId = sender.tab?.id;
  if (!tabId) {
    sendResponse({ error: 'No tab ID available', nodes: [] });
    return false;
  }

  try {
    chrome.automation.getTree(tabId, (rootNode) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message, nodes: [] });
        return;
      }
      if (!rootNode) {
        sendResponse({ error: 'AX tree root was null', nodes: [] });
        return;
      }
      try {
        const nodes = walkTree(rootNode);
        sendResponse({ nodes });
      } catch (walkErr) {
        sendResponse({ error: String(walkErr), nodes: [] });
      }
    });
  } catch (err) {
    sendResponse({ error: String(err), nodes: [] });
    return false;
  }

  // Return true to keep the message channel open for the async callback.
  return true;
});
