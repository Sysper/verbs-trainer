import DonateButtons from './DonateButtons';
import type { SupportActions } from '../hooks/useSupport';

/** The full support section: the bottom block on phones, the side column on desktop. */
export default function Donate({ copyPay, nequiPSE }: SupportActions) {
  return (
    <section className="donate">
      <div className="donateGlow" aria-hidden="true" />
      <div className="donateInner">
        <div className="donateHeart" aria-hidden="true">
          ☕
        </div>
        {/* Same wording as the floating button on phones, so the ask reads
            as one thing across the whole app. */}
        <h2 className="donateTitle">¿Me invitas un café?</h2>
        <p className="donateSub">
          Esta app es gratis y sin anuncios. Si te ayuda a aprender, cualquier aporte me anima a seguir
          mejorándola. 💙
        </p>
        <p className="donateSub donateSubEn">
          This app is free and ad-free. If it helps you learn, any contribution keeps me improving it. Thank you!
        </p>
        <DonateButtons copyPay={copyPay} nequiPSE={nequiPSE} />
      </div>
    </section>
  );
}
