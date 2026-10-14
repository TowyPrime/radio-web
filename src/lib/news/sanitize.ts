import sanitizeHtml from "sanitize-html";

export function sanitizeNewsHtml(dirtyHtml: string): string {
  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s",
      "h2", "h3", "ul", "ol", "li", "blockquote", "a",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim();
}