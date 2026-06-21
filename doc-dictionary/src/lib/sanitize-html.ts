import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: {
      html: true,
    },
    ADD_ATTR: [
      "class",
      "style",
      "data-line",
      "data-language",
      "aria-hidden",

      "href",
      "src",
      "srcset",
      "sizes",
      "width",
      "height",

      "target",
      "rel",
      "loading",
      "decoding",
      "alt",
      "title",
    ],
  });
}