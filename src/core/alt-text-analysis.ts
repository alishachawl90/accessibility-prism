import type { AltTextIssue } from './types';

const SUSPICIOUS_PATTERNS = [
  /^image$/i, /^img$/i, /^photo$/i, /^picture$/i, /^graphic$/i,
  /^icon$/i, /^logo$/i, /^banner$/i, /^untitled$/i,
  /^placeholder$/i, /^spacer$/i, /^blank$/i,
  /\.(?:jpg|jpeg|png|gif|svg|webp|bmp|avif)$/i,
];

const MAX_ALT_LENGTH = 125;

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

export function analyzeAltText(root?: Element | Document): AltTextIssue[] {
  const issues: AltTextIssue[] = [];
  const qsa = (root ?? document);

  const images = Array.from(qsa.querySelectorAll('img'))
    .filter(el => !isExtension(el));

  images.forEach(img => {
    const cs = window.getComputedStyle(img);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;

    const hasAlt = img.hasAttribute('alt');
    const alt = img.getAttribute('alt');
    const isInLink = !!img.closest('a[href]');
    const isInButton = !!img.closest('button');
    const role = img.getAttribute('role');
    const ariaHidden = img.getAttribute('aria-hidden') === 'true';
    const presentation = role === 'presentation' || role === 'none';

    if (ariaHidden || presentation) return;

    if (!hasAlt) {
      issues.push({
        element: img,
        type: 'missing-alt',
        severity: 'error',
        description: 'Image is missing the alt attribute entirely. Add alt="" for decorative images or descriptive text for meaningful images.',
        currentAlt: null,
      });
      return;
    }

    if (alt === '' && (isInLink || isInButton)) {
      const container = img.closest('a[href]') || img.closest('button');
      const containerText = container?.textContent?.trim() || '';
      const hasAriaLabel = container?.hasAttribute('aria-label') || container?.hasAttribute('aria-labelledby');
      if (!containerText && !hasAriaLabel) {
        issues.push({
          element: img,
          type: 'empty-alt-in-link',
          severity: 'error',
          description: `Image with empty alt inside a ${isInLink ? 'link' : 'button'} that has no other accessible name. The ${isInLink ? 'link' : 'button'} will be announced without a label.`,
          currentAlt: '',
        });
      }
      return;
    }

    if (alt === '' && role === 'img') {
      issues.push({
        element: img,
        type: 'decorative-with-role',
        severity: 'warning',
        description: 'Image has alt="" (decorative) but also role="img". Decorative images should use role="presentation" or role="none", or remove the role entirely.',
        currentAlt: '',
      });
      return;
    }

    if (alt && alt.trim()) {
      const isSuspicious = SUSPICIOUS_PATTERNS.some(p => p.test(alt.trim()));
      if (isSuspicious) {
        issues.push({
          element: img,
          type: 'suspicious-alt',
          severity: 'warning',
          description: `Alt text "${alt.trim().substring(0, 60)}" appears to be a filename or generic placeholder. Provide descriptive text that conveys the image's purpose.`,
          currentAlt: alt,
        });
      }

      if (alt.length > MAX_ALT_LENGTH) {
        issues.push({
          element: img,
          type: 'long-alt',
          severity: 'info',
          description: `Alt text is ${alt.length} characters (recommended max: ${MAX_ALT_LENGTH}). Consider using a shorter alt and providing detail via aria-describedby or a caption.`,
          currentAlt: alt,
        });
      }
    }
  });

  const svgs = Array.from(qsa.querySelectorAll('svg[role="img"]'))
    .filter(el => !isExtension(el));

  svgs.forEach(svg => {
    const title = svg.querySelector('title');
    const ariaLabel = svg.getAttribute('aria-label');
    const ariaLabelledBy = svg.getAttribute('aria-labelledby');

    if (!title && !ariaLabel && !ariaLabelledBy) {
      issues.push({
        element: svg,
        type: 'missing-alt',
        severity: 'error',
        description: 'SVG with role="img" has no accessible name. Add a <title> element, aria-label, or aria-labelledby.',
        currentAlt: null,
      });
    }
  });

  const inputImages = Array.from(qsa.querySelectorAll('input[type="image"]'))
    .filter(el => !isExtension(el)) as HTMLInputElement[];

  inputImages.forEach(input => {
    const alt = input.getAttribute('alt');
    if (!alt || !alt.trim()) {
      issues.push({
        element: input,
        type: 'missing-alt',
        severity: 'error',
        description: 'Image input (<input type="image">) is missing alt text. Add an alt attribute describing the button action.',
        currentAlt: alt || null,
      });
    }
  });

  const areaElements = Array.from(qsa.querySelectorAll('area[href]'))
    .filter(el => !isExtension(el));

  areaElements.forEach(area => {
    const alt = area.getAttribute('alt');
    if (!alt || !alt.trim()) {
      issues.push({
        element: area,
        type: 'missing-alt',
        severity: 'error',
        description: 'Image map area is missing alt text. Each clickable area needs descriptive alt text.',
        currentAlt: alt || null,
      });
    }
  });

  issues.sort((a, b) => {
    const sevOrder = { error: 0, warning: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });

  return issues;
}
