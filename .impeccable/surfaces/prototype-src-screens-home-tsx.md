---
version: 2
slug: "prototype-src-screens-home-tsx"
primary_target: "prototype/src/screens/Home.tsx"
related_targets: []
---

## Direction contract

THESIS: The production visual language of sws.somion.ch, extended across the whole system so the marketing pages and the account pages read as one company. Refuses the invented-statistics band the live homepage ships.

OWN-WORLD: Rubik throughout, one family for Latin and Arabic. Indigo #4E4FEB carries every primary action; near-black #020617 for text; white cards on a near-white ground with a faint plotted grid. Radii 8/12/16/24 and pills, soft offset shadows, lavender #EEEEFE icon tiles. Values measured off the running site, not proposed.

EXTENSION (2026-09-09, user-approved): the world above is kept and three layers are added to it.
  · DEPTH — an elevation ramp paired to surface tokens rather than to shadow alone, so a raised surface reads in dark mode, where shadow does not. This deliberately supersedes the decision recorded in DESIGN.md §4, which stripped the marketing shadow from the client-area card and left it "a bordered plane on a flat ground". That decision was correct against the elevation it had: a shadow-only language that rendered in one theme and vanished in the other. The objection is answered by changing the mechanism, not by ignoring it — depth is now carried by a surface step, border and radius, which survive both themes, with shadow demoted to a light-mode reinforcement. Elevation still means one thing, "this floats above the page"; more things are now allowed to.
  · ILLUSTRATION — a non-factual visual layer: product and cPanel UI imagery, and line illustration built on the icon system's own stroke of 1.75, one join, one cap, no emoji. It fills the dead half of the hero and the empty grounds between sections. It asserts nothing: no numbers, no partner logos, no testimonials, no uptime. The marked absence stands.
  · GROUND — sections alternate their ground so the page has anchors instead of one uniform near-white from header to footer.

STORY: A buyer sees what the plan costs, what it renews at, and what they can pay with — then buys and manages the service without the surface changing under them.

FIRST VIEWPORT: Sticky header, announcement pill, a two-tone headline where the second half is indigo, a lede, and two CTAs, and — added by the extension — a product visual holding the side the headline leaves empty. Below it four feature cards, then four pricing cards with the recommended one flagged and every card carrying its renewal price. Signature behaviour: the renewal figure is on the card, never in the terms, and VAT is a separate line at checkout. Pricing cards share a baseline: equal height, CTAs on one line, because four cards ending at four heights is the tell of a template.

MOTION: hover lift on cards and the primary button, expo-out. The extension adds a stated vocabulary rather than one gesture — lift on hover, a settle on focus, and a section entrance — all through the existing duration and easing tokens, all zeroed under prefers-reduced-motion at source.

FORM: Brief-pinned by the user on 2026-09-01 (https://sws.somion.ch/en). This supersedes the rolled direction "The Counterfoil" (candidate 3 of 7, seed 1612aea5); a user-pinned direction beats the roll. The 2026-09-09 extension was chosen by the user over working inside the pinned world unchanged; it adds to the contract and overrides none of it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
