import { Vim } from "@replit/codemirror-vim"

import { getActiveNoteBlock } from "../block/block.js"
import { HEYNOTE_COMMANDS } from "../commands.js"
import { viewToEditor, firstNonWhitespaceColumn, stripBlockDelimiters } from "./shared.js"

let registered = false

/**
 * Applies Heynote-native customizations to the global Vim singleton. Safe to
 * call on every editor mount; the work runs only once. Editor-specific state
 * is resolved per-call via viewToEditor, so a single registration serves all
 * editors/tabs.
 */
export function registerVimCustomizations() {
    if (registered) {
        return
    }
    registered = true
    registerYankStrip()
    registerBlockMotions()
    registerSearchRedirect()
}

/**
 * Yank that strips block delimiters from the captured text. This lets a visual
 * selection span multiple blocks: the cursor crosses delimiters via atomic
 * ranges, the selection text includes them, and we remove them here so the
 * register holds clean content. Paste then reinserts ordinary text without
 * ever re-introducing a ∞∞∞ delimiter into another block.
 */
function registerYankStrip() {
    Vim.defineOperator("yank", (cm, args, ranges, oldAnchor) => {
        const vim = cm.state.vim
        const rawText = cm.getSelection()
        const text = stripBlockDelimiters(rawText)
        const endPos = vim.visualMode
            ? posMin(vim.sel.anchor, vim.sel.head, ranges[0].head, ranges[0].anchor)
            : oldAnchor
        Vim.getRegisterController().pushText(
            args.registerName, "yank", text, args.linewise, vim.visualBlock,
        )
        return endPos
    })
}

// Smallest cursor position (by line, then column) — local replacement for the
// vim package's internal cursorMin, used to place the cursor at the start of
// the yanked region in visual mode (matching default vim yank behavior).
function posMin(...positions) {
    return positions.reduce((best, pos) => {
        if (!pos) return best
        if (!best) return pos
        if (pos.line < best.line) return pos
        if (pos.line === best.line && pos.ch < best.ch) return pos
        return best
    }, null)
}

/**
 * Clamps gg / G (and counted forms like 5G) to the active block's content
 * range instead of the whole buffer. The block is the unit of meaning in
 * Heynote, and the StatusBar already shows block-relative line numbers, so
 * "5G" matching the 5th line of the current block is the least surprising
 * behavior. Cross-block navigation remains available via Mod-↑ / Mod-↓.
 */
function registerBlockMotions() {
    Vim.defineMotion("moveToLineOrEdgeOfDocument", (cm, _head, motionArgs) => {
        // The vim package represents cursor positions as plain { line, ch }
        // objects (0-indexed line), so we return the same shape here.
        const view = cm.cm6
        const block = getActiveNoteBlock(view.state)
        if (!block) {
            // No block (shouldn't happen in a Heynote buffer) — fall back to
            // the default buffer-edge behavior.
            const lineNum = motionArgs.forward ? cm.lastLine() : cm.firstLine()
            return { line: lineNum, ch: firstNonWhitespaceColumn(cm.getLine(lineNum)) }
        }
        const doc = view.state.doc
        const firstLine = doc.lineAt(block.content.from).number - 1
        const lastLine = doc.lineAt(block.content.to).number - 1
        let lineNum
        if (motionArgs.repeatIsExplicit) {
            // Counted form (e.g. 5G): block-relative line number.
            lineNum = firstLine + (motionArgs.repeat - cm.getOption("firstLineNumber"))
            lineNum = Math.max(firstLine, Math.min(lastLine, lineNum))
        } else {
            lineNum = motionArgs.forward ? lastLine : firstLine
        }
        return { line: lineNum, ch: firstNonWhitespaceColumn(cm.getLine(lineNum)) }
    })
}

/**
 * Redirects vim's search keys to Heynote's own search panel so there's a
 * single, polished search UX, and so vim's search overlay never highlights or
 * navigates into hidden block delimiters.
 *
 *   /  ?   → open Heynote's search panel
 *   n  N   → Heynote find next / previous (works with the panel closed)
 *
 * Mapped in normal context only; visual-mode search is rare and left to vim.
 * *, #, and search-composed operators (d/foo, cgn) are intentionally not
 * supported — use Mod-d (select next occurrence) instead.
 */
function registerSearchRedirect() {
    const runCommand = (cm, commandName) => {
        const editor = viewToEditor.get(cm.cm6)
        if (!editor) {
            return
        }
        HEYNOTE_COMMANDS[commandName].run(editor)(cm.cm6)
    }

    Vim.defineAction("heynoteOpenSearch", (cm) => runCommand(cm, "openSearchPanel"))
    Vim.defineAction("heynoteFindNext", (cm) => runCommand(cm, "findNext"))
    Vim.defineAction("heynoteFindPrevious", (cm) => runCommand(cm, "findPrevious"))

    Vim.mapCommand("/", "action", "heynoteOpenSearch", {}, { context: "normal" })
    Vim.mapCommand("?", "action", "heynoteOpenSearch", {}, { context: "normal" })
    Vim.mapCommand("n", "action", "heynoteFindNext", {}, { context: "normal" })
    Vim.mapCommand("N", "action", "heynoteFindPrevious", {}, { context: "normal" })
}
