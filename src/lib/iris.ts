// Coral cartoon iris over the whole page: the #splash element from Splash.astro (styles in global.css).
// Intro: words, a hold, then the iris opens. Mode switch: iris closes, swap, iris opens (no words).

const splash = () => document.getElementById('splash')!;
let busy = false;

// Set an attribute that starts an animation on the splash itself; resolve when it ends.
function play(el: HTMLElement, attr: string) {
  return new Promise<void>((resolve) => {
    const end = (e?: Event) => {
      if (e && e.target !== el) return; // the words' own animations bubble up too
      el.removeEventListener('animationend', end);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(end, 2500); // never get stuck over the page
    el.addEventListener('animationend', end);
    el.toggleAttribute(attr, true);
  });
}

async function open(el: HTMLElement) {
  await play(el, 'data-open');
  el.hidden = true;
  el.removeAttribute('data-open');
}

/** Opening screen: hold, then iris open. */
export async function intro(holdMs: number) {
  busy = true;
  await new Promise((r) => setTimeout(r, holdMs));
  await open(splash());
  busy = false;
}

/** Cover the page with a closing iris, run swap() while covered, then open again. */
export async function irisSwap(swap: () => void) {
  if (busy) return; // mid-animation: ignore extra taps
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return swap();
  busy = true;
  const el = splash();
  el.dataset.switch = ''; // no words this time
  el.hidden = false;
  await play(el, 'data-closing');
  el.removeAttribute('data-closing');
  swap();
  await open(el);
  el.removeAttribute('data-switch');
  busy = false;
}
