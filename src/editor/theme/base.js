import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';


// Raycast-style editor, shared by the light and dark themes. Colors come from the CSS custom
// properties in src/css/base.sass, and the editor never paints its own background so the window
// background (or native vibrancy on macOS) shows through.
export const heynoteBase = EditorView.theme({
    "&": {
        color: "var(--text)",
        backgroundColor: "transparent",
    },
    // scroll edge: text fades out as it scrolls under the tab bar, in place of a border. 10px is the
    // content's top padding, so nothing fades at rest
    ".cm-scroller": {
        maskImage: "linear-gradient(transparent, #000 10px)",
    },
    ".cm-content": {
        caretColor: "var(--text)",
        paddingTop: '10px',
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--text)",
        borderLeftWidth: '2px',
        paddingTop: '4px',
        marginTop: '-2px',
        boxSizing: 'content-box',
    },
    // the current line: a rounded pill one step above the block band, inset 8px from the right. It's
    // drawn behind the text (the line's own stacking context keeps it above the band), so the line
    // itself keeps its width and nothing re-wraps
    ".cm-activeLine": {
        backgroundColor: "transparent",
    },
    "&.cm-focused:not(.heynote-has-selection) .cm-activeLine": {
        position: "relative",
        zIndex: 0,
    },
    "&.cm-focused:not(.heynote-has-selection) .cm-activeLine::before": {
        content: '""',
        position: "absolute",
        inset: "0 8px 0 0",
        zIndex: -1,
        borderRadius: "6px",
        backgroundColor: "var(--active-line)",
        pointerEvents: "none",
    },
    ".cm-selectionMatch": { backgroundColor: "var(--fill-100)" },
    "&.cm-focused .cm-matchingBracket": {
        backgroundColor: "var(--fill-100)",
        outline: "1px solid var(--border-200)",
        color: "inherit",
    },
    "&.cm-focused .cm-nonmatchingBracket": {
        outline: "1px solid var(--accent)",
    },
    // a quiet gutter: small tabular numbers 12px off the edge, that light up for the block holding
    // the cursor and brighten fully on the cursor's line
    ".cm-gutters": {
        backgroundColor: "transparent",
        color: "rgb(var(--text-rgb) / 0.18)",
        border: "none",
        padding: '0 0 0 12px',
        userSelect: 'none',
    },
    ".cm-gutterElement": {
        transition: "color 150ms ease",
    },
    // the smaller numbers keep the code's line height (1.4 of the editor font) so they don't ride
    // high, and drop to share the code's baseline
    ".cm-lineNumbers .cm-gutterElement": {
        padding: '0',
        fontSize: '0.85em',
        lineHeight: 'calc(1.4em / 0.85)',
        position: 'relative',
        top: '0.07em',
        fontVariantNumeric: 'tabular-nums',
    },
    // without the fold gutter, keep the same air before the text
    ".cm-lineNumbers:last-child .cm-gutterElement": {
        paddingRight: '8px',
    },
    // line numbers of the block holding the cursor (same specificity as, and before, .cm-activeLineGutter)
    ".heynote-active-block-gutter": {
        color: "var(--text-600)",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "var(--text)",
    },
    ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: "var(--text-600)",
    },
    ".cm-searchMatch": { backgroundColor: "rgb(255 197 49 / 0.3)" },
    ".cm-searchMatch-selected": {
        backgroundColor: "rgb(255 197 49 / 0.6)",
        outline: "1px solid rgb(255 197 49)",
    },
    // round, Reminders-style task checkbox: a hairline ring that fills with the text color, the
    // check drawing in from the left (the widget keeps its element when toggled, see todo-checkbox.ts).
    // Settings draws the same one with +rc-checkbox in include.sass
    ".cm-taskmarker-toggle input[type=checkbox]": {
        appearance: "none",
        // without the native look it has no size of its own (the monospace case sets the same inline)
        width: "1.1em",
        height: "1.1em",
        borderRadius: "50%",
        boxShadow: "inset 0 0 0 1.5px rgb(var(--text-rgb) / 0.3)",
        cursor: "pointer",
        transition: "transform 120ms var(--ease-out), background-color 150ms ease, box-shadow 150ms ease",
    },
    ".cm-taskmarker-toggle input[type=checkbox]::after": {
        content: '""',
        position: "absolute",
        inset: "0",
        backgroundColor: "rgb(var(--bg-rgb))",
        mask: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath d='M3.9 7.2l2.1 2.1 4.1-4.4' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 100% no-repeat`,
        clipPath: "inset(0 100% 0 0)",
        transition: "clip-path 220ms var(--ease-out)",
    },
    ".cm-taskmarker-toggle input[type=checkbox]:hover": {
        boxShadow: "inset 0 0 0 1.5px rgb(var(--text-rgb) / 0.5)",
        backgroundColor: "var(--fill-50)",
    },
    ".cm-taskmarker-toggle input[type=checkbox]:active": {
        transform: "scale(0.88)",
    },
    ".cm-taskmarker-toggle input[type=checkbox]:checked": {
        backgroundColor: "var(--text)",
        boxShadow: "none",
    },
    ".cm-taskmarker-toggle input[type=checkbox]:checked::after": {
        clipPath: "inset(0)",
    },
    // checking a task: the box overshoots and settles while the check draws in
    ".cm-taskmarker-toggle input[type=checkbox].pop": {
        animation: "heynote-task-pop 320ms var(--ease-out)",
    },
    "@keyframes heynote-task-pop": {
        "0%": { transform: "scale(0.88)" },
        "45%": { transform: "scale(1.15)" },
        "100%": { transform: "scale(1)" },
    },
    // a done task dims and is struck through. The strike is a background so it can sweep across
    // when the task is checked (.cm-task-just-done, see todo-checkbox.ts)
    ".cm-task-done": {
        color: "var(--text-400)",
        background: "linear-gradient(var(--text-250), var(--text-250)) left 58% / 100% 1px no-repeat",
    },
    ".cm-task-done *": {
        color: "inherit",
    },
    ".cm-task-just-done": {
        animation: "heynote-task-strike 380ms var(--ease-out)",
    },
    "@keyframes heynote-task-strike": {
        "from": { backgroundSize: "0% 1px", color: "var(--text)" },
    },
    "@keyframes heynote-task-fade": {
        "from": { color: "var(--text)" },
    },
    ".cm-line": {
        padding: "0 6px",
    },
    ".cm-panels": {
        fontSize: "12px",
    },
    ".cm-panels.cm-panels-top": {
        borderBottom: "none",
    },

    "&.cm-editor.cm-focused": {
        outline: "none",
    },
    '.cm-foldGutter': {
        marginLeft: '0px',
    },
    // the chevron sits 6px off the numbers with the same 6px (the line padding) before the text, and
    // takes the line number's color, so it lights up with its block
    '.cm-foldGutter .cm-gutterElement': {
        paddingLeft: '6px',
        display: 'flex',
        alignItems: 'center',
    },
    // square, so turning it stays inside the column (a taller box overflows and scrolls the column)
    '.cm-gutters .cm-gutterElement .heynote-fold-marker': {
        display: 'block',
        width: '9px',
        height: '9px',
        cursor: 'pointer',
        backgroundColor: 'currentColor',
        // path centered in its box, so turning it for the folded state doesn't shift it
        mask: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9'%3E%3Cpath d='M2 3.25l2.5 2.5 2.5-2.5' fill='none' stroke='black' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 9px 9px no-repeat`,
        transition: 'transform 200ms var(--ease-out), opacity 150ms ease, background-color 150ms ease',
    },
    '.cm-gutters .cm-gutterElement .heynote-fold-marker:hover': {
        backgroundColor: 'var(--text)',
    },
    '.cm-gutters .cm-gutterElement .heynote-fold-marker.folded': {
        transform: 'rotate(-90deg)',
        backgroundColor: 'var(--text-600)',
    },
    '.cm-gutters .cm-gutterElement span': {
        opacity: 1,
        transition: "opacity 200ms",
    },
    '.cm-foldGutter .cm-gutterElement span[title*="Fold"]': {
        opacity: 0,
    },
    '.cm-gutters:hover .cm-gutterElement span[title*="Fold"]': {
        opacity: 1,
    },
    '.cm-highlightSpace': {
        'background-image': 'radial-gradient(circle at 50% 54%, #aaaaaa60 11%, transparent 5%)',
    },
    '.cm-highlightTab': {
        'background-image': `url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8' standalone='no'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg width='100%25' height='100%25' viewBox='0 0 20 20' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve' xmlns:serif='http://www.serif.com/' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cg%3E%3Cpath d='M15.063,9.457l-12.424,0.061l0,0.978l12.518,-0.061l-2.48,2.526l0.7,0.707l2.917,-2.967l0.006,0.006l0.7,-0.707l-3.599,-3.657l-0.7,0.707l2.362,2.407Z' style='fill-opacity:0.15;'/%3E%3C/g%3E%3C/svg%3E")`,
        'background-position': 'left 90%',
        'background-size': 'auto 100%',
        'background-repeat': 'no-repeat',
    },
    '.heynote-blocks-layer': {
        width: '100%',
    },
    '.heynote-blocks-layer .block-even, .heynote-blocks-layer .block-odd': {
        width: '100%',
        boxSizing: 'content-box',
    },
    // every other block gets a faint tint so consecutive blocks read apart (fainter than the focus band)
    '.heynote-blocks-layer .block-odd': {
        backgroundColor: 'var(--block-alt)',
    },
    // blocks are separated by an edge-to-edge hairline in the gap the delimiter widget leaves between
    // them, centered with 12px of air on either side. The widget lives in the content column, so the
    // rule reaches left under the (transparent) gutter, and the scroller clips it at its edge
    '.heynote-block-start': {
        height: '25px',
        position: 'relative',
    },
    '.heynote-block-start::before': {
        content: '""',
        position: 'absolute',
        top: '12px',
        left: '-100vw',
        right: '0',
        height: '1px',
        background: 'var(--border-200)',
    },
    '.heynote-block-start.first': {
        height: '0px',
    },
    '.heynote-block-start.first::before': {
        display: 'none',
    },
    // full-width band behind the block holding the cursor (see focusBand in block.js). It slides to
    // the next block, and dims while the editor isn't focused. Its edge rows lie on the dividers,
    // which frame it; the last block has no divider below, so the band draws its own
    '.heynote-focus-band-layer': {
        width: '100%',
    },
    '.heynote-focus-band': {
        width: '100%',
        backgroundColor: 'var(--focus-band)',
        transition: 'opacity 200ms ease',
    },
    '.heynote-focus-band.last': {
        boxShadow: 'inset 0 -1px var(--border-200)',
    },
    '.heynote-focus-band.slide': {
        transition: 'top 200ms var(--ease-out), height 200ms var(--ease-out), opacity 200ms ease',
    },
    '&:not(.cm-focused) .heynote-focus-band': {
        opacity: 0.5,
    },
    // one block for all of them: a second key with the same name would replace this one
    '@media (prefers-reduced-motion: reduce)': {
        '.heynote-focus-band.slide': {
            transition: 'opacity 200ms ease',
        },
        '.cm-taskmarker-toggle input[type=checkbox].pop': { animation: 'none' },
        '.cm-task-just-done': { animation: 'heynote-task-fade 200ms ease' },
    },
    '.heynote-math-result': {
        paddingLeft: "12px",
        position: "relative",
    },
    '.heynote-math-result .inner': {
        background: 'var(--fill-100)',
        color: 'var(--text)',
        borderRadius: '6px',
        padding: '0px 4px',
        cursor: 'pointer',
        whiteSpace: "nowrap",
    },
    '.heynote-math-result-copied': {
        position: "absolute",
        top: "0px",
        left: "0px",
        marginLeft: "calc(100% + 10px)",
        width: "60px",
        transition: "opacity 500ms",
        transitionDelay: "1000ms",
        color: "var(--text-600)",
    },
    '.heynote-math-result-copied.fade-out': {
        opacity: 0,
    },
    '.heynote-link': {
        textDecoration: "underline",
    },
    '.heynote-color-preview': {
        display: "inline-block",
        width: "0.8em",
        height: "0.8em",
        marginRight: "0.3em",
        border: "1px solid rgba(128,128,128,0.65)",
        borderRadius: "2px",
        boxSizing: "border-box",
        verticalAlign: "-0.08em",
    },

    ".cm-foldPlaceholder .created-time": {
        float: "right",
        marginRight: "6px",
    },
})

// syntax highlighting with the token roles of ray.so's code themes; light.js and dark.js supply the colors
export function raycastHighlightStyle(c) {
    return HighlightStyle.define([
        { tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword, tags.tagName], color: c.keyword },
        { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.character, tags.monospace, tags.quote], color: c.string },
        { tag: [tags.comment, tags.meta, tags.processingInstruction], color: c.comment, fontStyle: "italic" },
        { tag: [tags.number, tags.bool, tags.atom, tags.null, tags.changed], color: c.number },
        { tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.inserted], color: c.function },
        {
            tag: [tags.propertyName, tags.attributeName, tags.labelName, tags.typeName, tags.className, tags.namespace,
                  tags.constant(tags.name), tags.standard(tags.name), tags.self, tags.escape, tags.color],
            color: c.constant,
        },
        { tag: [tags.operator, tags.separator, tags.angleBracket], color: c.punctuation },
        { tag: [tags.paren, tags.brace, tags.squareBracket, tags.contentSeparator], color: "var(--text-600)" },
        { tag: [tags.link, tags.url], color: c.punctuation, textDecoration: "underline", textUnderlinePosition: "under" },
        { tag: tags.deleted, color: c.deleted },
        { tag: tags.invalid, color: c.deleted, textDecoration: "underline wavy" },
        { tag: tags.heading, fontWeight: "bold" },
        { tag: tags.strong, fontWeight: "bold" },
        { tag: tags.emphasis, fontStyle: "italic" },
        { tag: tags.strikethrough, textDecoration: "line-through" },
    ])
}
