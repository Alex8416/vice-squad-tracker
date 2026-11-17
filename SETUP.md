# Vice Squad Tracker – Setup-Anleitung

Login: **nur Google**, abgesichert über eine **Gästeliste** in der Datenbank.
Reihenfolge: Supabase → Google → Supabase-Auth → Repo → Claude Code → GitHub Pages → Domain.

---

## 1. Supabase-Projekt anlegen

1. https://supabase.com → mit GitHub einloggen → **New project**
   - Name: `vice-squad-tracker`, Region: **Frankfurt (eu-central-1)**, Plan: **Free**
   - DB-Passwort generieren und im Passwortmanager speichern
2. Warten, bis das Projekt bereit ist (~2 Min.)
3. **Project Settings → API Keys / Data API** öffnen und notieren:
   - **Project URL**: `https://xxxx.supabase.co`
   - **Publishable key**: `sb_publishable_...` (bei älteren Projekten der `anon`-Key)
   - ⚠️ Den **Secret / service_role key** niemals ins Frontend oder Repo packen.

### Schema einspielen
4. In `supabase/schema.sql` im Abschnitt **GÄSTELISTE** die Gmail-Adressen der Crew eintragen (**klein geschrieben**)
5. **SQL Editor → New query** → kompletten Inhalt einfügen → **Run**

---

## 2. Google-Login einrichten (ca. 15 Min.)

1. https://console.cloud.google.com → oben **Projekt auswählen → Neues Projekt** → `Vice Squad Tracker`
2. Menü **Google Auth Platform** (bzw. „APIs & Dienste → OAuth-Zustimmungsbildschirm“) → **Get started**
   - **Branding**: App-Name `Vice Squad Tracker`, Support-E-Mail = deine, optional Logo
   - **Audience**: **External**
   - **Contact information**: deine Mail → Fertigstellen
3. **Audience → Test users**: Hier **dieselben Gmail-Adressen** wie in der Gästeliste eintragen.
   Im Status **Testing** können sich nur diese Konten überhaupt bei Google für deine App anmelden, das ist dein doppelter Boden.
   (Alternativ **Publish app**: Dann darf jedes Google-Konto zum Login, und nur die Supabase-Gästeliste filtert. Für die Standard-Scopes E-Mail und Profil braucht das keine Verifizierung.)
4. **Data Access**: Die Standard-Scopes `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` reichen, weitere brauchst du nicht.
5. **Clients → Create client**
   - Application type: **Web application**, Name: `Supabase`
   - **Authorized JavaScript origins**:
     - `https://alexeisner.de`
     - `http://localhost:5173`
   - **Authorized redirect URIs**:
     - `https://xxxx.supabase.co/auth/v1/callback` (die exakte URL zeigt dir Supabase beim Google-Provider an)
   - **Create** → **Client ID** und **Client Secret** kopieren

---

## 3. Supabase-Auth konfigurieren

1. **Authentication → Sign In / Providers → Google**
   - **Enable**, Client ID + Client Secret einfügen → Save
2. **Authentication → Sign In / Providers → Email**: **deaktivieren** (damit nur Google geht)
3. **Authentication → URL Configuration**
   - **Site URL**: `https://alexeisner.de`
   - **Redirect URLs**: `https://alexeisner.de/**` und `http://localhost:5173/**`
4. Nachdem sich alle angemeldet haben:
   **Sign In / Providers → Allow new users to sign up**: **aus**.
   Bestehende Accounts können sich weiter einloggen. Für neue Freunde schaltest du es kurz wieder ein.

### Neue Freunde hinzufügen
1. Supabase **Table Editor → allowed_emails** → Zeile mit der Gmail-Adresse (klein geschrieben)
2. Google Cloud **Audience → Test users** → dieselbe Adresse (nur nötig, solange die App im Testing-Modus ist)
3. Falls deaktiviert: „Allow new users to sign up“ kurz an, Freund loggt sich ein, wieder aus

### Was passiert bei Fremden?
- Im Testing-Modus blockt schon Google („Zugriff blockiert“).
- Kommen sie an Google vorbei, bricht der Datenbank-Trigger die Registrierung ab. Es wird kein Account angelegt, und sie landen mit `?error=...` wieder auf der Seite, die dann „Nicht auf der Gästeliste“ anzeigt.
- Ohne Login liefert die Datenbank keine Daten (RLS nur für `authenticated`).

> Hinweis: Im Google-Fenster steht „weiter zu xxxx.supabase.co“. Das ändert sich nur mit einer kostenpflichtigen Supabase Custom Domain und ist rein kosmetisch.
> Free-Projekte werden nach ca. 7 Tagen Inaktivität pausiert. Im Dashboard reaktivierst du das mit einem Klick.

---

## 4. Repo anlegen

```bash
mkdir vice-squad-tracker && cd vice-squad-tracker
git init
# CLAUDE.md, SETUP.md und supabase/schema.sql hier reinlegen
```

`.env.local` (steht in `.gitignore`, wird nicht committet):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
```

Auf GitHub ein Repo `vice-squad-tracker` anlegen und als Remote hinzufügen.

---

## 5. Mit Claude Code bauen

```bash
claude
```
Start-Prompt:
> Lies CLAUDE.md und bau die App nach dieser Spezifikation. Fang mit dem Projekt-Setup (Vite + React + TS) und dem Supabase-Client an, dann Google-Login, dann Dashboard.

Testen mit `npm run dev` → http://localhost:5173 (Port 5173 beibehalten, er ist bei Google und Supabase eingetragen)

---

## 6. GitHub Pages Deploy

1. Repo → **Settings → Secrets and variables → Actions → Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. **Settings → Pages → Source: GitHub Actions**
3. Push auf `main` → `.github/workflows/deploy.yml` deployt automatisch

---

## 7. Eigene Domain

Die App läuft direkt auf der Hauptdomain `alexeisner.de` (Apex-Domain). Alles, was dort bisher lief, wird damit ersetzt.

1. DNS bei deinem Domain-Anbieter: **alte A/AAAA-Einträge für `@` löschen**, dann:
   ```
   Typ    Name   Wert
   A      @      185.199.108.153
   A      @      185.199.109.153
   A      @      185.199.110.153
   A      @      185.199.111.153
   AAAA   @      2606:50c0:8000::153
   AAAA   @      2606:50c0:8001::153
   AAAA   @      2606:50c0:8002::153
   AAAA   @      2606:50c0:8003::153
   CNAME  www    <dein-github-username>.github.io
   ```
   (MX-Einträge für E-Mail auf der Domain **nicht** anfassen.)
2. Repo → **Settings → Pages → Custom domain**: `alexeisner.de` → Save
   (GitHub leitet `www.alexeisner.de` dann automatisch auf `alexeisner.de` um)
3. Wenn der DNS-Check grün ist: **Enforce HTTPS** anhaken (das Zertifikat kann bis zu ca. 1 h dauern)
4. Prüfen, ob die Domain bei **Google (JavaScript origins)** und **Supabase (URL Configuration)** eingetragen ist

Beim Deploy über Actions brauchst du **keine** `CNAME`-Datei im Repo.
