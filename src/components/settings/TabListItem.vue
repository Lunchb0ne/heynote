<script>
    export default {
        props: ["tab", "activeTab", "name"],

        computed: {
            tabClass() {
                return "tab-" + this.tab + " " + (this.tab === this.activeTab ? "active" : "")
            }
        }
    }
</script>

<template>
    <li :class="tabClass"><span class="icon"></span>{{ name }}</li>
</template>

<style scoped lang="sass">
    // System Settings style: a white glyph on a coloured rounded square, set per pane below
    =pane-icon($from, $to, $glyph)
        .icon
            background: linear-gradient($from, $to)
            &::after
                mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='black' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E#{$glyph}%3C/svg%3E")

    li
        display: flex
        align-items: center
        gap: 9px
        height: 32px
        padding: 0 8px
        margin-bottom: 2px
        border-radius: 7px
        font-size: 13px
        user-select: none
        cursor: pointer
        color: var(--text-600)
        transition: background-color 120ms ease, color 120ms ease
        .icon
            position: relative
            flex-shrink: 0
            width: 20px
            height: 20px
            border-radius: 5px
            box-shadow: inset 0 0.5px 0 rgb(255 255 255 / 0.3), 0 0.5px 1px rgb(0 0 0 / 0.2)
            &::after
                content: ""
                position: absolute
                inset: 3px
                background: #fff
                mask: center / contain no-repeat
        &:hover
            background: var(--fill-50)
            color: var(--text)
        &.active
            background: var(--fill-100)
            color: var(--text)
            cursor: default

        &.tab-general
            +pane-icon(#a1a1a6, #7c7c82, "%3Cpath fill='none' d='M2.5 5h11M2.5 11h11'/%3E%3Ccircle cx='6' cy='5' r='1.8'/%3E%3Ccircle cx='10.5' cy='11' r='1.8'/%3E")
        &.tab-editing
            +pane-icon(#ffb340, #ff9500, "%3Cpath fill='none' d='M10.5 2.5l3 3-7.5 7.5H3v-3z'/%3E")
        &.tab-appearance
            +pane-icon(#8a87ff, #5e5ce6, "%3Ccircle fill='none' cx='8' cy='8' r='5.5'/%3E%3Cpath stroke='none' d='M8 2.5a5.5 5.5 0 0 0 0 11z'/%3E")
        &.tab-keyboard-bindings
            +pane-icon(#5eaaff, #0a7cff, "%3Crect fill='none' x='1.75' y='3.75' width='12.5' height='8.5' rx='1.5'/%3E%3Cpath fill='none' d='M5.5 9.5h5'/%3E%3Cg stroke='none'%3E%3Ccircle cx='4.5' cy='6.5' r='.8'/%3E%3Ccircle cx='7' cy='6.5' r='.8'/%3E%3Ccircle cx='9.5' cy='6.5' r='.8'/%3E%3Ccircle cx='11.5' cy='6.5' r='.8'/%3E%3C/g%3E")
        &.tab-updates
            +pane-icon(#4cd964, #24b04a, "%3Cpath fill='none' d='M13 8a5 5 0 1 1-1.46-3.54'/%3E%3Cpath fill='none' d='M12 1.75V4.5H9.25'/%3E")
</style>
