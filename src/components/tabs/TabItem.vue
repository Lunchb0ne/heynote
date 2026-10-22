<script>
    import { mapStores, mapState } from 'pinia'

    import { useHeynoteStore } from "@/src/stores/heynote-store"

    export default {
        name: 'TabItem',
        props: [
            "title",
            "active",
            "path",
        ],
        watch: {
            active: {
                handler(isActive) {
                    if (isActive) {
                        this.$nextTick(() => {
                            this.$el.scrollIntoView({
                                inline: "nearest",
                                block: "nearest",
                            })
                        })
                    }
                },
                immediate: true,
            },
        },
        computed: {
            ...mapStores(useHeynoteStore),

            className() {
                return [
                    "tab-item",
                    ...(this.active ? ["active"] : []),
                ]
            },
        },
        methods: {
            onClose() {
                this.heynoteStore.closeTab(this.path)
            },

            onContextMenu(event) {
                event.preventDefault()
                window.heynote.mainProcess.invoke('showTabContextMenu', this.path)
            },
        },
    }
</script>

<template>
    <li :class="className" :title="title" @contextmenu="onContextMenu">
        <span class="title">{{ title }}</span>
        <button
            @click.stop="onClose"
            @mousedown.prevent
            class="close"
            tabindex="-1"
        ></button>
    </li>
</template>

<style lang="sass" scoped>
    // tabs sized to their names. The active one is a raised chip (lit top edge, hairline, soft shadow);
    // hairlines separate the others, and give way next to the active or hovered tab. The close button
    // sits in the leading padding, Safari style: always on the active tab, on hover for the rest.
    li
        position: relative
        height: 26px
        line-height: 26px
        margin-right: 3px
        padding: 0 22px
        cursor: pointer
        border-radius: 7px
        user-select: none
        color: var(--text-600)
        flex: 0 1 auto
        min-width: 48px
        max-width: 220px
        box-sizing: border-box
        text-align: center
        transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease
        --chip-bg: rgb(255 255 255 / 0.75)
        --chip-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.08), 0 1px 1px rgb(0 0 0 / 0.04)
        +dark-mode
            --chip-bg: var(--fill-100)
            --chip-shadow: inset 0 0.5px 0 rgb(255 255 255 / 0.12), 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 1px 3px rgb(0 0 0 / 0.25)
        & + li::before
            content: ""
            position: absolute
            left: -2px
            top: 7px
            height: 12px
            width: 1px
            background: var(--border)
            transition: opacity 150ms ease
        &.active::before, &.active + li::before, &:hover::before, &:hover + li::before
            opacity: 0
        &:hover
            background: var(--fill-50)
            color: var(--text)
            transition-duration: 0ms
        &:hover .close, &.active .close
            opacity: 1
            pointer-events: auto
        &.active
            background: var(--chip-bg)
            box-shadow: var(--chip-shadow)
            color: var(--text)
            .blurred &
                color: var(--text-600)
                box-shadow: none

        .title
            display: inline-block
            vertical-align: top
            white-space: nowrap
            max-width: 100%
            text-overflow: ellipsis
            overflow: hidden
        .close
            opacity: 0
            pointer-events: none
            position: absolute
            left: 4px
            top: 5px
            width: 16px
            height: 16px
            background: none
            border: none
            padding: 0
            background-image: url(@/assets/icons/close.svg)
            background-repeat: no-repeat
            background-size: 12px
            background-position: center center
            border-radius: 4px
            cursor: pointer
            +press(opacity 120ms ease)
            +dark-mode
                background-image: url(@/assets/icons/close-dark.svg)
            &:hover
                background-color: var(--fill-100)
</style>
