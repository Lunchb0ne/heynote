import { syntaxHighlighting } from '@codemirror/language';

import { raycastHighlightStyle } from "./base.js";

// ray.so "Candy" (light)
const highlightStyle = raycastHighlightStyle({
    keyword: "#DC155E",
    string: "#B2762E",
    comment: "#8D949B",
    constant: "#2286A6",
    function: "#009033",
    number: "#676DFF",
    punctuation: "#D15A8B",
})

const heynoteLight = [
    syntaxHighlighting(highlightStyle),
];

export { heynoteLight };
