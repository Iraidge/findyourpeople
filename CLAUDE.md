# LBU Societies & Events Finder

## What this project is
A website built at a one-day Leeds Beckett University (LBU) AI hackathon. It helps LBU students find societies, clubs and campus events that match their interests, so new students can find their people and feel less isolated.

- **Users:** LBU students, mostly first-years, mostly on their phones between lectures.
- **Campuses:** City and Headingley.
- **Time limit:** about one day. Favour simple, working features over clever ones.

## Tech stack
- Plain HTML, CSS and JavaScript only.
- No frameworks, no build tools, no npm packages, no backend, no login.
- The site must work by opening `index.html` in a browser. If `fetch` is blocked when opening the file directly, tell me to run `npx serve` or use the VS Code Live Server extension.

## File structure
```
index.html    page structure
styles.css    all styling
script.js     all behaviour (search, filters, rendering)
data.json     societies and events (sample data only)
CLAUDE.md     this file
```
Keep data in `data.json`, never hard-coded in HTML or JS, so real data can be swapped in later.

## Data shape
```json
{
  "meta": { "note": "", "updated": "2026-11-23" },
  "societies": [
    { "id": "night-owls-running", "name": "", "interest": "Sport | Music | Arts | Academic | Culture | Volunteering",
      "campus": "City | Headingley | Both", "day": "Monday", "time": "18:30", "location": "",
      "summary": "", "description": "", "tags": [""], "contact": "name@example.com" }
  ],
  "events": [
    { "id": "ev-welcome-run", "title": "", "societyId": "night-owls-running", "date": "2026-11-23", "time": "18:30",
      "campus": "Headingley", "location": "", "description": "" }
  ],
  "coursesNote": "",
  "courses": [
    { "id": "software-engineering", "title": "", "award": "BSc (Hons)", "subject": "", "subjectUrl": "",
      "summary": "", "learn": [""], "skills": [""], "careers": [""], "relatedSocieties": ["society-id"] }
  ]
}
```
If you change this shape, update this section.

## Features (in priority order)
1. Society cards with search and filters (interest, campus, day of the week).
2. "Upcoming events" list, sorted by date.
3. Society detail view with its upcoming events.
4. Nice-to-haves only if time allows: save favourites (localStorage, wrapped in try/catch), share link, dark mode.

## Coding conventions
- Mobile-first CSS. Design for about 375px wide, then add breakpoints for larger screens.
- Use CSS custom properties for colours and spacing at the top of `styles.css`.
- Semantic HTML: `header`, `main`, `nav`, `section`, `button` (not clickable `div`s).
- Small, named functions in `script.js`. Short comments only where the logic isn't obvious.
- No inline styles or inline `onclick` handlers.

## Accessibility (must pass)
- Colour contrast at least WCAG AA (4.5:1 for body text).
- Tap targets at least 44×44px.
- Everything works with a keyboard, with a visible focus outline.
- Form inputs have labels. Images (if any) have alt text.
- Announce filter result counts with an `aria-live` region.

## Compliance rules
- **Sample data only.** Never use real student names, emails or other personal data.
- **No real branding.** Don't use LBU or Students' Union logos, photos or real society names.
- **No tracking.** No analytics, cookies or third-party scripts. If a feature would need a privacy notice or cookie consent, flag it before building.
- **AI use:** we must be able to say where AI helped. Keep a short log in `AI_LOG.md` (one line per major change).

## How to work with me
- **Plan before big changes.** For anything touching more than one file, give a short plan first and wait for my OK.
- **One change at a time.** Make the smallest change that does the job. Don't refactor or restyle unrelated code.
- **Be brief.** Short replies, no long explanations unless I ask. After a change, list the files you edited and how to check it in one or two lines.
- **Ask if unsure.** Up to 3 questions rather than guessing.
- **Check your work.** After editing, re-read the changed code for errors and make sure `data.json` is still valid JSON.
