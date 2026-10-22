import { EditorView } from "@codemirror/view";
import { syntaxHighlighting } from '@codemirror/language';

import { raycastHighlightStyle } from "./base.js";

const selection = "rgb(0 122 255 / 0.22)"
const selectionBlur = "rgb(0 0 0 / 0.08)"

const lightTheme = EditorView.theme({
    ".cm-selectionBackground": {
        background: selectionBlur,
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        background: selection,
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": selection,
    },
})

// ray.so "Candy" (light)
const highlightStyle = raycastHighlightStyle({
    keyword: "#DC155E",
    string: "#B2762E",
    comment: "#8D949B",
    constant: "#2286A6",
    function: "#009033",
    number: "#676DFF",
    punctuation: "#D15A8B",
    deleted: "#FF605E",
})

const heynoteLight = [
    lightTheme,
    syntaxHighlighting(highlightStyle),
];

export { heynoteLight };
