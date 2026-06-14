import { Facet } from "@codemirror/state"

import { BLOCK_DELIMITER_REGEX } from "../block/block-parsing.js"

/**
 * Facet exposing the HeynoteEditor that owns the EditorView. Vim's operator /
 * motion / action / ex-command callbacks are registered globally on a single
 * Vim singleton, so they can't capture a specific editor at registration
 * time. They resolve it per-call via `cm.cm6.state.facet(editorFacet)`.
 */
export const editorFacet = Facet.define({
    combine: (values) => values[0] ?? null,
})

/**
 * Column of the first non-whitespace character on a line (0 if the line is
 * empty or all whitespace). Mirrors the vim package's internal
 * findFirstNonWhiteSpaceCharacter so block-clamped motions land where vim's
 * own line motions would.
 */
export function firstNonWhitespaceColumn(lineText) {
    if (!lineText) {
        return 0
    }
    const match = lineText.match(/^\s*/)
    return match ? match[0].length : 0
}

// Module-level so we don't pay regex parse cost on every yank. Built from
// BLOCK_DELIMITER_REGEX.source rather than reusing the export itself because
// String.prototype.replace on a global regex still resets lastIndex per call,
// but a private copy guarantees we never observe lastIndex churn from any
// other consumer of the shared export.
const DELIMITER_STRIP_REGEX = new RegExp(BLOCK_DELIMITER_REGEX.source, "g")

/**
 * Removes Heynote block delimiters (\n∞∞∞lang...\n) from a string, replacing
 * each with a single newline so the surrounding content stays on separate
 * lines. Used when yanking across block boundaries so the register never
 * carries delimiter text that would corrupt the document on paste.
 */
export function stripBlockDelimiters(text) {
    return text.replace(DELIMITER_STRIP_REGEX, "\n")
}
