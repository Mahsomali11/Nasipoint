/**
 * Global Double-Click & Duplicate Form Submission Guard
 * 
 * Intercepts user click events in the capture phase on primary action/submit buttons.
 * Immediately disables the button, replaces text/icon with a loading spinner,
 * and completely prevents duplicate clicks until the action completes or times out.
 */

let activeButtons = new Set<HTMLElement>();

/**
 * Checks if an element qualifies strictly as an interactive submit or primary action button.
 * Completely ignores navigation links, sidebar menu items, tabs, cards, tables, and generic clickable elements.
 */
function isActionButton(el: HTMLElement): boolean {
  // 1. Must be a BUTTON or an INPUT of type submit
  const tagName = el.tagName.toLowerCase();
  if (tagName !== 'button' && !(tagName === 'input' && (el as HTMLInputElement).type === 'submit')) {
    return false;
  }

  const button = el as HTMLButtonElement;

  // 2. Strict exclusions: disabled or explicitly opted-out
  if (
    button.disabled ||
    button.dataset.noGuard === 'true' ||
    button.hasAttribute('data-no-guard')
  ) {
    return false;
  }

  // 3. Strict exclusion: Navigation links (any button wrapped in or acting as an anchor)
  if (button.closest('a') !== null) {
    return false;
  }

  // 4. Strict exclusion: Sidebar menus & navigation bars
  if (
    button.closest('aside, nav, [role="navigation"], [data-sidebar], .sidebar, [data-sidebar-item]') !== null ||
    button.classList.contains('sidebar-item') ||
    button.classList.contains('nav-link') ||
    button.classList.contains('nav-item')
  ) {
    return false;
  }

  // 5. Strict exclusion: Navigation tabs & filter tab lists
  if (
    button.closest('[role="tablist"], [role="tab"], [data-tab], [data-tabs], .tabs, .tab-list') !== null ||
    button.getAttribute('role') === 'tab' ||
    button.hasAttribute('aria-selected') ||
    button.classList.contains('tab') ||
    button.classList.contains('tab-btn')
  ) {
    return false;
  }

  // 6. Strict exclusion: Tables, table headers, table rows, and cells
  // (unless the button explicitly carries [data-submit-guard] or [data-action-button])
  const isExplicitGuard =
    button.dataset.submitGuard === 'true' ||
    button.hasAttribute('data-submit-guard') ||
    button.dataset.actionButton === 'true' ||
    button.hasAttribute('data-action-button') ||
    button.classList.contains('submit-guard');

  if (button.closest('table, thead, tbody, tfoot, tr, td, th, [role="table"], [role="grid"], [role="row"]') !== null) {
    if (!isExplicitGuard) {
      return false;
    }
  }

  // 7. Strict exclusion: Clickable cards and list row wrappers
  if (
    button.closest('.card-clickable, [data-card-clickable]') !== null ||
    button.classList.contains('card-clickable')
  ) {
    return false;
  }

  // 8. Strict exclusion: Dropdown triggers, popover toggles, and disclosure buttons
  if (
    button.getAttribute('aria-haspopup') === 'true' ||
    button.getAttribute('aria-haspopup') === 'menu' ||
    button.hasAttribute('aria-expanded') ||
    button.hasAttribute('data-toggle') ||
    button.hasAttribute('data-dropdown')
  ) {
    return false;
  }

  // 9. Strict exclusion: Passive buttons (cancel, close, back, hold, reset, view, edit, filter, search, etc.)
  const rawText = (button.innerText || button.textContent || '').trim().toLowerCase();
  const passiveWords = [
    'cancel',
    'close',
    'back',
    'reset',
    'clear',
    'hold',
    'dismiss',
    'details',
    'print',
    'download',
    'export',
    'share',
    'copy',
    'view',
    'view receipt',
    'edit',
    'filter',
    'search',
    'today',
    'this month',
    'all time',
    'custom',
    'all',
    'paid',
    'unpaid',
    'settled',
    'open',
  ];

  if (
    passiveWords.includes(rawText) ||
    button.getAttribute('aria-label')?.toLowerCase() === 'close' ||
    button.hasAttribute('data-dismiss')
  ) {
    return false;
  }

  // 10. Inclusion Rule A: Explicit attribute or class
  if (isExplicitGuard) {
    return true;
  }

  // 11. Inclusion Rule B: True HTML Form Submit Buttons
  const btnType = button.getAttribute('type')?.toLowerCase();
  if (btnType === 'submit') {
    return true;
  }
  if (tagName === 'input' && (button as HTMLInputElement).type === 'submit') {
    return true;
  }
  // Standard HTML: <button> inside a <form> without explicit type defaults to 'submit'
  if (button.form && !btnType) {
    return true;
  }

  // 12. Inclusion Rule C: Modal primary action buttons (e.g. AlertDialogAction)
  const isInsideDialog = button.closest('[role="alertdialog"], [role="dialog"], .modal, .dialog') !== null;
  const isDialogFooterAction = button.closest('[data-dialog-footer], .alert-dialog-footer, [role="alertdialog"] footer, [role="dialog"] footer') !== null;
  if (isInsideDialog && isDialogFooterAction && !passiveWords.includes(rawText)) {
    return true;
  }

  // 13. Inclusion Rule D: Primary Action Buttons with explicit action text keywords
  // (POS Charge, Payment Submit, Purchase Process, Return Confirm, Transfer Initiate, Save Record)
  const actionKeywords = [
    'charge',
    'process purchase',
    'process return',
    'process partial return',
    'return full receipt',
    'submit payment',
    'save expense',
    'save changes',
    'initiate transfer',
    'confirm return',
    'confirm refund',
    'refund expense',
    'reverse expense',
    'record credit',
    'record payment',
    'record purchase',
    'create store',
  ];

  for (const keyword of actionKeywords) {
    if (keyword === 'charge' || keyword === 'record credit') {
      if (rawText.startsWith(keyword)) return true;
    } else if (rawText === keyword || rawText.startsWith(keyword + ' ') || rawText.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Resets a guarded button back to its original interactive state.
 */
export function resetButton(button: HTMLElement | null) {
  if (!button) return;
  if (button.dataset.submitting !== 'true') return;

  activeButtons.delete(button);

  // Restore content
  if (button.dataset.originalHtml !== undefined) {
    button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
  }

  // Restore disabled state
  if (button.dataset.originalDisabled !== undefined) {
    (button as HTMLButtonElement).disabled = button.dataset.originalDisabled === 'true';
    delete button.dataset.originalDisabled;
  } else {
    (button as HTMLButtonElement).disabled = false;
  }

  // Restore minWidth
  if (button.dataset.originalMinWidth !== undefined) {
    button.style.minWidth = button.dataset.originalMinWidth;
    delete button.dataset.originalMinWidth;
  } else {
    button.style.minWidth = '';
  }

  delete button.dataset.submitting;
  button.removeAttribute('aria-busy');
}

/**
 * Resets all currently active guarded buttons.
 */
export function resetAllActionButtons() {
  activeButtons.forEach(btn => resetButton(btn));
  activeButtons.clear();
}

/**
 * Programmatic helper to execute an async action with global guard release.
 */
export async function guardAction<T>(actionFn: () => Promise<T>): Promise<T> {
  try {
    return await actionFn();
  } finally {
    window.dispatchEvent(new CustomEvent('action-complete'));
    resetAllActionButtons();
  }
}

/**
 * Initializes the global DOM click listener.
 */
export function initSubmitGuard() {
  if (typeof window === 'undefined') return;

  // Intercept clicks in capture phase to precede any synthetic/bubbled events
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target || !(target instanceof Element)) return;

    // Immediately ignore clicks on navigation links / anchor elements
    if (target.closest('a')) return;

    const button = target.closest('button, input[type="submit"]') as HTMLButtonElement | HTMLInputElement | null;
    if (!button) return;

    // 1. If button is already submitting, IMMEDIATELY drop this click
    if (button.dataset.submitting === 'true' || button.getAttribute('aria-busy') === 'true') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    // 2. Check if this is strictly an action or submit button
    if (!isActionButton(button)) {
      return;
    }

    // 3. If within a form, check HTML5 validation first
    if ('form' in button && button.form && typeof button.form.checkValidity === 'function') {
      if (!button.form.checkValidity()) {
        // Let standard browser form validation show missing field errors
        return;
      }
    }

    // 4. Mark as submitting synchronously to block any second click immediately
    button.dataset.submitting = 'true';
    button.setAttribute('aria-busy', 'true');
    activeButtons.add(button);

    // Freeze width to avoid visual layout jumping
    const rect = button.getBoundingClientRect();
    if (rect.width > 0) {
      button.dataset.originalMinWidth = button.style.minWidth || '';
      button.style.minWidth = `${Math.ceil(rect.width)}px`;
    }

    button.dataset.originalHtml = button.innerHTML;
    button.dataset.originalDisabled = button.disabled ? 'true' : 'false';

    // 5. In a microtask, disable the button and show spinner & "Processing..."
    // (A tiny delay ensures the browser still dispatches the initial click event to React)
    setTimeout(() => {
      if (button.dataset.submitting === 'true') {
        button.disabled = true;
        button.innerHTML = `
          <span class="inline-flex items-center justify-center gap-2 pointer-events-none">
            <svg class="animate-spin h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </span>
        `;
      }
    }, 0);

    // 6. Safety timeout auto-recovery: restore after 3.5s if not reset sooner
    setTimeout(() => {
      resetButton(button);
    }, 3500);

  }, { capture: true, passive: false });

  // Listen for custom completion events
  window.addEventListener('action-complete', resetAllActionButtons);
  window.addEventListener('action-error', resetAllActionButtons);

  // Inertia page events
  document.addEventListener('inertia:finish', resetAllActionButtons);
  document.addEventListener('inertia:error', resetAllActionButtons);
}
