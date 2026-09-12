/**
 * Clipboard that works even when the async API is blocked
 * (not focused, http://, older browsers).
 */
export function copyText(text: string): boolean {
  // Legacy path first — it is synchronous, so it still runs inside the click
  // gesture and does not care about document focus.
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS needs this
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) return true;
  } catch {
    /* fall through */
  }
  // Modern API as a backup
  try {
    void navigator.clipboard?.writeText(text);
    return true;
  } catch {
    return false;
  }
}
