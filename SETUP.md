# SETUP – API-nøgler og integrationer

Denne guide forklarer trin for trin hvordan du henter adgang til hver tjeneste
og gemmer nøglerne sikkert i dit dashboard.

---

## Hvad er en API-nøgle?

En API-nøgle er en slags adgangskode der giver dit dashboard lov til at hente
data fra en tjeneste (fx Monday eller LinkedIn) på dine vegne. Den skal behandles
som et kodeord – del den aldrig med andre og commit den aldrig til GitHub.

## Hvad er en .env.local-fil?

`.env.local` er en fil der ligger i rodmappen af projektet. Den er ikke synlig
for andre og indeholder alle dine hemmelige nøgler. Next.js læser automatisk
denne fil når dashboardet starter.

**Sådan opretter du filen:**

1. Åbn din terminal
2. Navigér til projektmappen:
   ```
   cd /Users/mathilde/Desktop/Saphe/Claude/Dashboard/saphe-dashboard
   ```
3. Kopiér skabelonen:
   ```
   cp .env.local.example .env.local
   ```
4. Åbn `.env.local` i en teksteditor og udfyld dine nøgler

---

## Integrationer

### 1. Anthropic API (Claude chatbot og idéudvikling)

**Hvad det bruges til:** Chatbot-fanen og Idéudvikling

1. Gå til **console.anthropic.com** og log ind (eller opret konto)
2. Klik på **"API Keys"** i venstre menu
3. Klik **"Create Key"**, giv den et navn (fx "Saphe Dashboard")
4. Kopiér nøglen – den vises kun én gang!
5. Indsæt i `.env.local`:
   ```
   ANTHROPIC_API_KEY=din-nøgle-her
   ```

---

### 2. Monday.com

**Hvad det bruges til:** Hente dine opgaver til "Min arbejdsdag"

1. Log ind på **monday.com**
2. Klik på dit profilbillede øverst til venstre → **"Developers"**
3. Klik på **"My Access Tokens"** → **"Show"**
4. Kopiér token'et
5. Indsæt i `.env.local`:
   ```
   MONDAY_API_KEY=din-token-her
   ```

---

### 3. Microsoft 365 (Outlook kalender + mails + Teams)

**Hvad det bruges til:** Kalender, mails og Teams-beskeder

Dette kræver lidt mere opsætning via Azure (Microsofts udviklingsplatform):

1. Gå til **portal.azure.com** og log ind med din Saphe Microsoft-konto
2. Søg efter **"App registrations"** i søgefeltet øverst
3. Klik **"New registration"**
   - Navn: "Saphe Dashboard"
   - Account type: "Accounts in this organizational directory only"
   - Klik **"Register"**
4. Kopiér **"Application (client) ID"** – det er dit Client ID
5. Kopiér **"Directory (tenant) ID"** – det er dit Tenant ID
6. Klik på **"Certificates & secrets"** → **"New client secret"**
   - Beskrivelse: "Dashboard"
   - Udløb: 24 måneder
   - Klik **"Add"**
   - Kopiér **Value** med det samme (vises kun én gang!)
7. Klik på **"API permissions"** → **"Add a permission"** → **"Microsoft Graph"**
   - Vælg **"Delegated permissions"**
   - Tilføj: `Calendars.Read`, `Mail.Read`, `Chat.Read`
   - Klik **"Grant admin consent"** (kræver din IT-afdeling hvis du ikke er admin)
8. Indsæt i `.env.local`:
   ```
   MICROSOFT_CLIENT_ID=dit-client-id
   MICROSOFT_CLIENT_SECRET=din-client-secret
   MICROSOFT_TENANT_ID=dit-tenant-id
   ```

> **Tip:** Kontakt evt. Saphes IT-afdeling for hjælp til Azure-opsætningen.

---

### 4. LinkedIn Marketing API

**Hvad det bruges til:** Saphes LinkedIn side-statistik

LinkedIn Marketing API kræver en godkendt partner-applikation:

1. Gå til **linkedin.com/developers** og log ind
2. Klik **"Create app"**
   - App name: "Saphe Dashboard"
   - LinkedIn Page: vælg Saphes virksomhedsside
   - App Logo: upload Saphe-logo
3. Ansøg om **"Marketing Developer Platform"** adgang
   - Dette kræver godkendelse fra LinkedIn (kan tage 1-2 uger)
4. Når godkendt, kopiér **Client ID** og **Client Secret**
5. Indsæt i `.env.local`:
   ```
   LINKEDIN_CLIENT_ID=dit-client-id
   LINKEDIN_CLIENT_SECRET=din-client-secret
   ```

> **Alternativ:** Vi kan starte med manuelt at indsætte statistik i en JSON-fil
> og tilføje live-integration senere.

---

### 5. Meta (Facebook + Instagram)

**Hvad det bruges til:** Saphes Facebook og Instagram side-statistik

1. Gå til **developers.facebook.com** og log ind
2. Klik **"My Apps"** → **"Create App"**
   - Type: "Business"
   - App name: "Saphe Dashboard"
3. Tilføj produktet **"Facebook Login"** og **"Instagram Graph API"**
4. Gå til **"App Settings" → "Basic"** og kopiér:
   - App ID
   - App Secret
5. Du skal generere et **Page Access Token** for Saphes side:
   - Brug **Graph API Explorer** på developers.facebook.com
   - Vælg din app og Saphes side
   - Bed om permissions: `pages_read_engagement`, `instagram_basic`, `instagram_manage_insights`
6. Indsæt i `.env.local`:
   ```
   META_APP_ID=dit-app-id
   META_APP_SECRET=din-app-secret
   META_PAGE_ACCESS_TOKEN=dit-page-access-token
   ```

---

## Skabelon til .env.local

Opret denne fil i `saphe-dashboard/` mappen og udfyld dine nøgler:

```
# Anthropic (Claude AI)
ANTHROPIC_API_KEY=

# Monday.com
MONDAY_API_KEY=

# Microsoft 365
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Meta (Facebook + Instagram)
META_APP_ID=
META_APP_SECRET=
META_PAGE_ACCESS_TOKEN=
```

---

## Sikkerhedstjekliste

- [ ] `.env.local` er aldrig committed til Git (den er automatisk i `.gitignore`)
- [ ] API-nøgler er ikke delt med kolleger via mail eller chat
- [ ] Nøgler roteres (skiftes ud) mindst én gang om året
