# Site architecture

GitHub `main` is the source. GitHub Actions builds an Astro static site and publishes its artifact to GitHub Pages. The project prefix is `/sa-architecture-library/`; all manually composed local URLs normalize the trailing slash.

## Content and routes

- `public/complete/index.html` is the original complete textbook. Its bytes are preserved; SHA-256 is checked before publication.
- `src/content/books/<volume>/<NN>.md` is one supplementary chapter. The Astro content collection validates its metadata. File identity, volume and order must match; duplicate URLs fail the build.
- `/books/` lists the eight planned domains and links only volumes with published chapters.
- `/books/<volume>/` lists published chapters in order.
- `/books/<volume>/<NN>/` renders the shared reading layout, chapter/section navigation, related textbook chapters, syllabus references and previous/next links.
- `/syllabus/` derives a partial cross-reference index from published chapter metadata. Titles and physical PDF page numbers are maintained in `src/data/syllabus.ts`. It does not claim exhaustive syllabus coverage.
- `/search/` uses Pagefind's static Japanese index. `pagefind.yml` indexes the main content of both the unchanged textbook and supplementary pages. Navigation and reader controls are excluded.

## Reader

Desktop: sticky contents beside a limited-width reading column. Mobile: native disclosure navigation above the text. Text size, night display and read/unread state use browser-local storage, with error handling when storage is unavailable. The text, references and chapter links remain usable without JavaScript. No account, database or runtime API is required.

## Publication checks

`npm run check` validates Astro/TypeScript. `npm run build` renders the site and generates Pagefind. `scripts/verify_site.py` checks generated chapter routes, local assets, cross-reference anchors and the original SHA-256. `npm run verify:reader` opens the built site under the real project prefix in Chromium and checks desktop/mobile layout, persistent reading controls, disclosures, Japanese search and JavaScript-free text.

Technical checks do not establish factual correctness. Primary references, editions, mathematical assumptions and the distinction between source material and illustrative cases are reviewed separately in each chapter.


## Exam practice

- /practice/ offers AM II and afternoon-I practice. AM II uses 9 years of faithfully cropped official question scans, 25-answer sessions, random practice and a mistake notebook. Browser localStorage is the only persistent store.
- /practice/pm1/ selects a year and exactly two large questions; /practice/pm1/exam/ reads the committed unmodified IPA official PDF alongside an independently scrolling answer editor; /practice/pm1/result/ displays responses without grading.
- PM1 source catalog: src/data/pm1-sources.json; immutable committed documents: public/practice/pm1/pdfs/*.pdf; integrity manifest: public/practice/pm1/pdfs/manifest.json. Scripts and CI verify SHA-256 and metadata; the regular site build NEVER downloads PM1 PDFs.
- PM1 session and timer: src/lib/pm1-session.ts, versioned sa-pm1-session-v1:<year> localStorage keys. The wall clock continues while the browser is closed; expiry and explicit completion make responses read-only. See docs/PM1.md.
