# FindYourPeople

A mobile-first website, built at a hackathon, that helps new students find societies, events, courses and careers support, so nobody has to do uni alone.

> Built by a team of students in one day at a Leeds Beckett University AI hackathon (23 Nov 2026), with help from Claude (Anthropic). Published by a team member.

> **Unofficial student project.** It is not affiliated with or endorsed by Leeds Beckett University (LBU) or Leeds Beckett Students' Union, and it uses no LBU or Students' Union logos or photos.

## How to run it

The page loads `data.json` with `fetch()`, which browsers block when you open the page from a `file://` address. You need to serve the folder:

- **VS Code:** install **Live Server**, open this folder, then click **Go Live** (or right-click `index.html` and choose **Open with Live Server**).
- **No VS Code:** run `python3 -m http.server` in this folder and go to <http://localhost:8000>.

## Pages

| Route | What it shows |
|-------|---------------|
| `#/` | **Home**: hero, quick links, interest buttons, the next 3 events, and a "Follow LBU" section with the social media links |
| `#/societies` | Society finder with search and filters for interest (Sport, Music, Arts, Academic, Culture, Volunteering), campus and day, plus events (past ones are marked "Past") |
| `#/societies/Music` | The same finder with an interest already selected (used by the interest buttons on Home) |
| `#/society/<id>` | Society detail: meeting times, events and related courses |
| `#/courses` | Courses and careers finder. Search by course, skill or **job title** (e.g. "police"), or filter by subject |
| `#/course/<id>` | Course detail: degree award, what you'll learn, skills, typical jobs, related societies and a link to the official LBU subject page |
| `#/careers` | Beckett Careers: CVs, cover letters, placements and jobs, how to book, and links to **MyHub** |

## Files

| File | Purpose |
|------|---------|
| `index.html` | All the views (only one is visible at a time) |
| `styles.css` | Bold, friendly purple, black and white theme using system fonts only. All colours are theme variables, so light, dark and high-contrast modes just swap the values. All text meets WCAG AA contrast |
| `display.js` | Dark mode and accessibility settings. It loads in `<head>` so the saved theme applies before the page appears, with no flash of the wrong colours |
| `script.js` | Loads the data, runs the filters, renders the pages and handles routing and focus |
| `data.json` | 14 made-up societies, 9 made-up events and 12 courses |

## Data: what's real and what's made up

| Content | Status |
|---------|--------|
| Societies, events and contact emails | **Made up** (all contact emails use `example.com`) |
| Social media links | **Real LBU accounts**, copied from the footer of leedsbeckett.ac.uk in Nov 2026: Instagram, Facebook, X and YouTube. We didn't find LinkedIn or TikTok there, so they're left out |
| MyHub, Beckett Careers and placements links | **Real LBU pages** (checked Nov 2026). The MyHub link goes to its login page |
| Course titles and awards | Based on **LBU's published subject pages** (Nov 2026). Each one links to its official subject page, not a guessed course URL |
| "What you'll learn", skills and jobs | **General examples** for each subject (similar to careers sites like Prospects). These are *not* official module lists or guaranteed outcomes, and the site says so |

External links and course titles were correct in November 2026 but may change. The LBU website is always the official source.

**Note:** the sample events run from 23 Nov to 9 Dec 2026. Events whose date has passed still show, marked **Past**, listed after any upcoming ones, so the demo keeps working.

## Display and accessibility settings

The header has a **Dark mode** switch and an **Accessibility** button that opens a settings panel. The footer has the same link.

| Setting | What it does | Helps with |
|---------|--------------|------------|
| Theme: Match my device / Light / Dark | Follows the device setting by default and updates live if the device changes | Light sensitivity, eye strain, reading at night |
| Text size: Default / Large / Extra large | Scales all text to 112.5% or 125%. At large sizes, grids use fewer columns and the menu wraps rather than hiding items | Low vision |
| High contrast | Pure black and white, thicker 3px outlines and focus rings, underlined links, no glow effects | Low vision, colour-vision deficiency |
| Easy-read text | Verdana or Tahoma font, extra letter, word and line spacing (WCAG 1.4.12), no capitals-only labels, line length capped at 70 characters | Dyslexia, low vision, cognitive load |
| Reduce motion | Turns off animations and hover movement | Vestibular disorders, distraction |

- High contrast and reduce motion **switch on automatically** when the device asks for them (`prefers-contrast: more` and `prefers-reduced-motion`).
- The panel is a native `<dialog>`: it keeps keyboard focus inside, closes with Esc, and returns focus to the button that opened it. Toggles are real checkboxes marked as switches (`role="switch"`) and also show "On" or "Off" as text. A live region tells screen readers when the theme changes.
- Windows High Contrast (forced colours) mode is supported too.

## Accessibility features

- Skip link, landmarks, headings in order and one `<h1>` per view
- Native form controls, each with a visible label. The interest chips are real radio buttons
- Tap targets of at least 44px and a focus ring (white and purple) that shows up on white, purple and black backgrounds
- Live regions announce the number of results, with a short delay so they don't interrupt typing
- When the page changes, focus moves to the new heading. Going back returns focus to the card you opened
- External links say "(opens in a new tab)" to screen readers
- Support for reduced motion and forced-colours (high contrast) modes

## AI-use statement

This project was built with AI help. We used Claude (Anthropic), through Claude Code in VS Code, to draft the plan, the code, the sample data and the README. The team wrote the brief, chose the features and design, and reviewed and tested the results.

- No personal or real student data was given to the AI.
- The course and careers information is general guidance. It is not official LBU content, so check the linked LBU subject pages for accurate details.
- See [AI_LOG.md](AI_LOG.md) for a change-by-change record of what the AI did and what the team did.

## Privacy and compliance notes

The current version sets **no cookies** and loads **no third-party scripts, fonts or embeds**.

**Display settings (localStorage):** when someone changes a display or accessibility setting, their choice is saved in their own browser under the key `fyp-display`. Nothing is saved unless they change something, the entry is deleted if they reset to default, and it is never sent anywhere. We think this falls under PECR's "strictly necessary" exemption for interface settings the user explicitly chooses, so no consent banner should be needed. The footer and the settings panel both explain it. This is our reading of the rules, not legal advice.

External links to social media and MyHub take people to those sites, which have their own cookie and privacy policies. The footer says this.

### If the project grows

These features would bring in extra requirements under UK GDPR, the Data Protection Act 2018 and PECR:

| Feature | What it would need |
|---------|--------------------|
| Saving favourites or filters (localStorage or cookies) | Same reasoning as the display settings: fine if the user explicitly asks for it, but say so clearly. Anything used for tracking or profiling needs **consent** |
| Analytics | **Cookie consent banner** before anything loads, plus a **privacy notice** |
| **Embedded** Instagram, X, YouTube or Facebook feeds, or Google Maps | These set third-party cookies, so they need **consent**. Keep using plain links, or click-to-load placeholders |
| Google Fonts or other CDNs | They send visitors' IP addresses to a third party. **Self-host** the font files or mention them in the privacy notice |
| Sign-up, "I'm interested" or contact forms | Personal data, so it needs a **privacy notice**, a lawful basis, a retention period and secure storage |
| Booking careers appointments *on this site* | Avoid this. Keep linking to the official MyHub, which handles students' data under LBU's own privacy policy |
| Real society contacts or committee names | Personal data, so get **permission** from the people named. Prefer role-based addresses |
| Using LBU's name, logo or branding more prominently | Needs **permission from LBU**. Keep the "unofficial" disclaimer |
| Sensitive interests (faith, LGBTQ+, health) linked to a person | **Special category data** under UK GDPR, which needs extra care |
