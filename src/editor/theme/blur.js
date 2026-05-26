import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';


// Colors from https://www.nordtheme.com/docs/colors-and-palettes
// Polar Night
const base00 = '#2e3440', // black
base01 = '#3b4252', // dark grey
base02 = '#434c5e', base03 = '#4c566a'; // grey
// Snow Storm
const base04 = '#d8dee9', // grey
base05 = '#c7cad0', // off white
base06 = '#eceff4'; // white
// Frost
const base07 = '#8fbcbb', // moss green
base08 = '#88c0d0', // ice blue
base09 = '#81a1c1', // water blue
base0A = '#5e81ac'; // deep blue
// Aurora
const base0b = '#bf616a', // red
base0C = '#d08770', // orange
base0D = '#ebcb8b', // yellow
base0E = '#a3be8c', // green
base0F = '#b48ead', // purple
base10 = '#c6c097'; // light yellow

const invalid = '#d30102', darkBackground = 'rgba(30, 30, 30, 0.85)', background = 'rgba(20, 24, 28, 0.75)', tooltipBackground = 'rgba(59, 66, 82, 0.95)', cursor = '#fff';
const highlightBackground = 'rgba(255,255,255,0.05)';

const lineNumberColor = 'rgba(255,255,255, 0.2)';
const commentColor = '#888d97';
const matchingBracket = 'rgba(255,255,255,0.15)';
const selection = "rgba(8, 101, 169, 0.5)";
const selectionBlur = "rgba(34, 83, 119, 0.4)";


const blurTheme = EditorView.theme({
    '&': {
        color: base04,
        backgroundColor: background,
    },
    '.cm-content': {
        caretColor: cursor,
        backgroundColor: 'transparent',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: cursor },
    '.cm-selectionBackground': {
        backgroundColor: selectionBlur,
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: selection,
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": selection,
    },
    '.cm-panels': {
        backgroundColor: "rgba(71, 71, 71, 0.9)",
        color: "#9c9c9c",
        backdropFilter: "blur(10px)",
    },
    ".cm-panels .cm-panel": {
        //boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    },
    '.cm-panels .cm-textfield': {
        backgroundColor: "rgba(59, 59, 59, 0.9)",
        border: "1px solid rgba(90, 90, 90, 0.8)",
        color: "#fff",
    },
    '.cm-panels .cm-textfield:focus': {
        border: "1px solid #48b57e",
        outline: "1px solid #48b57e",
    },
    '.cm-panels .cm-button': {
        background: "rgba(95, 95, 95, 0.9)",
        color: "rgba(255,255,255, 0.6)",
        border: "none",
    },
    ".cm-panel.cm-search [name=close]" : {
        color: "rgba(255,255,255, 0.8)",
    },

    ".cm-searchMatch": {
        backgroundColor: "rgba(165, 87, 72, 0.7)",
    },
    ".cm-searchMatch-selected": {
        backgroundColor: "rgba(199, 12, 12, 0.8)",
        outline: "1px solid rgba(255, 46, 46, 0.6)",
    },

    '.cm-activeLine': { backgroundColor: highlightBackground },
    '.cm-selectionMatch': {
        backgroundColor: "rgba(80, 109, 105, 0.5)",
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        outline: `0.5px solid ${base07}`
    },
    '&.cm-focused .cm-matchingBracket': {
        backgroundColor: matchingBracket,
        color: "inherit",
    },
    '&.cm-focused .cm-nonmatchingBracket': {
        outline: `0.5px solid #bc8f8f`
    },
    '.cm-gutters': {
        backgroundColor: 'rgba(0,0,0, 0.15)',
        color: lineNumberColor,
        border: 'none',
    },
    '.cm-activeLineGutter': {
        backgroundColor: "transparent",
        color: 'rgba(255,255,255, 0.6)'
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ddd'
    },
    '.cm-tooltip': {
        border: 'none',
        backgroundColor: tooltipBackground,
        backdropFilter: "blur(10px)",
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: tooltipBackground,
        borderBottomColor: tooltipBackground
    },
    '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
            backgroundColor: highlightBackground,
            color: base03
        }
    },
    ".heynote-blocks-layer .block-even": {
        background: "rgba(37, 43, 55, 0.5)",
        borderTop: "1px solid rgba(30, 34, 42, 0.5)",
    },
    ".heynote-blocks-layer .block-odd": {
        background: "rgba(33, 54, 68, 0.5)",
        borderTop: "1px solid rgba(30, 34, 42, 0.5)",
    },
    ".heynote-math-result .inner": {
        background: "rgba(14, 18, 23, 0.9)",
        color: "#96cbb4",
        boxShadow: '0 0 3px rgba(0,0,0, 0.3)',
        backdropFilter: "blur(10px)",
    },
    '.heynote-math-result-copied': {
        color: "rgba(220,240,230, 1.0)",
    },

    '.cm-highlightSpace': {
        'background-image': 'radial-gradient(circle at 50% 54%, rgba(170, 170, 170, 0.3) 11%, transparent 5%)',
    },
    '.cm-highlightTab': {
        'background-image': `url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8' standalone='no'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg width='100%25' height='100%25' viewBox='0 0 20 20' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve' xmlns:serif='http://www.serif.com/' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cg%3E%3Cpath d='M15.063,9.457l-12.424,0.061l0,0.978l12.518,-0.061l-2.48,2.526l0.7,0.707l2.917,-2.967l0.006,0.006l0.7,-0.707l-3.599,-3.657l-0.7,0.707l2.362,2.407Z' style='fill:%23fff;fill-opacity:0.15;'/%3E%3C/g%3E%3C/svg%3E")`,
    },
}, { dark: true });

/**
The highlighting styles for the blur theme (same as dark theme).
*/
const blurHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: base0A },
    {
        tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName],
        color: base08
    },
    { tag: [tags.variableName], color: base07 },
    { tag: [tags.function(tags.variableName)], color: base10 },
    { tag: [tags.labelName], color: base09 },
    {
        tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
        color: base0A
    },
    { tag: [tags.definition(tags.name), tags.separator], color: base0E },
    { tag: [tags.brace], color: base07 },
    {
        tag: [tags.annotation],
        color: invalid
    },
    {
        tag: [tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace],
        color: base0F
    },
    {
        tag: [tags.typeName, tags.className],
        color: base0D
    },
    {
        tag: [tags.operator, tags.operatorKeyword],
        color: base05,
    },
    {
        tag: [tags.tagName],
        color: base0F
    },
    {
        tag: [tags.squareBracket],
        color: base0b
    },
    {
        tag: [tags.angleBracket],
        color: base0C
    },
    {
        tag: [tags.attributeName],
        color: base0D
    },
    {
        tag: [tags.regexp],
        color: base0A
    },
    {
        tag: [tags.quote],
        color: base0F
    },
    { tag: [tags.string], color: base0E },
    {
        tag: tags.link,
        color: base0E,
        textDecoration: 'underline',
        textUnderlinePosition: 'under'
    },
    {
        tag: [tags.url, tags.escape, tags.special(tags.string)],
        color: base07
    },
    { tag: [tags.meta], color: base08 },
    { tag: [tags.monospace], color: base04, fontStyle: 'italic' },
    { tag: [tags.comment], color: commentColor, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold', color: base0A },
    { tag: tags.emphasis, fontStyle: 'italic', color: base0A },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.heading, fontWeight: 'bold', color: base0A },
    { tag: tags.special(tags.heading1), fontWeight: 'bold', color: base0A },
    { tag: tags.heading1, fontWeight: 'bold', color: base0A },
    {
        tag: [tags.heading2, tags.heading3, tags.heading4],
        fontWeight: 'bold',
        color: base0A
    },
    {
        tag: [tags.heading5, tags.heading6],
        color: base0A
    },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: base0C },
    {
        tag: [tags.processingInstruction, tags.inserted],
        color: base07
    },
    {
        tag: [tags.contentSeparator],
        color: base0D
    },
    { tag: tags.invalid, color: base02, borderBottom: `1px dotted ${invalid}` }
]);


const heynoteBlur = [
    blurTheme,
    syntaxHighlighting(blurHighlightStyle)
];

export { heynoteBlur, blurHighlightStyle, blurTheme };
