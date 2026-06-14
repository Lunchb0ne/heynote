import { EditorState, StateEffect, StateField } from "@codemirror/state"
import { ViewPlugin } from "@codemirror/view"
import { vim, getCM } from "@replit/codemirror-vim"

import { blockState } from "../block/block.js"
import { heynoteEvent } from "../annotation.js"
import { editorFacet } from "./shared.js"
import {
    registerBlockMotions, registerExCommands, registerSearchRedirect, registerYankStrip,
} from "./customize.js"

/**
 * Builds the set of CodeMirror extensions that make up Heynote's vim mode.
 *
 * Returned as an array so callers can spread it into the keymap compartment
 * alongside the Heynote keymap. The delimiter-protection changeFilter is
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
    initializeVimGlobals()
    return [
        vim(),
        editorFacet.of(editor),
        vimModeField,
        vimGatedDelimiterProtection,
        vimModeReporter(editor),
    ]
}

// All registrations on the global Vim singleton happen once for the process.
// vimExtensions() may be called many times (one per editor mount, plus once
// per keymap setting change), but the configuration it installs is global.
let globalsInitialized = false
function initializeVimGlobals() {
    if (globalsInitialized) return
    globalsInitialized = true
    registerExCommands()
    registerYankStrip()
    registerBlockMotions()
    registerSearchRedirect()
}

// Vim modes in which a single transaction can span multiple blocks (operators
// over multi-line selections, ex-substitute, etc.). Insert / replace are
// single-position edits where atomic-range absorption handles boundary cases
// correctly, so we drop protection there to restore the default-mode
// affordance of "Backspace at start of block merges with previous block".
const PROTECTED_MODES = new Set(["normal", "visual"])

const setVimMode = StateEffect.define()

// Tracks the current vim mode of this editor's view. The mode reporter
// dispatches setVimMode effects; the change filter below reads the field to
// decide whether to protect delimiters. Living in state (rather than a
// reconfigured compartment) means there's no extension churn on every i/Esc
// keystroke.
const vimModeField = StateField.define({
    create: () => "normal",
    update(value, tr) {
        for (const e of tr.effects) {
            if (e.is(setVimMode)) return e.value
        }
        return value
    },
})

// Protects every block delimiter from any external edit when vim is in a
// "protected" mode. Heynote's own commands carry a heynoteEvent annotation
// and bypass this filter. This catches dd / :%s / macros / etc.; in
// insert/replace mode the filter is a no-op so atomic-range absorption can
// merge blocks via Backspace.
const vimGatedDelimiterProtection = EditorState.changeFilter.of((tr) => {
    const mode = tr.startState.field(vimModeField, false)
    if (!PROTECTED_MODES.has(mode)) {
        return
    }
    if (tr.annotations.some(a => a.type === heynoteEvent)) {
        return
    }
    const blocks = tr.startState.field(blockState)
    if (!blocks.length) {
        return
    }
    const protect = []
    for (const block of blocks) {
        protect.push(block.delimiter.from, block.delimiter.to)
    }
    return protect
})

const MAX_ATTACH_RETRIES = 30  // ~500ms at 60fps; vim() always mounts well before this

const vimModeReporter = (editor) => ViewPlugin.fromClass(class {
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
            this.view.dispatch({ effects: setVimMode.of(mode) })
        }
        // When this editor regains focus (e.g. user switched tabs), re-emit
        // its mode so the shared StatusBar reflects this editor and not
        // whichever editor last fired a mode change.
        this.focusListener = () => this._sync()
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
        // Surface the initial mode to the UI synchronously; vimModeField
        // already defaults to "normal", matching the actual vim state, so no
        // dispatch is needed yet.
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
        if (this.editor.setVimMode) {
            this.editor.setVimMode(null, "")
        }
    }
})
