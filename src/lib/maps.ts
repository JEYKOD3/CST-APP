/**
 * Universal maps deep link. Uses Google Maps' documented search URL, which
 * resolves on desktop browsers and hands off to the native maps app (Google
 * Maps, Apple Maps, Waze, etc.) on mobile.
 */
export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`;
}
