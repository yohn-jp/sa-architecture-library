# Site architecture

- Source: GitHub main. Delivery: GitHub Pages using GitHub Actions.
- Public URL: https://yohn-jp.github.io/sa-architecture-library/
- Astro static output, with a fixed project base path.
- /complete/: unchanged source textbook HTML (must be checked in before release).
- /books/: eight-domain catalogue. Publish chapter pages only with real content.
- /syllabus/: IPA syllabus reference and future cross-reference index.
- /search/: Pagefind build-time static search, without a service backend.
- No authentication, database, or external runtime service.

## Publication gate

Do not publish the initial Pages site as complete until the uploaded 30-chapter textbook is copied byte-for-byte into public/complete/index.html and all internal assets and relative links work under the project base path. No placeholder should masquerade as the original work.
