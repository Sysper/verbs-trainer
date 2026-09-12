# Verbs Trainer

Práctica de verbos irregulares y regulares en inglés, con fonética para
hispanohablantes y audio. React + TypeScript + Vite, sin backend.

🔗 https://sysper.github.io/verbs-trainer/

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # compila a dist/
npm run preview    # sirve dist/ localmente
npm run typecheck  # solo TypeScript
```

## Estructura

```
index.html              Entrada de Vite (+ beacon de Cloudflare Analytics)
public/                 Se copia tal cual a dist/
  404.html              Fallback SPA de GitHub Pages (ver más abajo)
src/
  main.tsx              Punto de entrada y router
  App.tsx               Rutas: / y /login
  config.ts             ⚙️ Usuarios de GitHub y datos de donación
  types.ts              Tipos compartidos
  data/verbs.json       Los 138 verbos (94 irregulares, 44 regulares)
  lib/
    verbs.ts            Carga de datos, filtros, barajado, comparación
    storage.ts          localStorage: progreso, tema, sesión
    auth.ts             ⚠️ Login provisional, sin backend
    translate.ts        Diccionarios y detección de idioma
    speech.ts           Síntesis de voz
    clipboard.ts        Copiado con respaldo para navegadores viejos
  hooks/                useProgress, useTheme, useSession, useToast
  components/           Practice, VerbsTable, Translator, ProgressPanel, …
  pages/                Home, Login
```

## Progreso guardado

Todo el progreso vive en `localStorage` de cada navegador: aciertos, fallos,
racha actual, mejor racha, estadísticas por verbo y el tema elegido. **No se
envía a ningún lado y no sigue al usuario a otro dispositivo** — eso requiere
cuentas reales y un backend.

El panel de estadísticas (chip "best 🏅" en la pestaña Practice) muestra
precisión, verbos dominados y la lista de verbos fallados, y permite practicar
solo esos.

## Login

`/login` existe pero **no está enlazada desde ninguna parte**: se llega
escribiendo la URL. Valida el formulario, guarda una sesión en `localStorage`
y redirige a la home.

⚠️ **No autentica a nadie.** Cualquier correo con formato válido y 6 caracteres
de contraseña entra, y la sesión se puede falsificar desde la consola. Es la
carcasa de UI para cuando exista la API: entonces solo cambia `src/lib/auth.ts`.

## Despliegue

`.github/workflows/deploy.yml` compila y publica `dist/` en cada push a `main`.

> **Paso obligatorio una sola vez:** Settings → Pages → *Build and deployment* →
> Source = **GitHub Actions**. Mientras siga en "Deploy from a branch", el
> workflow corre pero el sitio sigue sirviendo los archivos viejos.

GitHub Pages no tiene enrutado de servidor, así que entrar directo a
`/verbs-trainer/login` devuelve un 404. `public/404.html` codifica la ruta en
la query y rebota a `index.html`, donde un script en el `<head>` restaura la
URL antes de que arranque React Router (técnica de `rafgraph/spa-github-pages`).
Si algún día se añade otra ruta, no hay que tocar nada de esto.
