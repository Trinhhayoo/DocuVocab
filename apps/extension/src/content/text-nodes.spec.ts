// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { collectTextNodes } from "./text-nodes";

function texts(html: string, ownHostSelector?: string) {
  document.body.innerHTML = html;
  const ownHost = ownHostSelector ? document.querySelector(ownHostSelector) : null;
  return collectTextNodes(document.body, ownHost).map((node) => node.data);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("collectTextNodes", () => {
  it("collects prose, links and buttons, because highlighting no longer touches the DOM", () => {
    expect(texts('<p>one <a href="#">two</a> <button>three</button></p>')).toEqual(["one ", "two", "three"]);
  });

  it.each([
    ["code", "<code>x</code>"],
    ["pre", "<pre>x</pre>"],
    ["script", "<script>x</script>"],
    ["style", "<style>x</style>"],
    ["textarea", "<textarea>x</textarea>"],
    ["an editable region", '<div contenteditable="true"><p>x</p></div>'],
  ])("skips %s", (_, html) => {
    expect(texts(`<p>keep</p>${html}`)).toEqual(["keep"]);
  });

  it("collects text in a region marked not editable", () => {
    expect(texts('<div contenteditable="false">x</div>')).toEqual(["x"]);
  });

  it("skips whitespace-only nodes", () => {
    expect(texts("<p>a</p>\n  <p>b</p>")).toEqual(["a", "b"]);
  });

  it("skips the extension's own UI", () => {
    expect(texts('<p>page</p><div id="own"><p>ui</p></div>', "#own")).toEqual(["page"]);
  });

  it("accepts a single text node as the root", () => {
    document.body.innerHTML = "<p>alone</p><code>code</code>";
    const [prose, code] = [document.querySelector("p")?.firstChild, document.querySelector("code")?.firstChild];

    expect(prose && collectTextNodes(prose, null).map((node) => node.data)).toEqual(["alone"]);
    expect(code && collectTextNodes(code, null)).toEqual([]);
  });
});
