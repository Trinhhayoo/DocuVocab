import katex from "katex";

export type ExtractedMath =
  | {
      format: "tex";
      source: string;
      displayMode: boolean;
    }
  | {
      format: "mathml";
      source: string;
      displayMode: boolean;
    };

const TEX_ATTRIBUTE_PRIORITY = [
  "data-tex",
  "data-latex",
  "data-math",
  "data-formula",
  "data-expr",
] as const;

const FORMULA_CANDIDATE_SELECTOR = [
  "annotation[encoding='application/x-tex']",
  "script[type^='math/tex']",
  "[data-tex]",
  "[data-latex]",
  "[data-math]",
  "[data-formula]",
  "[data-expr]",
  "math",
  "mjx-container",
  ".katex",
].join(",");

const TEX_DELIMITER_PATTERN = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getNodeDepth(node: Node) {
  let depth = 0;
  let current: Node | null = node;

  while (current?.parentNode) {
    depth += 1;
    current = current.parentNode;
  }

  return depth;
}

function unwrapTexDelimiters(value: string) {
  const source = value.trim();

  const blockDollar = source.match(/^\$\$([\s\S]+)\$\$$/);
  if (blockDollar?.[1]) {
    return {
      source: blockDollar[1].trim(),
      displayMode: true,
    };
  }

  const blockBracket = source.match(/^\\\[([\s\S]+)\\\]$/);
  if (blockBracket?.[1]) {
    return {
      source: blockBracket[1].trim(),
      displayMode: true,
    };
  }

  const inlineParen = source.match(/^\\\(([\s\S]+)\\\)$/);
  if (inlineParen?.[1]) {
    return {
      source: inlineParen[1].trim(),
      displayMode: false,
    };
  }

  return {
    source,
    displayMode: null,
  };
}

function inferDisplayModeFromElement(element: Element) {
  const className = (element.getAttribute("class") ?? "").toLowerCase();

  if (className.includes("display") || className.includes("block")) {
    return true;
  }

  const tagName = element.tagName.toLowerCase();

  if (["div", "section", "article", "figure", "li"].includes(tagName)) {
    return true;
  }

  return false;
}

function parseDisplayModeFromMathScript(script: HTMLScriptElement) {
  const type = (script.getAttribute("type") ?? "").toLowerCase();

  return type.includes("mode=display");
}

function getTexFromAnnotation(root: Element) {
  const annotation = root.matches("annotation[encoding='application/x-tex']")
    ? root
    : root.querySelector("annotation[encoding='application/x-tex']");

  const text = normalizeText(annotation?.textContent ?? "");

  if (!text) return null;

  return text;
}

function getTexFromMathScript(root: Element) {
  const script = root.matches("script[type^='math/tex']")
    ? root
    : root.querySelector("script[type^='math/tex']");

  if (!(script instanceof root.ownerDocument.defaultView!.HTMLScriptElement)) {
    return null;
  }

  const text = normalizeText(script.textContent ?? "");

  if (!text) return null;

  return {
    source: text,
    displayMode: parseDisplayModeFromMathScript(script),
  };
}

function getTexFromDataAttributes(root: Element) {
  for (const attributeName of TEX_ATTRIBUTE_PRIORITY) {
    const sourceElement = root.hasAttribute(attributeName)
      ? root
      : root.querySelector(`[${attributeName}]`);

    if (!sourceElement) continue;

    const value = normalizeText(sourceElement.getAttribute(attributeName) ?? "");

    if (!value) continue;

    return value;
  }

  return null;
}

function getMathMlElement(root: Element) {
  if (root.matches("math")) {
    return root;
  }

  const math = root.querySelector("math");

  return math;
}

function extractMathFromRoot(root: Element): ExtractedMath | null {
  const annotationTex = getTexFromAnnotation(root);

  if (annotationTex) {
    const unwrapped = unwrapTexDelimiters(annotationTex);

    return {
      format: "tex",
      source: unwrapped.source,
      displayMode: unwrapped.displayMode ?? inferDisplayModeFromElement(root),
    };
  }

  const scriptTex = getTexFromMathScript(root);

  if (scriptTex) {
    const unwrapped = unwrapTexDelimiters(scriptTex.source);

    return {
      format: "tex",
      source: unwrapped.source,
      displayMode: unwrapped.displayMode ?? scriptTex.displayMode,
    };
  }

  const attributeTex = getTexFromDataAttributes(root);

  if (attributeTex) {
    const unwrapped = unwrapTexDelimiters(attributeTex);

    return {
      format: "tex",
      source: unwrapped.source,
      displayMode: unwrapped.displayMode ?? inferDisplayModeFromElement(root),
    };
  }

  const mathElement = getMathMlElement(root);

  if (mathElement) {
    const source = mathElement.outerHTML;

    return {
      format: "mathml",
      source,
      displayMode:
        mathElement.getAttribute("display") === "block" ||
        inferDisplayModeFromElement(root),
    };
  }

  return null;
}

function findFormulaRoot(target: Element) {
  if (target.matches("annotation[encoding='application/x-tex']")) {
    return (
      target.closest(
        "[data-tex], [data-latex], [data-math], [data-formula], [data-expr], .katex, mjx-container, math"
      ) ?? target
    );
  }

  if (target.matches("script[type^='math/tex']")) {
    return (
      target.closest(
        "[data-tex], [data-latex], [data-math], [data-formula], [data-expr], mjx-container, .katex, math"
      ) ?? target.parentElement ?? target
    );
  }

  if (target.matches("math")) {
    return (
      target.closest(
        "[data-tex], [data-latex], [data-math], [data-formula], [data-expr], .katex, mjx-container, math"
      ) ?? target
    );
  }

  return target;
}

function collectFormulaRoots(root: Element) {
  const rawCandidates = Array.from(root.querySelectorAll(FORMULA_CANDIDATE_SELECTOR));

  const uniqueCandidates = Array.from(
    new Set(rawCandidates.map((candidate) => findFormulaRoot(candidate)))
  );

  const sortedCandidates = uniqueCandidates.sort(
    (a, b) => getNodeDepth(a) - getNodeDepth(b)
  );

  const selected: Element[] = [];

  for (const candidate of sortedCandidates) {
    const isNestedInSelected = selected.some((existing) => existing.contains(candidate));

    if (isNestedInSelected) continue;

    selected.push(candidate);
  }

  return selected;
}

function createMathWrapper(
  document: Document,
  format: ExtractedMath["format"],
  displayMode: boolean
) {
  const wrapper = document.createElement(displayMode ? "div" : "span");

  wrapper.className = displayMode
    ? "doc-math doc-math-block"
    : "doc-math doc-math-inline";
  wrapper.setAttribute("data-math-format", format);
  wrapper.setAttribute("data-display-mode", String(displayMode));

  return wrapper;
}

function renderTexToElement(document: Document, source: string, displayMode: boolean) {
  const wrapper = createMathWrapper(document, "tex", displayMode);
  const html = katex.renderToString(source, {
    displayMode,
    throwOnError: false,
    trust: false,
    output: "mathml",
  });

  wrapper.innerHTML = html;

  return wrapper;
}

function preserveMathMlToElement(root: Element, displayMode: boolean) {
  const document = root.ownerDocument;
  const wrapper = createMathWrapper(document, "mathml", displayMode);
  const mathElement = getMathMlElement(root);

  if (!mathElement) return null;

  const clonedMath = mathElement.cloneNode(true);

  if (!(clonedMath instanceof document.defaultView!.Element)) {
    return null;
  }

  if (!clonedMath.getAttribute("xmlns")) {
    clonedMath.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
  }

  wrapper.appendChild(clonedMath);

  return wrapper;
}

function shouldSkipTextNode(textNode: Text) {
  const parent = textNode.parentElement;

  if (!parent) return true;

  if (parent.closest("pre, code, script, style, textarea, kbd, samp")) {
    return true;
  }

  if (parent.closest("[data-math-format]")) {
    return true;
  }

  return false;
}

function normalizeRawTexDelimiters(root: Element) {
  const document = root.ownerDocument;
  const nodeFilter = document.defaultView?.NodeFilter;

  const walker = document.createTreeWalker(
    root,
    nodeFilter?.SHOW_TEXT ?? 4,
    null
  );

  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (!(node instanceof document.defaultView!.Text)) continue;

    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    if (shouldSkipTextNode(textNode)) continue;

    const text = textNode.textContent ?? "";

    if (!TEX_DELIMITER_PATTERN.test(text)) {
      TEX_DELIMITER_PATTERN.lastIndex = 0;
      continue;
    }

    TEX_DELIMITER_PATTERN.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match: RegExpExecArray | null = TEX_DELIMITER_PATTERN.exec(text);

    while (match) {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, matchIndex)));
      }

      const blockDollar = match[1];
      const blockBracket = match[2];
      const inlineParen = match[3];

      const source = normalizeText(blockDollar || blockBracket || inlineParen || "");
      const displayMode = Boolean(blockDollar || blockBracket);

      if (source) {
        fragment.appendChild(renderTexToElement(document, source, displayMode));
      } else {
        fragment.appendChild(document.createTextNode(fullMatch));
      }

      cursor = matchIndex + fullMatch.length;
      match = TEX_DELIMITER_PATTERN.exec(text);
    }

    TEX_DELIMITER_PATTERN.lastIndex = 0;

    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    textNode.replaceWith(fragment);
  }
}

export function countMathCandidates(root: Element) {
  const directMatches = root.querySelectorAll(FORMULA_CANDIDATE_SELECTOR).length;

  if (directMatches > 0) {
    return directMatches;
  }

  const text = root.textContent ?? "";

  return (text.match(TEX_DELIMITER_PATTERN) ?? []).length;
}

export function normalizeMathContent(root: Element) {
  const formulaRoots = collectFormulaRoots(root);

  for (const formulaRoot of formulaRoots) {
    const extractedMath = extractMathFromRoot(formulaRoot);

    if (!extractedMath) continue;

    const document = formulaRoot.ownerDocument;
    const replacement =
      extractedMath.format === "tex"
        ? renderTexToElement(
            document,
            extractedMath.source,
            extractedMath.displayMode
          )
        : preserveMathMlToElement(formulaRoot, extractedMath.displayMode);

    if (!replacement) continue;

    formulaRoot.replaceWith(replacement);
  }

  normalizeRawTexDelimiters(root);
}
