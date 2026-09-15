/**
 * VPS telemetry — the four graphs a server page carries.
 *
 * Development fixtures, in the same sense as the disk figure already on a service: a real build
 * reads these from the hypervisor, and until it does the screens have to be reviewable. What
 * they are NOT is a claim. Nothing here is quoted anywhere as a performance figure, a capacity
 * headline or an uptime number — they are one account's fortnight-old afternoon, and they say
 * nothing about what the product can do (PRODUCT.md, "Evidence on Hand").
 *
 * The window is fixed rather than read from the clock, for the reason TODAY is fixed on the
 * dashboard: a review build whose graphs redraw themselves every hour cannot be compared
 * against yesterday's screenshot.
 *
 * The numbers are generated rather than typed, which is the honest way to get 48 of them that
 * do not look hand-placed — and seeded, so the same window draws the same shape every time.
 */

/**
 * Samples, and the minutes between them: two hours of an afternoon at four-minute resolution.
 *
 * 31 rather than 30, and the odd number is load-bearing. The clock under each chart is thinned
 * to six labels, and six evenly spaced ticks need the number of intervals to divide by five.
 * Thirty does; twenty-nine is prime, and the last tick landed one step short of the one before
 * it, so the final two times overlapped.
 */
export const SAMPLE_COUNT = 31;
export const SAMPLE_MINUTES = 4;
const WINDOW_START = '2026-09-14T11:56:00Z';

/**
 * A small deterministic generator. Not random: the same seed always draws the same line, which
 * is what lets a screenshot be compared against the one before it.
 */
function series(seed: number, shape: (t: number, noise: number) => number): number[] {
  let state = seed >>> 0;
  const next = () => {
    // Numerical Recipes' LCG constants. Any decent pair would do; these are the well-known ones.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: SAMPLE_COUNT }, (_, i) =>
    Math.max(0, Math.round(shape(i / (SAMPLE_COUNT - 1), next()) * 100) / 100),
  );
}

/** A burst that arrives late in the window, which is what the graphs are there to show. */
const burst = (t: number, at: number, width: number) => Math.exp(-(((t - at) / width) ** 2));

export interface Line {
  /**
   * What the legend calls it, unit included. The unit lives on the line rather than on the
   * chart because that is the only place it is not said twice: a chart with one series was
   * naming it in the legend and again in a caption underneath, word for word.
   */
  labelKey: string;
  /** Which of the chart's two inks it takes. */
  ink: 'a' | 'b';
  points: number[];
}

export interface Metric {
  id: string;
  titleKey: string;
  lines: Line[];
}

/**
 * Four metrics, in the order a person reads them when something is wrong: what the processor is
 * doing, what is in memory, what is crossing the network, what is hitting the disk.
 */
export const VPS_METRICS: Metric[] = [
  {
    id: 'cpu',
    titleKey: 'vpsm.cpu',
    lines: [
      {
        labelKey: 'vpsm.load',
        ink: 'a',
        points: series(7, (t, n) =>
          4 + n * 3 + 118 * burst(t, 0.78, 0.035) + 96 * burst(t, 0.88, 0.03) + 74 * burst(t, 0.97, 0.03),
        ),
      },
    ],
  },
  {
    id: 'memory',
    titleKey: 'vpsm.memory',
    lines: [
      {
        labelKey: 'vpsm.usedMib',
        ink: 'a',
        points: series(31, (t, n) => 120 + n * 18 + 430 * Math.max(0, t - 0.55) ** 1.4 * 3),
      },
    ],
  },
  {
    id: 'network',
    titleKey: 'vpsm.network',
    lines: [
      { labelKey: 'vpsm.readKib', ink: 'a', points: series(11, (t, n) => 30 + n * 40 + 280 * burst(t, 0.8, 0.07)) },
      { labelKey: 'vpsm.writeKib', ink: 'b', points: series(97, (t, n) => 18 + n * 26 + 150 * burst(t, 0.86, 0.06)) },
    ],
  },
  {
    id: 'disk',
    titleKey: 'vpsm.disk',
    lines: [
      { labelKey: 'vpsm.readKib', ink: 'a', points: series(53, (t, n) => 60 + n * 90 + 900 * burst(t, 0.82, 0.05)) },
      { labelKey: 'vpsm.writeKib', ink: 'b', points: series(83, (t, n) => 40 + n * 70 + 1500 * burst(t, 0.9, 0.04)) },
    ],
  },
];

/**
 * The clock down the bottom of every chart. Built once here rather than per chart, so the four
 * graphs are four views of one window and cannot drift apart by a sample.
 */
export const SAMPLE_TIMES: string[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
  const at = new Date(new Date(WINDOW_START).getTime() + i * SAMPLE_MINUTES * 60_000);
  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`;
});

/** When the window ends — the "as at" a reader needs before trusting a graph. */
export const SAMPLED_AT = `2026-09-14 ${SAMPLE_TIMES[SAMPLE_COUNT - 1]}`;
