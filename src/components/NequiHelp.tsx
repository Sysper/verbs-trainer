import type { SupportActions } from '../hooks/useSupport';

interface Props extends Pick<SupportActions, 'copyPay'> {
  number: string;
  onClose: () => void;
}

/** The toast disappears and the number is needed twice, so keep it on screen. */
export default function NequiHelp({ number, onClose, copyPay }: Props) {
  return (
    <div className="nequiHelp show">
      <button className="nqClose" aria-label="Close" onClick={onClose}>
        ✕
      </button>
      <b>Recharging on Nequi</b>
      <div className="nqNum">
        <code title="Tap to select">{number}</code>
        <button className="nqCopy" onClick={() => copyPay('Nequi', number)}>
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
      <span className="nqNote">The charge goes to your bank account; the money lands in that Nequi.</span>
    </div>
  );
}
