/**
 * Public URL path for a page, matching the site's `trailingSlash: "never"` URLs.
 *
 * With `build.format: "file"`, `Astro.url.pathname` is "/empresa.html" (and "/index.html"
 * for the home page) at build time but "/empresa" in dev — normalize both to "/empresa".
 */
export function publicPath(pathname: string): string {
  const path = pathname.replace(/\.html$/, "").replace(/\/index$/, "/").replace(/(.)\/$/, "$1");
  return path || "/";
}
