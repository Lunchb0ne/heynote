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
 */
export function vimExtensions(editor) {
    return [
        vim(),
        protectAllDelimiters,
        vimModeReporter(editor),
    ]
}

const vimModeReporter = (editor) => ViewPlugin.fromClass(class {
    constructor(view) {
        this.view = view
        this.editor = editor
        this.handler = ({ mode, subMode }) => {
            if (editor.setVimMode) {
                editor.setVimMode(mode, subMode || "")
            }
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
        // Emit the initial mode so the UI reflects the current state.
        this.handler({ mode: "normal", subMode: "" })
    }

    destroy() {
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
