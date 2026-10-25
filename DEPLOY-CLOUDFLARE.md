# Pubblicazione di Aula Sostituzioni su Cloudflare Pages

## Impostazioni di build
- Framework preset: **Vite** (oppure None)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: lasciare vuota

## Metodo consigliato: collegamento a Git
1. Crea un account su GitHub e un repository nuovo, per esempio `aula-sostituzioni`.
2. Estrai questo ZIP sul computer e carica nel repository tutti i file e le cartelle del progetto (incluso `package.json`; non caricare `node_modules` se presente).
3. Apri Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
4. Collega il repository, scegli le impostazioni sopra e avvia il deploy.
5. Cloudflare assegnerà un indirizzo `*.pages.dev`.

## Alternativa: caricamento diretto
Cloudflare Pages supporta anche il caricamento diretto di una cartella di build. In questo caso esegui prima `npm install` e `npm run build` sul computer, poi carica la cartella `dist` con il metodo di upload disponibile nel pannello Pages.

Il file `public/_redirects` viene copiato nella build e consente al routing client-side di React di funzionare anche quando si ricaricano pagine interne.

## Nota sui dati
L'hosting pubblica i file dell'app, ma non sincronizza automaticamente i dati tra dispositivi. Nel progetto attuale i dati locali del browser restano legati al browser/dispositivo utilizzato. Per condivisione tra più utenti serve configurare un backend/database, ad esempio Supabase, con le relative credenziali e regole di accesso.
