import { JSDOM } from "jsdom";

function toAbsoluteUrl(value: string, sourceUrl: string) {
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return value;
  }
}

function normalizeSrcSet(srcset: string, sourceUrl: string) {
  return srcset
    .split(",")
    .map((part) => {
      const trimmed = part.trim();

      if (!trimmed) return trimmed;

      const [urlPart, ...descriptorParts] = trimmed.split(/\s+/);

      const absoluteUrl = toAbsoluteUrl(urlPart, sourceUrl);
      const descriptor = descriptorParts.join(" ");

      return descriptor ? `${absoluteUrl} ${descriptor}` : absoluteUrl;
    })
    .join(", ");
}

export function normalizeHtmlUrls(html: string, sourceUrl: string) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");

    if (!href) return;
    if (href.startsWith("javascript:")) return;

    anchor.setAttribute("href", toAbsoluteUrl(href, sourceUrl));
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer noopener");
  });

  document.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    const dataSrc = img.getAttribute("data-src");
    const srcset = img.getAttribute("srcset");

    if (src) {
      img.setAttribute("src", toAbsoluteUrl(src, sourceUrl));
    } else if (dataSrc) {
      img.setAttribute("src", toAbsoluteUrl(dataSrc, sourceUrl));
    }

    if (srcset) {
      img.setAttribute("srcset", normalizeSrcSet(srcset, sourceUrl));
    }

    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");

    // Next.js images often contain internal layout attrs that are not useful in our reader.
    img.removeAttribute("data-nimg");
    img.removeAttribute("fetchpriority");
  });

  document.querySelectorAll("source[srcset]").forEach((source) => {
    const srcset = source.getAttribute("srcset");

    if (!srcset) return;

    source.setAttribute("srcset", normalizeSrcSet(srcset, sourceUrl));
  });

  return document.body.innerHTML;
}