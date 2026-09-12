import { useEffect, useRef, useState } from 'react';
import DonateButtons from './DonateButtons';
import type { SupportActions } from '../hooks/useSupport';

/**
 * Floating "¿Me invitas un café?" button. It only exists below the desktop
 * breakpoint, where the support column collapses to the bottom of the page and
 * gets lost. Translucent at rest so it never competes with the exercise, solid
 * as soon as it is touched, and it opens a sheet with the payment details.
 */
export default function SupportFab({ copyPay, nequiPSE }: SupportActions) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, and focus goes back to the button that opened the sheet.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  return (
    <>
      <button
        ref={fabRef}
        className={`coffeeFab ${open ? 'isOpen' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="cfIco" aria-hidden="true">
          ☕
        </span>
        <span className="cfTxt">¿Me invitas un café?</span>
      </button>

      {open && (
        <>
          <div className="coffeeBackdrop" onClick={() => setOpen(false)} />
          <div className="coffeeSheet" role="dialog" aria-modal="true" aria-labelledby="coffeeTitle">
            <button ref={closeRef} className="csClose" aria-label="Cerrar" onClick={() => setOpen(false)}>
              ✕
            </button>
            <div className="csHeart" aria-hidden="true">
              ☕
            </div>
            <h2 id="coffeeTitle" className="csTitle">
              ¿Me invitas un café?
            </h2>
            <p className="csSub">
              La app es gratis y sin anuncios. Cualquier aporte me anima a seguir mejorándola. 💙
            </p>
            <DonateButtons copyPay={copyPay} nequiPSE={nequiPSE} layout="column" />
            <p className="csNote">Sin presión — se cierra tocando fuera.</p>
          </div>
        </>
      )}
    </>
  );
}
