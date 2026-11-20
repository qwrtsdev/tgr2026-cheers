import { PUBLIC_HCAPTCHA_SITE_KEY } from 'astro:env/client';

type HCaptcha = {
  render(el: HTMLElement, opts: { sitekey: string; size: 'invisible' }): string;
  execute(id: string, opts: { async: true }): Promise<{ response: string }>;
};
declare global {
  interface Window {
    hcaptcha: HCaptcha;
    onHCaptchaLoad?: () => void;
  }
}

// Load the hCaptcha script once, however many times a token is needed.
let script: Promise<void> | null = null;
function loadScript() {
  script ??= new Promise<void>((resolve, reject) => {
    window.onHCaptchaLoad = resolve;
    const s = document.createElement('script');
    s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHCaptchaLoad&hl=th';
    s.async = true;
    s.onerror = () => {
      script = null;
      s.remove();
      reject(new Error('hCaptcha failed to load'));
    };
    document.head.append(s);
  });
  return script;
}

// Invisible hCaptcha: most people never see a challenge; a popup appears only when hCaptcha is unsure.
export async function getCaptchaToken(): Promise<string> {
  await loadScript();
  const el = document.createElement('div');
  document.body.append(el);
  const id = window.hcaptcha.render(el, { sitekey: PUBLIC_HCAPTCHA_SITE_KEY, size: 'invisible' });
  const { response } = await window.hcaptcha.execute(id, { async: true });
  return response;
}
