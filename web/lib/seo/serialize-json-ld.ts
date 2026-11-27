/**
 * Serialize JSON-LD for embedding via dangerouslySetInnerHTML.
 * JSON.stringify does not escape `<` / `>` / `&`, so a value like
 * `</script><script>…` can break out of the script element.
 * Unicode escapes are valid JSON and parse identically for crawlers.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
