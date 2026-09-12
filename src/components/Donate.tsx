import { useState } from 'react';
import { CONFIG, NEQUI_URL } from '../config';
import { copyText } from '../lib/clipboard';

interface Props {
  toast: (msg: string) => void;
}

export default function Donate({ toast }: Props) {
  const [nequiHelp, setNequiHelp] = useState<string | null>(null);

  const copyPay = (name: string, value: string) => {
    const ok = copyText(value);
    const where = name === 'Bre-B' ? 'paste it in your bank app to send money' : `paste it in your ${name} app`;
    toast(ok ? `📋 ${value} copied — ${where}` : `${name}: ${value} — copy it manually`);
  };

  const nequiPSE = (number: string) => {
    // Copy FIRST: once the new tab takes focus, clipboard writes get rejected.
    const ok = copyText(number);
    setNequiHelp(number);
    toast(ok ? `📋 ${number} copied — paste it in BOTH number fields` : `Recharge this number: ${number}`);
    window.open(NEQUI_URL, '_blank');
  };

  const hasAny = Boolean(CONFIG.kofi || CONFIG.nequi || CONFIG.breb);
  if (!hasAny) return null;

  return (
    <>
      <section className="donate">
        <div className="donateGlow" aria-hidden="true" />
        <div className="donateInner">
          <div className="donateHeart" aria-hidden="true">
            ☕
          </div>
          <h2 className="donateTitle">Apóyame · Support me</h2>
          <p className="donateSub">
            Esta app es gratis y sin anuncios. Si te ayuda a aprender, cualquier aporte me anima a seguir
            mejorándola. 💙
          </p>
          <p className="donateSub donateSubEn">
            This app is free and ad-free. If it helps you learn, any contribution keeps me improving it. Thank you!
          </p>
          <div className="donateBtns">
            {CONFIG.kofi && (
              <a
                className="donoBtn kofi"
                href={`https://ko-fi.com/${encodeURIComponent(CONFIG.kofi)}`}
                target="_blank"
                rel="noopener"
              >
                <span className="dIco">☕</span>
                <span className="dTxt">
                  <b>Ko-fi</b>
                  <small>Con tarjeta · By card</small>
                </span>
                <span className="dGo">↗</span>
              </a>
            )}
            {CONFIG.nequi && (
              <button
                className="donoBtn"
                title="Copia el número y abre la página PSE de Nequi · Copies the number and opens Nequi's PSE page"
                onClick={() => nequiPSE(CONFIG.nequi)}
              >
                <span className="dIco">📱</span>
                <span className="dTxt">
                  <b>Nequi</b>
                  <small className="dNum">{CONFIG.nequi}</small>
                </span>
                <span className="dGo">PSE</span>
              </button>
            )}
            {CONFIG.breb && (
              <button
                className="donoBtn"
                title="Copia la llave Bre-B para pegarla en tu banco · Copies the Bre-B key to paste in your bank app"
                onClick={() => copyPay('Bre-B', CONFIG.breb)}
              >
                <span className="dIco">🔑</span>
                <span className="dTxt">
                  <b>Bre-B</b>
                  <small className="dNum">{CONFIG.breb}</small>
                </span>
                <span className="dGo">copiar</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* The toast disappears and the number is needed twice, so keep it on screen. */}
      {nequiHelp && (
        <div className="nequiHelp show">
          <button className="nqClose" aria-label="Close" onClick={() => setNequiHelp(null)}>
            ✕
          </button>
          <b>Recharging on Nequi</b>
          <div className="nqNum">
            <code title="Tap to select">{nequiHelp}</code>
            <button className="nqCopy" onClick={() => copyPay('Nequi', nequiHelp)}>
              copy again
            </button>
          </div>
          <ol>
            <li>
              Paste it in <b>Número de celular</b>
            </li>
            <li>
              Paste it again in <b>Confirma el número</b>
            </li>
            <li>Enter the amount, pick your bank, and pay with PSE</li>
          </ol>
          <span className="nqNote">
            The charge goes to your bank account; the money lands in that Nequi.
          </span>
        </div>
      )}
    </>
  );
}
