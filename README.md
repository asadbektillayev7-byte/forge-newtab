# Forge

A black new tab. One quote, one shape.

Every new tab gives you one of 273 quotes picked for guys 18–25, from Marcus Aurelius, Musashi and Dostoevsky to Goggins, Hormozi, Chris Williamson, Sam Altman and Elon Musk. Above it is a piece of white line art that draws itself in and fits what the quote is about. Nothing else. No accounts, no tracking, no network requests.

## The art

There are 24 generative pieces. Each quote has a theme (discipline, fear, falling, being seen, comparison, becoming, time, body, building), and the art is picked to fit it. The last few pieces you saw are skipped.

| Piece | What it says | Shows up with |
|---|---|---|
| **Days** | Every day of this year. The filled ones are gone. | time, discipline |
| **One percent** | 1.01³⁶⁵ = 37.8 vs 0.99³⁶⁵ = 0.03. | discipline, building, comparison |
| **Climb** | An endless staircase with uneven steps. | discipline, falling, body |
| **Focus** | Everything points at one thing. | building, fear, becoming |
| **Rhythm** | One line that loops forever but never repeats. | seen, time |
| **Stand** | The field bends with the wind. One doesn't. | comparison, fear, becoming |
| **Seven, eight** | It falls seven times, then stands up the eighth. | falling, fear |
| **Pulse** | Still here. Still in it. | seen, body, time |
| **Deeper** | An endless way in. | seen, becoming |
| **Path** | It was never going to be a straight line. | comparison, becoming, discipline |
| **Choices** | Every fork in the road. One path is yours. | becoming, fear, comparison |
| **Sand** | An hourglass runs out, then turns over. | time |
| **Drop by drop** | Water carves stone by showing up, not by force. | discipline, body, time |
| **Brick by brick** | A wall goes up one brick at a time. | building, discipline |
| **Broken places** | It cracks, and the cracks turn into the strongest lines. | falling, seen |
| **Again** | The boulder slips twice. The third time it goes over. | falling, discipline, body |
| **Lighthouse** | Somebody is looking for you. | seen, fear |
| **Not alone** | Scattered stars, slowly connected. | seen, becoming |
| **Your lane** | Everyone is running a different race. | comparison |
| **Leverage** | A small weight in the right place lifts a big one. | building |
| **Signal** | The noise stays. You stop following it. | building, becoming, seen |
| **Ripple** | One small act travels further than you think. | fear, becoming |
| **Roots** | What you see above ground is the small part. | becoming, time, building |
| **Build** | A structure built one block at a time. | building, discipline |

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

- **Add or remove quotes:** edit `src/js/quotes.js`. Each entry is `{ t: "text", a: "author" }`, and goes inside the section for its theme.
- **Add art:** add a piece to `src/js/art-more.js` and list its themes in `THEMES` at the bottom.
- **Preview without reloading the extension:** run `node scripts/serve.js` and open `http://localhost:4173/newtab.html`.
  - `?art=days` forces a specific piece.
  - `?t=6` freezes the frame at 6 seconds.
- **Icons:** run `python3 scripts/make_icons.py`.
- **Store zips:** run `python3 scripts/build.py`. This creates `dist/forge-chromium-*.zip` and `dist/forge-firefox-*.zip`.

## Why these quotes

See [docs/RESEARCH.md](docs/RESEARCH.md). In short, 2025 surveys found that most young men feel lonely, many think of themselves as failures, and 69% agree "no one cares if men are okay." The quotes are picked to answer that: hard, but on your side.
