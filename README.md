# Forge

A black new tab. One quote, one shape.

Every new tab gives you a quote picked for guys 18–25: discipline, fear, failure, loneliness, feeling behind, purpose, time. Above it is a piece of white line art that draws itself in. Nothing else. No accounts, no tracking, no network requests.

## The art

There are 11 generative pieces. They're picked at random, and you never get the same one twice in a row:

| # | Piece | What it says |
|---|---|---|
| 01 | **Days** | Every day of this year as a dot. The filled ones are already gone. |
| 02 | **One percent** | 1.01³⁶⁵ = 37.8 vs 0.99³⁶⁵ = 0.03. Same start, different man. |
| 03 | **Climb** | An endless staircase with uneven steps. Keep going. |
| 04 | **Focus** | Everything points at one thing. |
| 05 | **Rhythm** | One line that loops forever but never draws the same day twice. |
| 06 | **Stand** | A whole field bends with the wind. One line doesn't. |
| 07 | **Seven, eight** | It falls seven times, then stands up the eighth. |
| 08 | **Pulse** | Still here. Still in it. |
| 09 | **Deeper** | An endless way in. |
| 10 | **Path** | It was never going to be a straight line. |
| 11 | **Choices** | Every fork in the road. One path is yours. |

## Install

### Brave, Chrome, Edge, Arc, Vivaldi
1. Open `brave://extensions` (or `chrome://extensions`, `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `src` folder.
4. Open a new tab. If the browser asks whether to keep the changed new tab page, choose **Keep it**.

### Firefox
- **Quick test:** go to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and pick `src/manifest.json`. It stays until Firefox restarts.
- **Permanent:** run `python3 scripts/build.py` and upload `dist/forge-firefox-*.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). You can submit it unlisted if it's only for you.

### Safari
Convert it with Xcode: `xcrun safari-web-extension-converter src`.

## Use

- Open a new tab. That's it.
- To skip to the next quote and art, click the page first (the address bar has focus), then press **N**, **→** or **Space**.
- You'll see every quote once before any of them repeat.

## Make it yours

- **Add or remove quotes:** edit `src/js/quotes.js`. Each entry is `{ t: "text", a: "author" }`.
- **Preview without reloading the extension:** run `node scripts/serve.js` and open `http://localhost:4173/newtab.html`.
  - `?art=days` forces a specific piece.
  - `?t=6` freezes the frame at 6 seconds.
- **Icons:** run `python3 scripts/make_icons.py`.
- **Store zips:** run `python3 scripts/build.py`. This creates `dist/forge-chromium-*.zip` and `dist/forge-firefox-*.zip`.

## Why these quotes

See [docs/RESEARCH.md](docs/RESEARCH.md). In short, 2025 surveys found that most young men feel lonely, many think of themselves as failures, and 69% agree "no one cares if men are okay." The quotes are picked to answer that: hard, but on your side.
