import { BLOCK_DELIMITER_REGEX } from "../block/block-parsing.js"

/**
 * Maps a CodeMirror EditorView to the HeynoteEditor that owns it.
 *
 * The vim package registers operators / motions / actions / ex-commands on a
 * single module-level Vim singleton, so those callbacks can't capture a
 * specific editor at registration time — they'd bind to whichever editor was
 * mounted last. Instead they resolve the active editor from this map at call
 * time, via the cm5-compat object's `.cm6` EditorView. Populated/cleared by
 * the vim mode reporter in index.js as editors mount and unmount.
 */
export const viewToEditor = new WeakMap()

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

/**
 * Removes Heynote block delimiters (\n∞∞∞lang...\n) from a string, replacing
 * each with a single newline so the surrounding content stays on separate
 * lines. Used when yanking across block boundaries so the register never
 * carries delimiter text that would corrupt the document on paste.
 *
 * A fresh RegExp is built from BLOCK_DELIMITER_REGEX's source on each call to
 * avoid sharing the global regex's mutable lastIndex.
 */
export function stripBlockDelimiters(text) {
    const re = new RegExp(BLOCK_DELIMITER_REGEX.source, "g")
    return text.replace(re, "\n")
}
