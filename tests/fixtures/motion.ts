// Opt-in browser QA preference. This file is injected only by preview.config.ts,
// never by the production config. It lets the browser smoke test exercise the
// real preference readers when the browser driver cannot emulate media queries.
if (new URLSearchParams(window.location.search).get("reduced-motion") === "1") {
  const nativeMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query: string): MediaQueryList => {
    const media = nativeMatchMedia(query);
    if (!query.includes("prefers-reduced-motion")) return media;
    return {
      matches: query.includes("reduce") && !query.includes("no-preference"),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => true,
    };
  };
}
