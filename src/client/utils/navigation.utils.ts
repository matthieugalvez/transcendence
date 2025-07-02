import { router } from '../configs/simplerouter';

declare global {
  interface Window { __navigatedAlready?: boolean }
}

export function safeNavigate(path: string) {
  if (window.__navigatedAlready) return; // déjà redirigé = on ignore
  window.__navigatedAlready = true;
  router.navigate(path);
}
