export const ADSTERRA_SMARTLINK_URL =
  'https://www.profitableratecpmnetwork.com/zepyk3kzy?key=b88e21c08441dec7aa791cb01d7a6ead';

/**
 * Safely opens the Adsterra Smartlink in a new window/tab
 */
export function openAdsterraSmartlink(): Window | null {
  try {
    const win = window.open(ADSTERRA_SMARTLINK_URL, '_blank', 'noopener,noreferrer');
    if (win) {
      win.focus();
    }
    return win;
  } catch (e) {
    console.warn('Popup blocked or failed to open Adsterra smartlink:', e);
    return null;
  }
}
