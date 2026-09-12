import { useCallback, useState } from 'react';
import { CONFIG, NEQUI_URL } from '../config';
import { copyText } from '../lib/clipboard';

/**
 * Donation actions, held at page level so the Nequi instructions survive the
 * panel that launched them being closed — the number is needed twice on
 * Nequi's site, so the popup must outlive the button.
 */
export function useSupport(toast: (msg: string) => void) {
  const [nequiHelp, setNequiHelp] = useState<string | null>(null);

  const copyPay = useCallback(
    (name: string, value: string) => {
      const ok = copyText(value);
      const where =
        name === 'Bre-B' ? 'paste it in your bank app to send money' : `paste it in your ${name} app`;
      toast(ok ? `📋 ${value} copied — ${where}` : `${name}: ${value} — copy it manually`);
    },
    [toast],
  );

  const nequiPSE = useCallback(
    (number: string) => {
      // Copy FIRST: once the new tab takes focus, clipboard writes get rejected.
      const ok = copyText(number);
      setNequiHelp(number);
      toast(ok ? `📋 ${number} copied — paste it in BOTH number fields` : `Recharge this number: ${number}`);
      window.open(NEQUI_URL, '_blank');
    },
    [toast],
  );

  const hasAny = Boolean(CONFIG.kofi || CONFIG.nequi || CONFIG.breb);

  return { nequiHelp, closeNequiHelp: () => setNequiHelp(null), copyPay, nequiPSE, hasAny };
}

export type SupportActions = Pick<ReturnType<typeof useSupport>, 'copyPay' | 'nequiPSE'>;
