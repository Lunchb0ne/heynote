import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const raycastTheme = EditorView.theme({
    '&': {
        color: '#e0e0e0',
        backgroundColor: 'transparent'
    },
    '.cm-content': {
        caretColor: '#fff',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#fff' },
    '.cm-selectionBackground': {
        backgroundColor: 'rgba(255, 99, 99, 0.2)', // Raycast red transparent
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: 'rgba(255, 99, 99, 0.4)',
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": 'rgba(255, 99, 99, 0.1)',
    },
    '.cm-panels': {
        backgroundColor: "rgba(30, 30, 30, 0.6)",
        color: "#c0c0c0",
        backdropFilter: "blur(10px)"
    },
    '.cm-panels .cm-textfield': {
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
    },
    '.cm-panels .cm-textfield:focus': {
        border: "1px solid #ff6363",
        outline: "1px solid #ff6363",
    },
    '.cm-panels .cm-button': {
        background: "rgba(255,255,255, 0.1)",
        color: "rgba(255,255,255, 0.8)",
        border: "none",
    },
    ".cm-panel.cm-search [name=close]" : {
        color: "rgba(255,255,255, 0.8)",
    },
    ".cm-searchMatch": {
        backgroundColor: "rgba(255, 99, 99, 0.3)",
    },
    ".cm-searchMatch-selected": {
        backgroundColor: "rgba(255, 99, 99, 0.6)",
        outline: "1px solid #ff6363",
    },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
    '.cm-selectionMatch': {
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    '&.cm-focused .cm-matchingBracket': {
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: "inherit",
    },
    '&.cm-focused .cm-nonmatchingBracket': {
        outline: `0.5px solid #ff6363`
    },
    '.cm-gutters': {
        backgroundColor: 'transparent',
        color: 'rgba(255,255,255, 0.2)',
        border: 'none',
    },
    '.cm-activeLineGutter': {
        backgroundColor: "transparent",
        color: 'rgba(255,255,255, 0.8)'
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#aaa'
    },
    '.cm-tooltip': {
        border: 'none',
        backgroundColor: 'rgba(20, 20, 20, 0.8)',
        backdropFilter: 'blur(10px)'
    },
    ".heynote-blocks-layer .block-even": {
        background: "rgba(255, 255, 255, 0.02)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    },
    ".heynote-blocks-layer .block-odd": {
        background: "transparent",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    },
    ".heynote-math-result .inner": {
        background: "rgba(255, 99, 99, 0.2)",
        color: "#ff8b8b",
        boxShadow: '0 0 3px rgba(0,0,0, 0.3)',
    },
    '.heynote-math-result-copied': {
        color: "rgba(255, 200, 200, 1.0)",
    },
    '.cm-highlightSpace': {
        'background-image': 'radial-gradient(circle at 50% 54%, rgba(255,255,255,0.2) 11%, transparent 5%)',
    },
}, { dark: true });

const raycastHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: '#ff6363' },
    { tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: '#ff8b8b' },
    { tag: [tags.variableName], color: '#d0d0d0' },
    { tag: [tags.function(tags.variableName)], color: '#f0f0f0' },
    { tag: [tags.labelName], color: '#ffb3b3' },
    { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#ff6363' },
    { tag: [tags.definition(tags.name), tags.separator], color: '#e0e0e0' },
    { tag: [tags.brace], color: '#aaa' },
    { tag: [tags.annotation], color: '#ff6363' },
    { tag: [tags.number, tags.changed, tags.modifier, tags.self, tags.namespace], color: '#ffb3b3' },
    { tag: [tags.typeName, tags.className], color: '#ff8b8b' },
    { tag: [tags.operator, tags.operatorKeyword], color: '#aaa' },
    { tag: [tags.tagName], color: '#ff6363' },
    { tag: [tags.squareBracket], color: '#aaa' },
    { tag: [tags.angleBracket], color: '#aaa' },
    { tag: [tags.attributeName], color: '#ff8b8b' },
    { tag: [tags.regexp], color: '#ffb3b3' },
    { tag: [tags.quote], color: '#ff8b8b' },
    { tag: [tags.string], color: '#ffb3b3' },
    { tag: tags.link, color: '#ff6363', textDecoration: 'underline' },
    { tag: [tags.url, tags.escape, tags.special(tags.string)], color: '#ff8b8b' },
    { tag: [tags.meta], color: '#888' },
    { tag: [tags.monospace], color: '#d0d0d0', fontStyle: 'italic' },
    { tag: [tags.comment], color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold', color: '#fff' },
    { tag: tags.emphasis, fontStyle: 'italic', color: '#fff' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.heading, fontWeight: 'bold', color: '#ff6363' },
    { tag: tags.special(tags.heading1), fontWeight: 'bold', color: '#ff6363' },
    { tag: tags.heading1, fontWeight: 'bold', color: '#ff6363' },
    { tag: [tags.heading2, tags.heading3, tags.heading4], fontWeight: 'bold', color: '#ff6363' },
    { tag: [tags.heading5, tags.heading6], color: '#ff6363' },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#ff8b8b' },
    { tag: [tags.processingInstruction, tags.inserted], color: '#ff8b8b' },
    { tag: [tags.contentSeparator], color: '#ffb3b3' },
    { tag: tags.invalid, color: '#fff', borderBottom: `1px dotted #ff6363` }
]);

const heynoteRaycast = [
    raycastTheme,
    syntaxHighlighting(raycastHighlightStyle)
];

export { heynoteRaycast, raycastHighlightStyle, raycastTheme };
