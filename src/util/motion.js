// a small side-to-side shake for an action the app refused (closing the last tab, a bad buffer name).
// It uses the translate property, so it composes with the element's own transform. With Reduce
// Motion on, the element dims for a moment instead.
export function shake(el) {
    if (!el) {
        return
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.animate([{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], { duration: 300, easing: "ease" })
        return
    }
    el.animate(
        [{ translate: "0" }, { translate: "-4px" }, { translate: "4px" }, { translate: "-2px" }, { translate: "2px" }, { translate: "0" }],
        { duration: 320, easing: "ease-out" },
    )
}
