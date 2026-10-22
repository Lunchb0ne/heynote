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
        data() {
            return {
                textWidth: 0,
            }
        },
        mounted: function() {
            this.measureTextWidth()
        },
        watch: {
            title() {
                this.measureTextWidth()
            },

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
                    ...[this.textWidth > 120 ? "long" : "short"],
                ]
            },
        },
        methods: {
            measureTextWidth() {
                // measure the width of the tab which we use to give it either the "short" or "long" class
                const temp = document.createElement('span')
                temp.style.visibility = 'hidden'
                temp.style.position = 'absolute'
                temp.style.whiteSpace = 'nowrap'
                temp.style.padding = window.getComputedStyle(this.$el).padding
                temp.style.font = window.getComputedStyle(this.$el).font
                temp.textContent = this.$el.textContent
                document.body.appendChild(temp)
                this.textWidth = temp.offsetWidth
                document.body.removeChild(temp)
                //console.log("textWidth:", this.textWidth)
            },

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
    li
        position: relative
        height: 22px
        line-height: 22px
        margin-right: 2px
        padding: 0 20px
        cursor: pointer
        border-radius: 6px
        user-select: none
        color: var(--text-600)
        overflow: hidden
        flex-grow: 0
        flex-shrink: 1
        flex-basis: auto
        min-width: 84px
        text-align: center
        transition: background-color 150ms
        &.short
            width: 120px
        &.long
            width: max-content
            max-width: 300px
        &:hover
            background: var(--fill-50)
            color: var(--text)
            transition: none
            .close
                display: block
        &.active
            background: var(--fill-100)
            color: var(--text)
            transition: none
            .blurred &
                color: var(--text-600)
        
        .title
            display: inline-block
            vertical-align: top
            white-space: nowrap
            max-width: 100%
            text-overflow: ellipsis
            overflow: hidden
        .close
            display: none
            position: absolute
            right: 3px
            top: 3px
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
            +dark-mode
                background-image: url(@/assets/icons/close-dark.svg)
            &:hover
                background-color: var(--fill-100)
</style>
