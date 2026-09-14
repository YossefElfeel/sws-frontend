/**
 * Drawn illustration, on the same terms as the icon set: one join, one cap, and a stroke that
 * renders at a constant width no matter what coordinate space the piece is drawn in. That last
 * part is why `vector-effect="non-scaling-stroke"` appears on every path — an icon is 1.75 on a
 * 24-unit box, and a 1.75 stroke on a 400-unit box would come out a tenth as thick and read as
 * a different system. Two weights exist and no more: HAIR for detail, EDGE for a primary
 * contour.
 *
 * PROVENANCE — every piece here is schematic and asserts nothing factual. There are no
 * numbers, no logos, no charts, no lettering, and nothing that stands in for a metric. The
 * project has no verified proof figure (PRODUCT.md), so an illustration that implied one would
 * be the same invention in a different medium. There is no lettering for a second reason: SVG
 * text is real text to the mobile audit, and any of it under 12px is a finding.
 *
 * Each piece is decorative — the surrounding section carries the meaning in words — so each is
 * aria-hidden. None is mirrored in RTL: these are drawings, not directional glyphs, and the
 * flow gate asserts that nothing outside `.icon--dir` flips.
 */

const HAIR = 1.75;
const EDGE = 2.5;

interface ArtProps {
  className?: string;
}

const frame = (viewBox: string, className?: string) => ({
  viewBox,
  className,
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
  'aria-hidden': true,
  focusable: false as const,
  preserveAspectRatio: 'xMidYMid meet' as const,
});

/** Applied per-shape: a group-level vector-effect is not inherited by children. */
const line = { vectorEffect: 'non-scaling-stroke' as const };

/**
 * The hero piece — a server stack under a domain and a certificate, which is the whole offer in
 * three objects. Deliberately symmetric about its own centre so it reads the same in Arabic as
 * in English without being flipped.
 */
export function ArtHosting({ className }: ArtProps) {
  const units = [130, 190, 250];
  return (
    <svg {...frame('0 0 400 330', className)}>
      {/* the ground the stack sits on */}
      <ellipse
        cx="200"
        cy="300"
        rx="150"
        ry="18"
        fill="var(--sws-action-subtle-bg)"
        stroke="none"
      />

      {/* domain, upper start-side */}
      <g strokeWidth={HAIR}>
        <circle cx="96" cy="66" r="34" fill="var(--sws-card-tile-bg)" {...line} />
        <path d="M62 66h68" {...line} />
        <path d="M96 32c16 18 16 50 0 68-16-18-16-50 0-68Z" {...line} />
      </g>

      {/* certificate, upper end-side */}
      <g strokeWidth={HAIR}>
        <path
          d="M304 32l30 12v26c0 20-12 34-30 42-18-8-30-22-30-42V44l30-12Z"
          fill="var(--sws-card-tile-bg)"
          {...line}
        />
        <path d="m292 70 9 9 18-19" {...line} />
      </g>

      {/* what connects them to the stack */}
      <g strokeWidth={HAIR} opacity="0.5">
        <path d="M96 104v34h44" {...line} />
        <path d="M304 116v22h-44" {...line} />
      </g>

      {/* the stack itself */}
      {units.map((y) => (
        <g key={y}>
          <rect
            x="120"
            y={y}
            width="160"
            height="46"
            rx="12"
            fill="var(--sws-surface-raised)"
            strokeWidth={EDGE}
            {...line}
          />
          <path d={`M146 ${y + 15}v16`} strokeWidth={HAIR} {...line} />
          <path d={`M162 ${y + 15}v16`} strokeWidth={HAIR} {...line} />
          <circle cx="246" cy={y + 23} r="4" strokeWidth={HAIR} {...line} />
          <circle
            cx="262"
            cy={y + 23}
            r="4"
            fill="var(--sws-action-primary)"
            stroke="none"
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * A shelf with nothing on it. For the empty state — an empty list is a fact about the account,
 * not a failure, so the drawing is calm rather than apologetic.
 */
export function ArtEmpty({ className }: ArtProps) {
  return (
    <svg {...frame('0 0 200 140', className)}>
      <ellipse
        cx="100"
        cy="120"
        rx="66"
        ry="10"
        fill="var(--sws-action-subtle-bg)"
        stroke="none"
      />
      <rect
        x="46"
        y="40"
        width="108"
        height="64"
        rx="12"
        fill="var(--sws-card-tile-bg)"
        strokeWidth={EDGE}
        {...line}
      />
      <path d="M46 66h108" strokeWidth={HAIR} {...line} />
      <path d="M74 52h12" strokeWidth={HAIR} {...line} />
      <path d="M74 86h52" strokeWidth={HAIR} opacity="0.5" {...line} />
    </svg>
  );
}

/*
 * The three house-ad drawings — one per promo on the dashboard rail.
 *
 * They share a 220x150 box so the rail's art slot never resizes as the promo changes: a
 * drawing that grows or shrinks between slides moves the headline beside it, and a headline
 * that moves while it is being read is the reason carousels are disliked. Same rules as the
 * pieces above — schematic, no lettering, nothing that stands in for a figure.
 */
const promoFrame = (className?: string) => frame('0 0 220 150', className);

/** SSL — a certificate with a padlock on it, which is the whole of what a visitor is shown. */
export function ArtSsl({ className }: ArtProps) {
  return (
    <svg {...promoFrame(className)}>
      <ellipse cx="110" cy="132" rx="74" ry="9" fill="var(--sws-action-subtle-bg)" stroke="none" />

      {/* the browser bar the padlock actually appears in */}
      <g strokeWidth={HAIR}>
        <rect x="26" y="24" width="120" height="28" rx="10" fill="var(--sws-card-tile-bg)" {...line} />
        <path d="M62 38h58" opacity="0.5" {...line} />
      </g>

      {/* the certificate */}
      <rect
        x="26"
        y="62"
        width="120"
        height="56"
        rx="12"
        fill="var(--sws-surface-raised)"
        strokeWidth={EDGE}
        {...line}
      />
      <g strokeWidth={HAIR} opacity="0.5">
        <path d="M46 80h56" {...line} />
        <path d="M46 96h34" {...line} />
      </g>

      {/* the padlock, sitting across both — it is what the certificate buys */}
      <g strokeWidth={EDGE}>
        <rect x="150" y="62" width="48" height="40" rx="10" fill="var(--sws-card-tile-bg)" {...line} />
        <path d="M162 62V50a12 12 0 0 1 24 0v12" strokeWidth={HAIR} {...line} />
      </g>
      <circle cx="174" cy="82" r="4" fill="var(--sws-action-primary)" stroke="none" />
    </svg>
  );
}

/** Email — one envelope at the front of a stack, because mailboxes come in more than one. */
export function ArtMail({ className }: ArtProps) {
  return (
    <svg {...promoFrame(className)}>
      <ellipse cx="110" cy="132" rx="74" ry="9" fill="var(--sws-action-subtle-bg)" stroke="none" />

      {/* the two behind */}
      <g strokeWidth={HAIR} opacity="0.5">
        <rect x="46" y="26" width="128" height="72" rx="12" fill="var(--sws-card-tile-bg)" {...line} />
        <rect x="34" y="38" width="128" height="72" rx="12" fill="var(--sws-card-tile-bg)" {...line} />
      </g>

      {/* the one in front */}
      <rect
        x="22"
        y="50"
        width="128"
        height="72"
        rx="12"
        fill="var(--sws-surface-raised)"
        strokeWidth={EDGE}
        {...line}
      />
      <path d="m22 62 64 38 64-38" strokeWidth={HAIR} {...line} />

      {/* the dot that says one of them is new */}
      <circle cx="176" cy="40" r="9" fill="var(--sws-action-primary)" stroke="none" />
    </svg>
  );
}

/** Website builder — a canvas being assembled from blocks, with one block held off the grid. */
export function ArtBuilder({ className }: ArtProps) {
  return (
    <svg {...promoFrame(className)}>
      <ellipse cx="110" cy="132" rx="74" ry="9" fill="var(--sws-action-subtle-bg)" stroke="none" />

      {/* the canvas */}
      <rect
        x="26"
        y="22"
        width="128"
        height="96"
        rx="12"
        fill="var(--sws-surface-raised)"
        strokeWidth={EDGE}
        {...line}
      />
      <path d="M26 44h128" strokeWidth={HAIR} {...line} />

      {/* blocks already placed */}
      <g strokeWidth={HAIR}>
        <rect x="40" y="56" width="46" height="48" rx="8" fill="var(--sws-card-tile-bg)" {...line} />
        <path d="M98 62h42" opacity="0.5" {...line} />
        <path d="M98 78h42" opacity="0.5" {...line} />
        <path d="M98 94h26" opacity="0.5" {...line} />
      </g>

      {/* the one being dragged in */}
      <rect
        x="158"
        y="60"
        width="40"
        height="34"
        rx="8"
        fill="var(--sws-action-subtle-bg)"
        strokeWidth={HAIR}
        {...line}
      />
      <circle cx="178" cy="77" r="4" fill="var(--sws-action-primary)" stroke="none" />
    </svg>
  );
}
