import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'secondary' | 'quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  variant?: Variant;
  children: ReactNode;
}

/**
 * `sm` is 32px tall, which is below the project's 44px target rule but above the WCAG 2.2 AA
 * bar of 24px. It is legitimate only because `--sws-button-hit-area` extends the pointer
 * target past the visible box — see the `.btn--sm::after` rule in components.css and
 * ADR-0004. The token exists so tokens/a11y-gate.mjs can verify the claim instead of
 * trusting it; an unverifiable promise is what produced the original finding.
 *
 * Restrict `sm` to dense pointer contexts: table row actions and toolbars.
 */
export function Button({
  size = 'md',
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${size} btn--${variant} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
