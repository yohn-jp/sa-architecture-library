// The upstream UI package does not ship declarations. Describe only the API
// used by this site; do not disable strict checking for the search integration.
declare module '@pagefind/default-ui' {
  export class PagefindUI {
    constructor(options: { element: string; bundlePath?: string });
  }
}
