/**
 * Drawn icons: one stroke weight, one join, one cap. No emoji and no font glyphs — a
 * pictogram that changes shape with the reader's platform is not part of a design system.
 *
 * Each is decorative beside a text label, so each is aria-hidden and the surrounding control
 * carries the accessible name.
 */

interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false as const,
});

export function IconCheck({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconChevron({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function IconGlobe({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5s-1.1 6.2-3.3 8.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z" />
    </svg>
  );
}

export function IconCart({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 4h2.2l2 11.2a1.8 1.8 0 0 0 1.8 1.5h7.7a1.8 1.8 0 0 0 1.8-1.4L20 8H6.2" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

export function IconServer({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  );
}

export function IconGauge({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20.5 15a8.5 8.5 0 1 0-17 0" />
      <path d="m12 14 4-4" />
      <circle cx="12" cy="15" r="1.3" />
    </svg>
  );
}

export function IconMail({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 7 7.1 5.2a2 2 0 0 0 2.2 0L20.2 7" />
    </svg>
  );
}

export function IconShield({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconSupport({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
      <path d="M20 19v.6a2.4 2.4 0 0 1-2.4 2.4H13" />
    </svg>
  );
}

export function IconInfo({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.5v5M12 7.8h.01" />
    </svg>
  );
}

export function IconSearch({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </svg>
  );
}

export function IconSpark({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z" />
    </svg>
  );
}

export function IconSun({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </svg>
  );
}

export function IconMoon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.5 8.5 0 1 0 9.4 9.4Z" />
    </svg>
  );
}

export function IconCoin({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.2a3 3 0 0 0-2.5-1.2c-1.5 0-2.6.9-2.6 2s1 1.7 2.6 2 2.6.9 2.6 2-1.1 2-2.6 2a3 3 0 0 1-2.5-1.2M12 6.4v11.2" />
    </svg>
  );
}

export function IconTrash({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
      <path d="M10.5 10.5v6M13.5 10.5v6" />
    </svg>
  );
}

/**
 * Forward. Drawn pointing right, and mirrored in RTL by the `icon--dir` rule — an arrow that
 * means "onward" points the way the reader is travelling, so in Arabic it points left. It is
 * the one class of icon that is not the same picture in both directions.
 */
export function IconArrow({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={`icon--dir${className ? ` ${className}` : ''}`}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
  );
}

export function IconInvoice({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 2.8h9.5L19 6.3V21l-2.2-1.3-2.1 1.3-2.2-1.3-2.1 1.3L8.1 19.7 6 21V2.8Z" />
      <path d="M9.3 8.5h6M9.3 12h6M9.3 15.5h3.5" />
    </svg>
  );
}

export function IconBook({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 4.5A1.7 1.7 0 0 1 5.7 3H19v15.5H5.7A1.7 1.7 0 0 0 4 20.2V4.5Z" />
      <path d="M4 18.4A1.6 1.6 0 0 0 5.6 21H19" />
    </svg>
  );
}

export function IconMegaphone({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 10v3.5a1.5 1.5 0 0 0 1.5 1.5H7l9.5 4.5V5L7 9.5H5.5A1.5 1.5 0 0 0 4 11Z" />
      <path d="M19.5 9.5a3.2 3.2 0 0 1 0 5M7 15v4.5" />
    </svg>
  );
}

export function IconUsers({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9.5" cy="8" r="3.3" />
      <path d="M3.5 20a6 6 0 0 1 12 0M16.5 5.2a3.3 3.3 0 0 1 0 6M17.5 20a6 6 0 0 0-2.2-4.6" />
    </svg>
  );
}

export function IconKey({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="8" cy="15.5" r="4" />
      <path d="m10.9 12.6 8.1-8.1M16.5 7l2.2 2.2M14 9.5l2.2 2.2" />
    </svg>
  );
}

export function IconPaperclip({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M19 11.5 12.2 18.3a4.5 4.5 0 0 1-6.4-6.4l7.3-7.3a3 3 0 0 1 4.3 4.3l-7.3 7.3a1.5 1.5 0 0 1-2.2-2.2l6.4-6.4" />
    </svg>
  );
}

export function IconExternal({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M13.5 4.5H19.5V10.5M19.5 4.5 11 13" />
      <path d="M18 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5" />
    </svg>
  );
}

export function IconCopy({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.2" />
      <path d="M15.5 8.5V5.7A2.2 2.2 0 0 0 13.3 3.5H5.7A2.2 2.2 0 0 0 3.5 5.7v7.6a2.2 2.2 0 0 0 2.2 2.2h2.8" />
    </svg>
  );
}

export function IconPlus({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ── client-area chrome ─────────────────────────────────────────────────────── */

export function IconBell({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 8.6a6 6 0 1 0-12 0c0 5.3-2 6.9-2 6.9h16s-2-1.6-2-6.9" />
      <path d="M13.7 19.4a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function IconMenu({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconSignOut({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={`icon--dir${className ? ` ${className}` : ''}`}>
      <path d="M14.5 20H6.2A2.2 2.2 0 0 1 4 17.8V6.2A2.2 2.2 0 0 1 6.2 4h8.3" />
      <path d="M16.5 15.5 20 12l-3.5-3.5M20 12H9.5" />
    </svg>
  );
}

/** A renewal is a date on a calendar before it is a row in a table. */
export function IconCalendar({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

export function IconWallet({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 8.2A2.2 2.2 0 0 1 5.7 6h11.1A2.2 2.2 0 0 1 19 8.2" />
      <rect x="3.5" y="8.2" width="17" height="11.8" rx="2.2" />
      <path d="M20.5 12.5h-3.3a1.8 1.8 0 0 0 0 3.6h3.3" />
    </svg>
  );
}

export function IconAlert({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v4.6M12 16.1h.01" />
    </svg>
  );
}

export function IconLink({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M10.4 13.6a3.6 3.6 0 0 0 5.4.4l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.5 1.5" />
      <path d="M13.6 10.4a3.6 3.6 0 0 0-5.4-.4l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.5-1.5" />
    </svg>
  );
}

/*
 * The editor toolbar set — spec 9.5.2.
 *
 * These exist because the toolbar was drawn in characters: a literal 🔗 emoji, a ❝ quotation
 * mark, a • bullet, and the letters B, I and H set in bold. The system's own rule is that a
 * pictogram which changes shape with the reader's platform is not part of the design system,
 * and an emoji is the clearest case of one — it renders as a different drawing on every OS, in
 * a different colour, at a different weight to the stroke set around it.
 */

export function IconBold({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2.25}>
      <path d="M7.5 5h5.2a3.5 3.5 0 0 1 0 7H7.5zM7.5 12h6a3.5 3.5 0 0 1 0 7h-6z" />
    </svg>
  );
}

export function IconItalic({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.5 5h-4.2M13.7 19H9.5M13.4 5 10.6 19" />
    </svg>
  );
}

export function IconHeading({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.5 5v14M15.5 5v14M6.5 12h9" />
    </svg>
  );
}

export function IconList({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9.5 7h9M9.5 12h9M9.5 17h9M5.5 7h.01M5.5 12h.01M5.5 17h.01" />
    </svg>
  );
}

export function IconListNumbered({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M10.5 7h8M10.5 12h8M10.5 17h8" />
      <path d="M5 5.8 6.2 5v3.6M4.6 12h2.2l-2.2 3h2.4M4.6 15.6h2.2" strokeWidth={1.4} />
    </svg>
  );
}

export function IconCode({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </svg>
  );
}

export function IconQuote({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9.5 6.5c-2.5 1-4 3.2-4 5.9V17h4.6v-4.6H7.2c0-1.7.8-3.2 2.3-4zM18 6.5c-2.5 1-4 3.2-4 5.9V17h4.6v-4.6h-2.9c0-1.7.8-3.2 2.3-4z" />
    </svg>
  );
}
