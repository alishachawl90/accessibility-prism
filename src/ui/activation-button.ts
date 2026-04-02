export function createActivationButton(onActivate: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.id = 'a11y-analyzer-activate';
  btn.setAttribute('aria-label', 'Open Accessibility Prism');
  btn.title = 'Accessibility Prism';

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: '#1E293B',
    border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    zIndex: '999998',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s, box-shadow 0.15s',
    colorScheme: 'light',
  });

  btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8,4 18,12 8,20" fill="none"/><line x1="2" y1="12" x2="8" y2="12" opacity="0.7"/><line x1="18" y1="12" x2="23" y2="5" stroke="#16A34A"/><line x1="18" y1="12" x2="23" y2="9" stroke="#2563EB"/><line x1="18" y1="12" x2="23" y2="12" stroke="#F97316"/><line x1="18" y1="12" x2="23" y2="15" stroke="#EF4444"/><line x1="18" y1="12" x2="23" y2="19" stroke="#7C3AED"/></svg>`;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.08)';
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.12)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)';
  });

  btn.addEventListener('click', () => {
    btn.remove();
    onActivate();
  });

  document.body.appendChild(btn);
  return btn;
}
