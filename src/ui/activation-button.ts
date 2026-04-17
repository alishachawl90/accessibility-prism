export function createActivationButton(onActivate: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.id = 'a11y-analyzer-activate';
  btn.setAttribute('aria-label', 'Open Accessibility Prism');
  btn.title = 'Accessibility Prism';

  // Use setProperty(..., 'important') for every declaration so host-page
  // button / * rules with !important cannot reposition or hide the button.
  const sp = (prop: string, val: string) => btn.style.setProperty(prop, val, 'important');
  sp('position', 'fixed');
  sp('bottom', '20px');
  sp('right', '20px');
  sp('width', '48px');
  sp('height', '48px');
  sp('border-radius', '14px');
  sp('background', '#1E293B');
  sp('border', 'none');
  sp('box-shadow', '0 4px 16px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)');
  sp('cursor', 'pointer');
  sp('z-index', '999998');
  sp('display', 'flex');
  sp('align-items', 'center');
  sp('justify-content', 'center');
  sp('transition', 'transform 0.15s, box-shadow 0.15s');
  sp('color-scheme', 'light');
  sp('padding', '0');
  sp('margin', '0');
  sp('outline', 'none');
  sp('font-family', 'inherit');

  btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8,4 18,12 8,20" fill="none"/><line x1="2" y1="12" x2="8" y2="12" opacity="0.7"/><line x1="18" y1="12" x2="23" y2="5" stroke="#16A34A"/><line x1="18" y1="12" x2="23" y2="9" stroke="#2563EB"/><line x1="18" y1="12" x2="23" y2="12" stroke="#F97316"/><line x1="18" y1="12" x2="23" y2="15" stroke="#EF4444"/><line x1="18" y1="12" x2="23" y2="19" stroke="#7C3AED"/></svg>`;

  btn.addEventListener('mouseenter', () => {
    btn.style.setProperty('transform', 'scale(1.08)', 'important');
    btn.style.setProperty('box-shadow', '0 6px 20px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.12)', 'important');
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.setProperty('transform', 'scale(1)', 'important');
    btn.style.setProperty('box-shadow', '0 4px 16px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)', 'important');
  });

  btn.addEventListener('click', () => {
    btn.remove();
    onActivate();
  });

  document.body.appendChild(btn);
  return btn;
}
