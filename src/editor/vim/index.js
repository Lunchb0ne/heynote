import { Compartment } from "@codemirror/state"
import { ViewPlugin } from "@codemirror/view"
import { vim, getCM } from "@replit/codemirror-vim"

import { protectAllDelimiters } from "../block/block.js"

/**
 * Builds the set of CodeMirror extensions that make up Heynote's vim mode.
 *
 * Returned as an array so callers can spread it into the keymap compartment
 * alongside the Heynote keymap. The protectAllDelimiters changeFilter is
 * mounted here (rather than globally) so default/emacs keymaps keep their
 * existing protection semantics unchanged — only vim mode pulls in the
 * broader guard that catches dd / :%s / macros / etc.
 *
 * Protection is gated on vim mode (see vimModeReporter): it's active in
 * normal/visual modes (where multi-position operators and selections can
 * cross delimiters) and dropped in insert/replace modes. Dropping it in
 * insert mode lets Backspace at a block boundary absorb the whole delimiter
 * atomic range — matching default-mode behavior of "Backspace merges into
 * the previous block."
 */
export function vimExtensions(editor) {
    const protection = new Compartment()
    return [
        vim(),
        protection.of(protectAllDelimiters),
        vimModeReporter(editor, protection),
    ]
}

// Vim modes that allow a single transaction to span multiple blocks.
const PROTECTED_MODES = new Set(["normal", "visual"])

const vimModeReporter = (editor, protection) => ViewPlugin.fromClass(class {
    constructor(view) {
        this.view = view
        this.editor = editor
        this.destroyed = false
        this.handler = ({ mode, subMode }) => {
            if (this.destroyed) return
            if (editor.setVimMode) {
                editor.setVimMode(mode, subMode || "")
            }
            const shouldProtect = PROTECTED_MODES.has(mode)
            this.view.dispatch({
                effects: protection.reconfigure(shouldProtect ? protectAllDelimiters : []),
            })
        }
        this.attach()
    }

    attach() {
        const cm = getCM(this.view)
        if (!cm) {
            // vim()'s ViewPlugin hasn't initialised yet on the same view
            // update cycle; retry on the next frame.
            this.retryHandle = requestAnimationFrame(() => this.attach())
            return
        }
        this.cm = cm
        cm.on("vim-mode-change", this.handler)
        // Surface the initial mode to the UI synchronously; the protection
        // compartment is already mounted with protectAllDelimiters, which
        // matches the initial "normal" mode, so no reconfigure needed yet.
        if (this.editor.setVimMode) {
            this.editor.setVimMode("normal", "")
        }
    }

    destroy() {
        this.destroyed = true
        if (this.retryHandle) {
            cancelAnimationFrame(this.retryHandle)
        }
        if (this.cm) {
            this.cm.off("vim-mode-change", this.handler)
        }
        if (this.editor.setVimMode) {
            this.editor.setVimMode(null, "")
        }
    }
})
