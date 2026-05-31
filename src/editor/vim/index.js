import { Compartment } from "@codemirror/state"
import { ViewPlugin } from "@codemirror/view"
import { vim, getCM, Vim } from "@replit/codemirror-vim"

import { protectAllDelimiters } from "../block/block.js"
import { HEYNOTE_COMMANDS } from "../commands.js"

// Map from a CodeMirror EditorView to the HeynoteEditor that owns it. The
// vim package defines ex commands globally on a singleton, so command
// implementations need to resolve the active editor at call time (not
// capture one at registration) — otherwise users with multiple tabs would
// always close the wrong tab.
const viewToEditor = new WeakMap()

// Define ex-command aliases for keys vim users press reflexively. Defined
// once at module load; the implementations resolve the active editor via
// viewToEditor at call time.
let exCommandsRegistered = false
function registerExCommands() {
    if (exCommandsRegistered) return
    exCommandsRegistered = true
    const closeTab = (cm) => {
        const editor = viewToEditor.get(cm.cm6)
        if (editor) HEYNOTE_COMMANDS.closeCurrentTab.run(editor)(editor.view)
    }
    Vim.defineEx("write", "w", () => { /* Heynote auto-saves */ })
    Vim.defineEx("quit", "q", closeTab)
    Vim.defineEx("wq", "wq", closeTab)
    Vim.defineEx("xit", "x", closeTab)
}

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
    registerExCommands()
    const protection = new Compartment()
    return [
        vim(),
        protection.of(protectAllDelimiters),
        vimModeReporter(editor, protection),
    ]
}

// Vim modes that allow a single transaction to span multiple blocks.
const PROTECTED_MODES = new Set(["normal", "visual"])

const MAX_ATTACH_RETRIES = 30  // ~500ms at 60fps; vim() always mounts well before this

const vimModeReporter = (editor, protection) => ViewPlugin.fromClass(class {
    constructor(view) {
        this.view = view
        this.editor = editor
        this.destroyed = false
        this.lastMode = "normal"
        this.lastSubMode = ""
        this.retries = 0
        this.handler = ({ mode, subMode }) => {
            if (this.destroyed) return
            this.lastMode = mode
            this.lastSubMode = subMode || ""
            this._sync()
            const shouldProtect = PROTECTED_MODES.has(mode)
            this.view.dispatch({
                effects: protection.reconfigure(shouldProtect ? protectAllDelimiters : []),
            })
        }
        // When this editor regains focus (e.g. user switched tabs), re-emit
        // its mode so the shared StatusBar reflects this editor and not
        // whichever editor last fired a mode change.
        this.focusListener = () => this._sync()
        viewToEditor.set(view, editor)
        this.attach()
    }

    _sync() {
        if (this.editor.setVimMode) {
            this.editor.setVimMode(this.lastMode, this.lastSubMode)
        }
    }

    attach() {
        const cm = getCM(this.view)
        if (!cm) {
            // vim()'s ViewPlugin hasn't initialised yet on the same view
            // update cycle; retry on the next frame, with a bound so a
            // missing vim() doesn't spin forever.
            if (++this.retries >= MAX_ATTACH_RETRIES) {
                console.warn("Heynote vim: getCM(view) never returned; mode reporter inactive")
                return
            }
            this.retryHandle = requestAnimationFrame(() => this.attach())
            return
        }
        this.cm = cm
        cm.on("vim-mode-change", this.handler)
        this.view.contentDOM.addEventListener("focus", this.focusListener)
        // Surface the initial mode to the UI synchronously; the protection
        // compartment is already mounted with protectAllDelimiters, which
        // matches the initial "normal" mode, so no reconfigure needed yet.
        this._sync()
    }

    destroy() {
        this.destroyed = true
        if (this.retryHandle) {
            cancelAnimationFrame(this.retryHandle)
        }
        if (this.cm) {
            this.cm.off("vim-mode-change", this.handler)
        }
        if (this.view?.contentDOM) {
            this.view.contentDOM.removeEventListener("focus", this.focusListener)
        }
        viewToEditor.delete(this.view)
        if (this.editor.setVimMode) {
            this.editor.setVimMode(null, "")
        }
    }
})
