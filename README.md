# Lorenzo Capicchioni Art

Personal portfolio website — Jekyll, hosted on GitHub Pages.

**Live:** [lorenzocapi.github.io/lorenzocapicchioni-art](https://lorenzocapi.github.io/lorenzocapicchioni-art)

---

## Run locally

```bash
bundle install
bundle exec jekyll serve
```

Open: `http://localhost:4000/lorenzocapicchioni-art/`

Force clean rebuild:

```bash
rm -rf _site .jekyll-cache && bundle exec jekyll serve
```

---

## Project structure

```
lorenzocapicchioni-art/
├── _layouts/
│   ├── default.html      # Base layout (header, overlay INFO, scripts)
│   └── opera.html        # Single artwork page
├── _schede/              # Artwork markdown files
├── immagini/
│   ├── layout/           # UI assets (background, favicon, social preview)
│   └── opere/            # Artwork images, organized by category
│       ├── dipinti/
│       ├── disegni/
│       └── video/
├── portfolio/
│   └── index.html        # Portfolio grid with category filters
├── _config.yml
├── index.html            # Home page
├── style.css
├── 404.html
├── note-legali.md
└── robots.txt
```

---

## Adding an artwork

Create a new file in `_schede/` following the naming convention `year-title-kebab.md`:

```markdown
---
layout: opera
title: "Artwork Title"
category: "Paintings"        # Paintings | Drawings | Video
year: "2024"
medium: "Oil on canvas"
dimensions: "100 × 80 cm"
cover: "/immagini/opere/dipinti/filename.webp"
alt: "Brief description of the image"
img_width: 1200
img_height: 960
featured: true
---

Optional text about the work goes here.
```

Place the image in the matching subfolder:

| Category | Image folder |
|---|---|
| Paintings | `immagini/opere/dipinti/` |
| Drawings | `immagini/opere/disegni/` |
| Video | `immagini/opere/video/` |

Image format: `.webp` — resize to max 1800px on the long side before committing.

---

## Theme

Dark by default. User preference saved in `localStorage` key `theme`.

---

## Deploy

```bash
git add .
git commit -m "your message"
git push
```

GitHub Pages rebuilds automatically. Takes ~1 minute.

---

## When going live on custom domain

In `_config.yml`, update two lines:

```yaml
url: "https://www.lorenzocapicchioniart.com"
baseurl: ""
```

Then add a `CNAME` file in the root containing just:

```
lorenzocapicchioniart.com
```

---

## .gitignore

Make sure these are ignored:

```
_site
.jekyll-cache
.DS_Store
**/.DS_Store
.vscode
```
