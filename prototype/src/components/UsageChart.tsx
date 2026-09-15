import { useId } from 'react';
import { useLocale } from '../lib/locale';
import { SAMPLE_TIMES, type Metric } from '../lib/telemetry';

/**
 * A usage graph on a server page — spec 9.3, and the four of them are the reason a VPS page is
 * not a cPanel page.
 *
 * Two decisions decide the whole component.
 *
 * EVERY LABEL IS HTML. Only the plot is SVG. Axis text drawn inside an SVG scales with the
 * viewBox, so a chart that fits a 1440px column renders its own numbers at seven or eight pixels
 * on a phone — below the readable floor, and a finding in the mobile audit, which counts SVG
 * text as the real text it is. Laying the labels out around the plot in a grid keeps them at
 * caption size wherever the chart ends up, and keeps them selectable and translatable besides.
 *
 * THE PLOT IS NOT MIRRORED. A time axis runs left to right in both languages, because the thing
 * it is a picture of does: later is to the right of earlier whatever direction the surrounding
 * prose reads. So the frame gets `dir="ltr"` and the labels around it keep the page's own
 * direction — the same split the serial face already makes for dates and IP addresses.
 */

/** A 0–100 viewBox, so the path is written in percentages and the CSS decides the real size. */
const VB = 100;

/** The gridlines behind the plot, as a share of the height. Four bands is enough to read a shape
    against and few enough not to become the picture. */
const BANDS = [0, 0.25, 0.5, 0.75, 1];

/**
 * A round number at or above the highest sample. A y axis whose top is the maximum reading puts
 * the peak on the frame, where it looks clipped; a round ceiling leaves it room and gives the
 * axis labels numbers a person can hold in their head.
 */
function ceiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / (magnitude / 2)) * (magnitude / 2);
}

/**
 * Thin the x labels, evenly, with both ends kept.
 *
 * Four, and the number is set by the narrowest place this chart appears rather than by the
 * widest. At 390px a chart is about 240px of plot; six timestamps across that overlap at both
 * ends, which is worse than three gaps in the middle. Four reads at every width the page has,
 * and 30 intervals divides by three exactly, so the last tick lands on the last sample instead
 * of being tacked on beside its neighbour.
 */
function ticks(count: number, wanted: number): number[] {
  const step = Math.max(1, Math.round((count - 1) / (wanted - 1)));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(i);
  if (out[out.length - 1] !== count - 1) out.push(count - 1);
  return out;
}

export function UsageChart({ metric }: { metric: Metric }) {
  const { t, locale } = useLocale();
  const id = useId();

  const top = ceiling(Math.max(...metric.lines.flatMap((l) => l.points)));
  const xs = metric.lines[0].points.map((_, i, all) => (i / (all.length - 1)) * VB);

  const path = (points: number[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(2)} ${(VB - (p / top) * VB).toFixed(2)}`).join(' ');

  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'en' : locale);
  const xTicks = ticks(SAMPLE_TIMES.length, 4);

  /*
   * The graph is a picture, so it gets a label that says what the picture shows — the range and
   * the peak, which is what someone reads a usage graph for and all a screen reader can usefully
   * be handed short of the table underneath.
   */
  const summary = metric.lines
    .map((l) => `${t(l.labelKey as never)}: ${fmt(Math.round(Math.min(...l.points)))}–${fmt(Math.round(Math.max(...l.points)))}`)
    .join(' · ');

  return (
    <section className="chart" aria-labelledby={`${id}-t`}>
      <header className="chart__head">
        <h3 className="chart__title" id={`${id}-t`}>
          {t(metric.titleKey as never)}
        </h3>
        <ul className="chart__legend">
          {metric.lines.map((l) => (
            <li key={l.labelKey}>
              <span className={`chart__key chart__key--${l.ink}`} aria-hidden="true" />
              {t(l.labelKey as never)}
            </li>
          ))}
        </ul>
      </header>

      <div className="chart__frame" dir="ltr">
        <ul className="chart__y" aria-hidden="true">
          {[...BANDS].reverse().map((b) => (
            <li key={b}>{fmt(Math.round(top * b))}</li>
          ))}
        </ul>

        <svg
          className="chart__plot"
          viewBox={`0 0 ${VB} ${VB}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${t(metric.titleKey as never)}. ${summary}`}
        >
          <g className="chart__grid">
            {BANDS.map((b) => (
              <line key={b} x1="0" x2={VB} y1={VB * b} y2={VB * b} vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {metric.lines.map((l) => (
            <g key={l.labelKey} className={`chart__line chart__line--${l.ink}`}>
              {/* The fill under the line, closed along the floor. It is what makes a shape
                  readable at 120px tall; the stroke alone reads as a scribble at that size. */}
              <path className="chart__area" d={`${path(l.points)} L${VB} ${VB} L0 ${VB} Z`} />
              <path
                className="chart__stroke"
                d={path(l.points)}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>

        <ul className="chart__x" aria-hidden="true">
          {xTicks.map((i) => (
            <li key={i} style={{ insetInlineStart: `${(i / (SAMPLE_TIMES.length - 1)) * 100}%` }}>
              {SAMPLE_TIMES[i]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
