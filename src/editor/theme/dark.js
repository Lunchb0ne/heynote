import { EditorView } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';

import { raycastHighlightStyle } from "./base.js";

const darkTheme = EditorView.theme({
    '.cm-highlightSpace': {
        'background-image': 'radial-gradient(circle at 50% 54%, #aaaaaa40 11%, transparent 5%)',
    },
    '.cm-highlightTab': {
        'background-image': `url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8' standalone='no'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg width='100%25' height='100%25' viewBox='0 0 20 20' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve' xmlns:serif='http://www.serif.com/' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cg%3E%3Cpath d='M15.063,9.457l-12.424,0.061l0,0.978l12.518,-0.061l-2.48,2.526l0.7,0.707l2.917,-2.967l0.006,0.006l0.7,-0.707l-3.599,-3.657l-0.7,0.707l2.362,2.407Z' style='fill:%23fff;fill-opacity:0.15;'/%3E%3C/g%3E%3C/svg%3E")`,
    },
}, { dark: true });

// ray.so "Candy" (dark)
const darkHighlightStyle = raycastHighlightStyle({
    keyword: "#FF659C",
    string: "#DFD473",
    comment: "#807796",
    constant: "#1AC8FF",
    function: "#73DFA5",
    number: "#7A7FFD",
    punctuation: "#FF659C",
})

const heynoteDark = [
    darkTheme,
    syntaxHighlighting(darkHighlightStyle)
];

export { heynoteDark, darkHighlightStyle, darkTheme };
