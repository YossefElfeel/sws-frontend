import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg';
/** 'danger' is for acts that take something away — cancelling, deleting, closing. */
type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

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
 *
 * It forwards its ref because a caller sometimes has to move focus onto it — ConfirmButton
 * focuses the confirm step so the keyboard path through a deletion is press, read, press again.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { size = 'md', variant = 'primary', children, className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`btn btn--${size} btn--${variant} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
});
