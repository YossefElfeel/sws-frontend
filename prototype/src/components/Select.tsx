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
 *
 * And the wrapper takes the control's own `dir`, which is the fix for a defect worth naming.
 * The three extension pickers are `dir="ltr"` — ".com" is Latin text and reads left to right
 * whatever language the page is in — but the wrapper around them stayed RTL on an Arabic page.
 * Logical properties then resolved against two different axes at once: the control reserved
 * its chevron's room at its own inline end, on the right, while `.select__chev` hung itself at
 * the WRAPPER's inline end, on the left. The arrow was drawn on top of the first letter of the
 * value, and ".com" read as a smudge. The two have to agree about which end is the end.
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
    // Undefined when the caller says nothing, so a select that has not asked for a direction
    // goes on inheriting the page's — which is every other select in the product.
    <span className={`select${wrapClassName ? ` ${wrapClassName}` : ''}`} dir={rest.dir}>
      <select className={`field${className ? ` ${className}` : ''}`} {...rest}>
        {children}
      </select>
      <IconChevron size={16} className="select__chev" />
    </span>
  );
}
