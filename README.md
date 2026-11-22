# DRF Atlas

**A Developer's Guide to Building REST APIs with Django REST Framework**

DRF Atlas is the documentation site for the `django_rest_crud_slide` backend: function-based DRF views,
JWT authentication with Simple JWT (custom `/api/login/`, refresh, blacklisting logout), product CRUD,
and multipart image uploads.

## Run it

```bash
cd drf-atlas
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve the built site
```

The build uses hash routing (`#/jwt/concepts`) and relative asset paths, so `dist/` works on any
static host without rewrite rules.

## Keeping the docs in sync with the code

Code samples are not retyped. `src/lib/source.js` extracts them from snapshots of the real Django
files in `src/source/`. After changing the backend, run:

```bash
npm run sync-source   # copy ../backend/**/*.py into src/source/
npm run smoke         # render every page; verify excerpts and internal links resolve
```

## Structure

```
src/
  App.jsx                 shell: header, sidebar, article, table of contents, search
  components/
    docs.jsx              content primitives: Code, Callout, Table, Tabs, EndpointBar, H2/H3 …
    Header.jsx  Sidebar.jsx  Toc.jsx  Pager.jsx  SearchDialog.jsx  Icons.jsx
  diagrams/
    primitives.jsx        data-driven SVG Sequence and Flow diagrams (theme-aware)
    index.jsx             the 13 project diagrams
  content/
    index.js              navigation order and page registry
    endpoints.jsx         endpoint data that generates the API Reference pages
    pages/*.jsx           one module per documentation section
  lib/
    source.js             extracts code from the Django source snapshot
    highlight.js          dependency-free syntax highlighter
    search.js             client-side full-text search index
    router.js  theme.js  slug.js
  source/                 snapshot of the backend files (generated)
  styles/                 tokens.css (light/dark), base, layout, components
```

## Adding a page

1. Write a component in the relevant `src/content/pages/*.jsx` module using the primitives from
   `components/docs.jsx`, then add an entry `{ slug, group, title, lede, Body }` to the module's
   default export.
2. `<H2>`/`<H3>` headings appear in the "On this page" table of contents and in search automatically.
3. Run `npm run smoke`.

The GitHub link in the header is a placeholder (`src/components/Header.jsx`).
