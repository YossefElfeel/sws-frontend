import type { SelectHTMLAttributes } from 'react';
import { IconChevron } from './icons';

/**
 * A dropdown, framed the way every other field on these screens is framed.
 *
 * A bare `<select class="field">` wears the browser's own arrow, and the browser draws that
 * arrow hard against the frame — no padding, a different glyph on every platform, and a
 * different one again between light and dark. Beside an input with 16px of breathing room on
 * both sides it read as a control from another product, which is what the review flagged.
 *
 * So the arrow becomes ours: `appearance: none` puts the native one away, and the chevron is
 * the same `IconChevron` the table filters and the masthead switches already use, inset the
 * same 16px as the text on the other side. The menu that opens is still the platform's, which
 * is the half worth keeping — it is the half that works on a phone.
 *
 * The wrapper exists because a `<select>` cannot carry a pseudo-element in Chrome, so the
 * chevron has to be a real element with something positioned to hang it from.
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * A class for the wrapper rather than the control — for the few places where the select's
   * place in a flex row belongs to the frame, since the frame is what the row now sizes.
   */
  wrapClassName?: string;
}

export function Select({ className, wrapClassName, children, ...rest }: SelectProps) {
  return (
    <span className={`select${wrapClassName ? ` ${wrapClassName}` : ''}`}>
      <select className={`field${className ? ` ${className}` : ''}`} {...rest}>
        {children}
      </select>
      <IconChevron size={16} className="select__chev" />
    </span>
  );
}
