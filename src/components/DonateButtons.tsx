import { CONFIG } from '../config';
import type { SupportActions } from '../hooks/useSupport';

interface Props extends SupportActions {
  /** 'row' wraps side by side; 'column' stacks full-width, for narrow panels. */
  layout?: 'row' | 'column';
}

/** The three payment buttons, shared by the bottom section and the floating panel. */
export default function DonateButtons({ copyPay, nequiPSE, layout = 'row' }: Props) {
  return (
    <div className={`donateBtns ${layout === 'column' ? 'stacked' : ''}`}>
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
  );
}
