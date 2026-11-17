# Vice Squad Tracker

Web-App, mit der eine Freundesgruppe (5–15 Leute) ihren GTA-6-Fortschritt pro Person trackt und vergleicht. Optik: Vice City / Leonida, Neon-Sunset im GTA-Stil, aber **ohne** offizielle Rockstar-/GTA-Logos, Schriftzüge oder Spielgrafiken. Eigenes Branding: „VICE SQUAD TRACKER“.

UI-Sprache: **Deutsch**.

## Stack
- **Vite + React + TypeScript**
- **Tailwind CSS** (v4 oder v3, Hauptsache ein sauberes Setup)
- **@supabase/supabase-js v2** für Auth, DB und Realtime
- **React Router mit `HashRouter`** (GitHub Pages kann kein SPA-Fallback; Hash-Routing vermeidet 404s bei Reload)
- Keine eigenen Server und keine Edge Functions. Alles läuft im Browser gegen Supabase mit RLS.
- Deploy: **GitHub Pages über GitHub Actions**

## Konfiguration
- Env-Variablen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (lokal in `.env.local`, im CI aus GitHub Actions **Variables** → `vars.*`)
- `.env.local` in `.gitignore`
- `vite.config.ts`: `base: '/'`, weil die App auf eigener (Sub-)Domain läuft
- Supabase-Client einmal in `src/lib/supabase.ts` erzeugen
- Die TypeScript-Typen für die DB in `src/lib/database.types.ts` von Hand passend zu `supabase/schema.sql` pflegen (oder via `npx supabase gen types`, falls die CLI eingerichtet ist)

## Datenbank
Das Schema steht in `supabase/schema.sql` und ist **bereits eingespielt**. Nicht ändern, ohne mich zu fragen. Tabellen:
- `allowed_emails`: Gästeliste, **vom Frontend nicht zugreifbar** (keine Policies). Nie im Frontend abfragen.
- `profiles`: id, username, avatar_color, avatar_url, crew_role
- `progress`: eine Zeile pro User, wird beim Signup per Trigger angelegt. Nur **UPDATE** der eigenen Zeile ist erlaubt.
- `progress_events`: Activity-Feed, eigene Events insert/delete
- `achievements`: Katalog, nur lesbar
- `user_achievements`: eigene Unlocks insert/delete
- View `leaderboard`: alles fürs Ranking in einer Abfrage

RLS: Eingeloggte User lesen alles und schreiben nur ihre eigenen Daten.
Realtime ist für `progress`, `progress_events` und `user_achievements` aktiv.

## Auth – nur Google
- **Einziger Login**: „Mit Google einloggen“ →
  `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- **Kein** E-Mail/Passwort-Formular, keine Registrieren-Seite. Der erste Google-Login legt den Account an.
- Supabase-Client mit Default-Einstellungen (`detectSessionInUrl: true`, `persistSession: true`). Wichtig bei `HashRouter`: Den Router erst rendern, wenn `supabase.auth.getSession()` fertig ist, damit der OAuth-Callback in der URL nicht vom Router verschluckt wird. Danach die URL mit `history.replaceState` aufräumen.
- **Gästeliste**: Registrierungen werden vom DB-Trigger abgelehnt, wenn die E-Mail nicht in `allowed_emails` steht. Supabase leitet dann mit `error` / `error_description` in Query oder Hash zurück. Diese Parameter beim Start auslesen. Wenn ein Fehler da ist (z. B. „Database error saving new user“ bzw. `NOT_ON_GUEST_LIST`), einen Screen im Stil von „ACCESS DENIED – Du stehst nicht auf der Gästeliste“ zeigen, mit dem Hinweis, sich bei Alex zu melden.
- Nicht eingeloggt → Login-Screen (großer Titel, Sunset, ein Google-Button). Eingeloggt → App.
- Session-Handling über `onAuthStateChange` in einem `AuthProvider`-Context; Logout-Button in der Nav
- `profiles.avatar_url` (Google-Profilbild) als Avatar anzeigen, Fallback: Initialen auf `avatar_color`

## Seiten / Features
1. **Crew-Übersicht (Startseite)**
   - Karte pro Spieler im Stil eines In-Game-Handys bzw. Charakter-Auswahl: Name, Farbe, Story-%-Balken, Geld, Missionen, Spielzeit, Status-Text, „zuletzt aktiv vor X“
   - Sortierbar nach Story %, Geld, Spielzeit, Achievement-Punkten
   - Live-Updates über Supabase Realtime (Karten aktualisieren sich ohne Reload, kurzer Neon-Glow-Effekt bei Änderung)
2. **Leaderboard**: Ranking-Tabelle aus dem View `leaderboard`, mit Platz 1–3 hervorgehoben (Gold/Silber/Bronze-Neon)
3. **Mein Fortschritt (Edit)**
   - Formular für alle `progress`-Felder; Schnell-Buttons wie „+1 Mission“, „+1 Wasted“, „+1 Busted“
   - Wanted-Level als 5 klickbare Sterne
   - Beim Speichern automatisch ein `progress_events`-Eintrag bei relevanten Sprüngen (neue Mission, Story-Meilenstein bei 25/50/75/100 %, Geld über 1 Mio.)
4. **Activity Feed**: chronologischer Feed aller Events, live, Stil wie eine In-Game-Benachrichtigung bzw. Social-Media-Feed
5. **Achievements**: Katalog als Grid, eigene Unlocks per Klick an/aus, sichtbar wer was hat (kleine Avatare)
6. **Profil**: Username, Avatar-Farbe (Preset-Palette), Crew-Rolle (Freitext, z. B. „Fahrer“, „Hacker“)

## Design-Richtung
- Farben: tiefes Nachtblau/Violett als Hintergrund (`#0b0420` → `#1a0b3d`), Neon-Pink `#ff2e88`, Sunset-Orange `#ff8a3d`, Türkis `#00e5d4`, Gelb `#ffd23f`
- Hintergrund: Sunset-Gradient mit Palmen-Silhouetten (eigenes SVG), dezente Scanlines oder Grain
- Fonts (Google Fonts): Überschriften in einer kräftigen, kondensierten Display-Schrift (z. B. „Anton“ oder „Bebas Neue“), schräg gestellt und mit Neon-Text-Shadow; Fließtext in „Inter“ oder „Rubik“
- Karten: Glassmorphism, leichte Schräge/Skew bei Headern, harte Schlagschatten in Pink/Türkis
- Toasts im Stil von „MISSION PASSED“ und „WASTED“, aber mit eigenem Text. Keine Original-Assets.
- Mobile-first, damit man es beim Zocken auf dem Handy aktualisieren kann
- Respektiere `prefers-reduced-motion`

## Projektstruktur (Vorschlag)
```
src/
  lib/supabase.ts, database.types.ts, format.ts (Geld, relative Zeit)
  context/AuthProvider.tsx
  hooks/useCrew.ts, useRealtime.ts, useMyProgress.ts
  pages/Login.tsx, Crew.tsx, Leaderboard.tsx, MyProgress.tsx, Feed.tsx, Achievements.tsx, Profile.tsx
  components/ (PlayerCard, ProgressBar, WantedStars, NeonToast, Nav, ...)
.github/workflows/deploy.yml
```

## Deploy-Workflow
`.github/workflows/deploy.yml`:
- Trigger: push auf `main` + `workflow_dispatch`
- Node 20, `npm ci`, `npm run build` mit `env: VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}` usw.
- `actions/upload-pages-artifact` (Ordner `dist`) + `actions/deploy-pages`
- Permissions: `pages: write`, `id-token: write`

## Regeln
- Niemals einen Supabase Secret/service_role Key verwenden oder committen
- Fehler von Supabase immer abfangen und als Toast anzeigen
- Vor jedem Commit muss `npm run build` ohne TypeScript-Fehler durchlaufen
