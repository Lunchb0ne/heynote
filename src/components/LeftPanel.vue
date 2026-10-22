<script>
    import { mapState, mapStores, mapWritableState } from "pinia"

    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSettingsStore } from "@/src/stores/settings-store"

    import MainMenuButton from "./tabs/MainMenuButton.vue"
    import BufferTree from "./buffer-tree/BufferTree.vue"
    import LibrarySearch from "./library-search/LibrarySearch.vue"


    export default {
        components: {
            MainMenuButton,
            BufferTree,
            LibrarySearch,
        },

        data() {
            return {
                isResizing: false,
                resizeStartX: 0,
                resizeStartWidth: 0,
            }
        },

        mounted() {
            this.$refs.resizer.addEventListener("mousedown", this.onResizerMouseDown)
        },

        beforeUnmount() {
            this.$refs.resizer?.removeEventListener("mousedown", this.onResizerMouseDown)
            window.removeEventListener("mousemove", this.onWindowMouseMove)
            window.removeEventListener("mouseup", this.onWindowMouseUp)
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "isFocused",
            ]),
            ...mapWritableState(useHeynoteStore, [
                "currentLeftPanel",
            ]),
            ...mapState(useSettingsStore, [
                "theme",
            ]),
            ...mapStores(useHeynoteStore, useSettingsStore),

            resizerClass() {
                return {
                    resizer: true,
                    resizing: this.isResizing,
                }
            },
        },

        watch: {
            currentLeftPanel(newPanel, oldPanel) {
                if (oldPanel === "search" && newPanel !== "search") {
                    this.heynoteStore.hideLeftPanelOnLibrarySearchEscape = false
                }
            },
        },

        methods: {
            onResizerMouseDown(event) {
                if (event.button !== 0) {
                    return
                }
                event.preventDefault()
                this.isResizing = true
                this.resizeStartX = event.clientX
                this.resizeStartWidth = this.$el.getBoundingClientRect().width
                window.addEventListener("mousemove", this.onWindowMouseMove)
                window.addEventListener("mouseup", this.onWindowMouseUp)
            },

            onWindowMouseMove(event) {
                if (!this.isResizing) {
                    return
                }
                const delta = event.clientX - this.resizeStartX
                const width = this.resizeStartWidth + delta
                const minWidth = 120
                const maxWidth = Math.max(minWidth, Math.min(800, window.innerWidth - 200))
                const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth))
                this.heynoteStore.leftPanelWidth = clampedWidth
            },

            onWindowMouseUp() {
                if (!this.isResizing) {
                    return
                }
                this.isResizing = false
                window.removeEventListener("mousemove", this.onWindowMouseMove)
                window.removeEventListener("mouseup", this.onWindowMouseUp)
                const width = Math.round(this.heynoteStore.leftPanelWidth)
                if (this.settingsStore.settings.leftPanelWidth !== width) {
                    this.settingsStore.updateSettings({
                        leftPanelWidth: width,
                    })
                }
            },
        },
    }
</script>

<template>
    <aside class="left-panel">
        <div class="top-bar">
            <MainMenuButton />
        </div>
        <div class="left-panel-content">
            <BufferTree v-if="currentLeftPanel == 'buffer-tree'" />
            <LibrarySearch v-if="currentLeftPanel == 'search'" />
        </div>
        <div class="left-panel-tab-buttons">
            <button
                @click="() => currentLeftPanel='buffer-tree'"
                :class="{selected:currentLeftPanel=='buffer-tree'}"
            ><i class="icon buffers"></i>Buffers</button>
            <button
                @click="() => currentLeftPanel='search'"
                :class="{selected:currentLeftPanel=='search'}"
            ><i class="icon search"></i>Search</button>
        </div>
        <div
            :class="resizerClass"
            ref="resizer"
        ></div>
    </aside>
</template>

<style scoped lang="sass">
    .left-panel
        --resizer-color: var(--text-250)

        width: var(--left-panel-width)
        flex-shrink: 0
        height: 100%
        min-height: 0
        display: flex
        flex-direction: column
        position: relative

        .top-bar
            height: var(--tab-bar-height)
            flex-shrink: 0
            app-region: drag
            display: flex

        .left-panel-content
            flex-grow: 1
            min-height: 0

        .left-panel-tab-buttons
            app-region: none
            padding: 4px
            gap: 4px
            display: flex
            align-items: center
            width: 100%
            box-sizing: border-box
            border-top: 1px solid var(--border)
            button
                flex: 1
                background: none
                border: none
                border-radius: 6px
                padding: 4px 8px
                color: var(--text-600)
                cursor: pointer
                font-size: 12px
                &:focus
                    outline: none
                &:focus-visible
                    box-shadow: inset 0 0 0 2px var(--text-400)
                &:hover
                    background-color: var(--fill-50)
                    color: var(--text)
                &.selected
                    background-color: var(--fill-100)
                    color: var(--text)
                .icon
                    display: inline-block
                    width: 12px
                    height: 12px
                    background-size: 100%
                    background-repeat: no-repeat
                    margin-right: 5px
                    position: relative
                    top: 1px
                    &.buffers
                        background-image: url('@/assets/icons/files-light.svg')
                        +dark-mode
                            background-image: url('@/assets/icons/files-dark.svg')
                    &.search
                        background-image: url('@/assets/icons/search-light.svg')
                        width: 13px
                        height: 13px
                        top: 2px
                        +dark-mode
                            background-image: url('@/assets/icons/search-dark.svg')
        
        .resizer
            position: absolute
            top: 0
            right: 0
            bottom: 0
            width: 4px
            background-color: transparent
            transition: background-color 200ms ease
            cursor: col-resize
            &:hover
                background-color: var(--resizer-color)
                transition-delay: 300ms
            &.resizing
                background-color: var(--resizer-color)
</style>
