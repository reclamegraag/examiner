# Examiner

Leer woordjes met slimme herhaling. Een offline-first PWA voor het oefenen van vocabulaire met spaced repetition.

## Features

- **Woordensets beheren** — Maak sets aan met woordparen in 9 talen (NL, EN, DE, FR, ES, IT, PT, EL, LA)
- **4 oefenmodi** — Flashcards, typen, meerkeuze en quick mode
- **Spaced repetition (SM-2)** — Automatische herhaalplanning op basis van je prestaties
- **OCR** — Scan woordjes uit foto's of uploads via Tesseract.js
- **AI-generatie** — Genereer woordensets op basis van thema via Google Gemini API
- **Delen via URL** — Deel sets met anderen via gecomprimeerde links (lz-string)
- **Uitspraak** — Luister naar de uitspraak via Web Speech API
- **Statistieken** — Volg je voortgang per woord en per sessie
- **Offline & installeerbaar** — Alle data lokaal in IndexedDB, installeerbaar als app

## Aan de slag

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Scripts

| Commando | Beschrijving |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Productie-build |
| `npm start` | Start productieserver |
| `npm test` | Draai tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | Lint check |

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Dexie (IndexedDB) · Framer Motion · Tesseract.js · Vitest

## Gemini API (optioneel)

Voor AI-generatie en verbeterde OCR kun je een Google Gemini API-key instellen via de instellingenpagina in de app. Dit is volledig optioneel — alle kernfunctionaliteit werkt zonder.

## Deploy

Deployen kan via [Vercel](https://vercel.com) of elk ander platform dat Next.js ondersteunt.
