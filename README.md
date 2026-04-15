# Justin Breshears — Portfolio

Custom websites, built for you.

A single-page portfolio site. Plain HTML, CSS, and JavaScript — no build step.

## Local preview

Just open `index.html` in a browser, or run a quick static server:

```bash
npx serve .
```

## Deploy to GitHub Pages

1. Create a new public repo on GitHub (e.g. `justinbreshears.github.io` for a user site, or any name for a project site).
2. Push this folder's contents to the repo's `main` branch.
3. In the repo: **Settings → Pages → Source → Deploy from branch → `main` / `/ (root)`**.
4. Your site will be live at `https://<username>.github.io/` (user site) or `https://<username>.github.io/<repo>/` (project site).

## Structure

- `index.html` — markup and content
- `styles.css` — all styling
- `script.js` — scroll reveals + sticky nav state
