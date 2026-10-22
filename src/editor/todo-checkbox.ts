import { EditorView, Decoration } from "@codemirror/view"
import { WidgetType } from "@codemirror/view"
import { ViewUpdate, ViewPlugin, DecorationSet } from "@codemirror/view"
import { EditorState, SelectionRange } from "@codemirror/state"

import { getNoteBlockFromPos } from "./block/block"
import { isMonospaceFont } from "./theme/font-theme"
import { transactionsHasAnnotation, SET_FONT } from "./annotation"


class CheckboxWidget extends WidgetType {
    constructor(readonly checked: boolean, readonly monospace: boolean) { super() }

    eq(other: CheckboxWidget) { return other.checked == this.checked && other.monospace == this.monospace }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.setAttribute("aria-hidden", "true")
        wrap.className = "cm-taskmarker-toggle"
        
        let box = document.createElement("input")
        box.type = "checkbox"
        box.checked = this.checked
        box.tabIndex = -1

        if (this.monospace) {
            // with a monospaced font the wrapper holds "    " (as wide as "[ ] ") and the checkbox is
            // laid over it, so characters on different lines line up. Positioned in base.js
            wrap.classList.add("monospace")
            wrap.appendChild(document.createTextNode("    "))
        }
        wrap.appendChild(box)
        return wrap
    }

    // keep the element when toggled, so the check draws in (base.js), and pop the box on checking
    updateDOM(dom: HTMLElement) {
        const box = dom.querySelector("input")
        if (!box || this.monospace !== dom.classList.contains("monospace")) {
            return false
        }
        if (this.checked && !box.checked && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            box.animate(
                [{ transform: "scale(0.88)" }, { transform: "scale(1.15)", offset: 0.45 }, { transform: "scale(1)" }],
                { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
            )
        }
        box.checked = this.checked
        return true
    }

    ignoreEvent() { return false }
}

const checkboxRegex = /^([\t\f\v ]*-[\t\f\v ]*)\[( |x|X)\] /gm
const checkboxLineRegex = /^([\t\f\v ]*-[\t\f\v ]*)\[( |x|X)\] /

const doneTask = Decoration.mark({ class: "cm-task-done" })
// a task checked by this very update: its strike sweeps across (once, the class is gone on the next rebuild)
const justDoneTask = Decoration.mark({ class: "cm-task-done cm-task-just-done" })

// the checkbox widgets, and a mark dimming the text of each checked task. With the update that
// caused the rebuild, tasks that were unchecked before it get justDoneTask.
function checkboxes(view: EditorView, update?: ViewUpdate) {
    let widgets: any = []
    let done: any = []
    // maps this update's positions back to before it
    const inverted = update?.docChanged ? update.changes.invertedDesc : null

    for (let { from, to } of view.visibleRanges) {
        let range = view.state.sliceDoc(from, to)
        let match
        while (match = checkboxRegex.exec(range)) {
            if (getNoteBlockFromPos(view.state, from + match.index)?.language?.name === "markdown") {
                const checked = match[2] === "x" || match[2] === "X"
                let deco = Decoration.replace({
                    widget: new CheckboxWidget(checked, view.state.facet(isMonospaceFont)),
                    inclusive: false,
                })
                const boxFrom = from + match.index + match[1].length
                const end = from + match.index + match[0].length
                widgets.push(deco.range(boxFrom, end))
                const lineEnd = view.state.doc.lineAt(end).to
                if (checked && lineEnd > end) {
                    let justDone = false
                    if (inverted) {
                        const before = inverted.mapPos(boxFrom, 1)
                        justDone = update!.startState.sliceDoc(before, before + 3) === "[ ]"
                    }
                    done.push((justDone ? justDoneTask : doneTask).range(end, lineEnd))
                }
            }
        }
    }
    return { widgets: Decoration.set(widgets), done: Decoration.set(done) }
}


function toggleBoolean(view: EditorView, pos: number) {
    let before = view.state.doc.sliceString(pos, pos+4).toLowerCase()
    let change
    if (before === "[x] ") {
        change = { from: pos, to: pos+4, insert: "[ ] " }
    } else if (before === "[ ] ") {
        change = { from: pos, to: pos+4, insert: "[x] " }
    } else {
        return false
    }
    view.dispatch({ changes: change })
    return true
}

type CheckboxTarget = {
    from: number
    checked: boolean
}

function checkboxTargetFromLine(state: EditorState, line: { from: number; text: string }): CheckboxTarget | null {
    const block = getNoteBlockFromPos(state, line.from)
    if (!block || block.language?.name !== "markdown") {
        return null
    }
    const match = checkboxLineRegex.exec(line.text)
    if (!match) {
        return null
    }
    return {
        from: line.from + match[1].length + 1,
        checked: match[2] === "x" || match[2] === "X",
    }
}

function selectedLines(state: EditorState, ranges: readonly SelectionRange[]) {
    const lines = []
    const seen = new Set<number>()
    for (const range of ranges) {
        if (range.empty) {
            continue
        }
        let startLine = state.doc.lineAt(range.from)
        let endLine = state.doc.lineAt(range.to)
        if (range.to === endLine.from && range.to > 0) {
            endLine = state.doc.lineAt(range.to - 1)
        }
        let line = startLine
        while (true) {
            if (!seen.has(line.from)) {
                lines.push(line)
                seen.add(line.from)
            }
            if (line.number === endLine.number) {
                break
            }
            line = state.doc.line(line.number + 1)
        }
    }
    return lines
}

export const toggleCheckbox = (view: EditorView) => {
    if (view.state.readOnly) {
        return false
    }
    const { state } = view
    const ranges = state.selection.ranges
    const hasRangeSelection = ranges.some(range => !range.empty)
    const targets: CheckboxTarget[] = []

    if (hasRangeSelection) {
        for (const line of selectedLines(state, ranges)) {
            const target = checkboxTargetFromLine(state, line)
            if (target) {
                targets.push(target)
            }
        }
        if (targets.length === 0) {
            return false
        }
        const checkedCount = targets.filter(target => target.checked).length
        const uncheckedCount = targets.length - checkedCount
        const targetChecked = checkedCount <= uncheckedCount
        const changes = targets
            .filter(target => target.checked !== targetChecked)
            .map(target => ({
                from: target.from,
                to: target.from + 1,
                insert: targetChecked ? "x" : " ",
            }))
        changes.sort((a, b) => a.from - b.from)
        if (changes.length === 0) {
            return false
        }
        view.dispatch({ changes, userEvent: "input" })
        return true
    }

    const seenLines = new Set<number>()
    for (const range of ranges) {
        const line = state.doc.lineAt(range.head)
        if (seenLines.has(line.from)) {
            continue
        }
        seenLines.add(line.from)
        const target = checkboxTargetFromLine(state, line)
        if (target) {
            targets.push(target)
        }
    }
    if (targets.length === 0) {
        return false
    }
    const changes = targets.map(target => ({
        from: target.from,
        to: target.from + 1,
        insert: target.checked ? " " : "x",
    }))
    changes.sort((a, b) => a.from - b.from)
    view.dispatch({ changes, userEvent: "input" })
    return true
}


/**
 * A plugin that replaces [ ] and [x] with checkboxes to task list items in Markup mode
 */
export const todoCheckboxPlugin = [
    ViewPlugin.fromClass(class {
        sets: { widgets: DecorationSet, done: DecorationSet }

        constructor(view: EditorView) {
            this.sets = checkboxes(view)
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged || transactionsHasAnnotation(update.transactions, SET_FONT)) {
                this.sets = checkboxes(update.view, update)
            }
        }
    }, {
        decorations: v => v.sets.widgets,

        // only the widgets are atomic, not the done tasks' text
        provide: plugin => [
            EditorView.atomicRanges.of(view => view.plugin(plugin)?.sets.widgets || Decoration.none),
            EditorView.decorations.of(view => view.plugin(plugin)?.sets.done || Decoration.none),
        ],

        eventHandlers: {
            mousedown: (e, view) => {
                let target = e.target as HTMLElement
                if (target.nodeName == "INPUT" && target.parentElement!.classList.contains("cm-taskmarker-toggle"))
                    return toggleBoolean(view, view.posAtDOM(target))
            }
        }
    }),
]
