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
    ".cm-content": {
        caretColor: "var(--text)",
        paddingTop: 4,
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--text)",
        borderLeftWidth: '2px',
        paddingTop: '4px',
        marginTop: '-2px',
        boxSizing: 'content-box',
    },
    ".cm-activeLine": { backgroundColor: "var(--fill-25)" },
    ".cm-selectionMatch": { backgroundColor: "var(--fill-100)" },
    "&.cm-focused .cm-matchingBracket": {
        backgroundColor: "var(--fill-100)",
        outline: "1px solid var(--border-200)",
        color: "inherit",
    },
    "&.cm-focused .cm-nonmatchingBracket": {
        outline: "1px solid var(--accent)",
    },
    ".cm-gutters": {
        backgroundColor: "transparent",
        color: "var(--text-250)",
        border: "none",
        padding: '0 2px 0 4px',
        userSelect: 'none',
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "var(--text-600)",
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
    ".cm-taskmarker-toggle input[type=checkbox]": {
        accentColor: "var(--accent)",
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
        borderTop: '1px solid var(--border)',
    },
    '.heynote-blocks-layer .block-odd': {
        background: 'var(--fill-25)',
    },
    '.heynote-blocks-layer .block-even:first-child': {
        borderTop: 'none',
    },
    '.heynote-block-start': {
        height: '12px',
    },
    '.heynote-block-start.first': {
        height: '0px',
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
