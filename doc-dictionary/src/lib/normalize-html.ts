import { JSDOM } from "jsdom";

export function normalizeHtmlUrls(html: string, sourceUrl: string) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");

    if (!src) return;

    img.setAttribute("src", new URL(src, sourceUrl).toString());
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
  });

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");

    if (!href) return;

    anchor.setAttribute("href", new URL(href, sourceUrl).toString());
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer noopener");
  });

  return document.body.innerHTML;
}