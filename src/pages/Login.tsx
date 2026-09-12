import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, validateEmail, validatePassword } from '../lib/auth';
import { useTheme } from '../hooks/useTheme';

/**
 * Reachable only by typing /login — nothing on the home page links here.
 * See `src/lib/auth.ts`: this signs nobody in for real yet.
 */
export default function Login() {
  const navigate = useNavigate();
  useTheme(); // keeps the saved light/dark choice on this page too

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr || passErr) {
      setErrors({ email: emailErr ?? undefined, password: passErr ?? undefined });
      return;
    }

    setErrors({});
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <h1>Iniciar sesión</h1>
        <p className="sub">Verbs Trainer</p>

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              autoFocus
            />
            {errors.email && <span className="fieldErr">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              placeholder="••••••"
            />
            {errors.password && <span className="fieldErr">{errors.password}</span>}
          </div>

          {errors.form && <span className="fieldErr">{errors.form}</span>}

          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="loginNote">
          ⚠️ <b>Todavía no hay backend.</b> Este formulario valida el correo y la contraseña y guarda la
          sesión en este navegador, pero no autentica a nadie: cualquier correo válido entra. No protejas
          nada con esto hasta que exista la API.
        </p>

        <Link className="loginBack" to="/">
          ← Volver a la app
        </Link>
      </div>
    </div>
  );
}
