<script>
    import { mapStores, mapState, mapWritableState } from 'pinia'
    import draggable from 'vuedraggable'

    import { useEditorCacheStore } from "@/src/stores/editor-cache"
    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSettingsStore } from "@/src/stores/settings-store"

    import TabItem from './TabItem.vue'
    import MainMenuButton from './MainMenuButton.vue'

    export default {
        components: {
            TabItem,
            MainMenuButton,
            draggable,
        },

        data() {
            return {
                isMac: window.heynote.platform.isMac,
            }
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "isFocused",
                "currentBufferName",
                "showLeftPanel",
            ]),
            ...mapState(useSettingsStore, [
                "theme",
                "settings",
            ]),
            ...mapWritableState(useHeynoteStore, ["openTabs"]),
            ...mapStores(useEditorCacheStore, useHeynoteStore),

            tabs() {
                return this.openTabs.map((path) => {
                    //console.log("tab:", path)
                    return {
                        path: path,
                        title: this.heynoteStore.getBufferTitle(path),
                        active: path === this.heynoteStore.currentBufferPath,
                    }
                })
            },

            className() {
                return {
                    "tab-bar": true,
                    "blurred": !this.isFocused,
                }
            },

            showTabs() {
                return this.settings.showTabs
            },
        },

        methods: {
            openBufferSelector() {
                this.heynoteStore.openBufferSelector()
            },

            dragEnd(event) {
                //console.log("drag end:", event)
                this.heynoteStore.focusEditor()
                this.openTabs.splice(event.newIndex, 0, this.openTabs.splice(event.oldIndex, 1)[0])
                this.heynoteStore.saveTabsState()
            },
        },
    }
</script>

<template>
    <nav :class="className">
        <MainMenuButton v-if="!showLeftPanel" />
        <template v-if="showTabs">
            <div class="scroller" tabindex="-1">
                <draggable 
                    :list="tabs" 
                    tag="ol"
                    group="tabs" 
                    ghost-class="ghost"
                    @end="dragEnd" 
                    item-key="path"
                >
                    <template #item="{element, index}">
                        <TabItem
                            :path="element.path"
                            :title="element.title"
                            :active="element.active"
                            @click.prevent="heynoteStore.openBuffer(element.path)"
                            @mouseup="heynoteStore.focusEditor"
                        />
                    </template>
                    <template #footer>
                        <li class="spacer"></li>
                    </template>
                </draggable>
            </div>
            <div class="button-container">
                <button 
                    @click="openBufferSelector"
                    class="add-tab"
                    tabindex="-1"
                ></button>
            </div>
        </template>
        <div 
            v-else
            class="title"
        >
            {{ currentBufferName }}
        </div>
    </nav>
</template>

<style lang="sass" scoped>
    .tab-bar
        app-region: drag
        display: flex
        height: var(--tab-bar-height)
        padding: 0
        border-bottom: 1px solid var(--border)
        
        +platform-windows-linux
            padding-right: 140px
        +platform-windows-linux-fullscreen
            padding-right: 0
        
        .scroller
            margin-top: 4px
            //flex-grow: 1
            //width: 100%
            overflow-x: auto
            scrollbar-width: none
            app-region: none
            ol
                display: flex
                list-style: none
                margin: 0
                padding: 0
                > li.spacer
                    flex-shrink: 0
                    width: 7px
        .button-container
            app-region: drag
            padding-top: 0
            padding-left: 8px
            padding-right: 8px
            display: flex
            align-items: center
            .add-tab
                app-region: none
                width: 20px
                height: 20px
                border: none
                background: none
                border-radius: 6px
                cursor: pointer
                transition: background-color 250ms
                background-image: url("@/assets/icons/plus-light.svg")
                background-repeat: no-repeat
                background-position: center
                background-size: 14px
                +dark-mode
                    background-image: url("@/assets/icons/plus-dark.svg")
                &:hover
                    transition: none
                    background-color: var(--fill-100)
        
        .title
            pointer-events: none
            text-align: center
            position: absolute
            left: 0
            top: 0
            right: 0
            height: var(--tab-bar-height)
            line-height: var(--tab-bar-height)
            padding: 0 80px
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
            font-family: var(--system-font)
            font-size: 13px
            font-weight: 600
            color: var(--text-600)
            +platform-windows-linux
                padding: 0 140px

        &.blurred .title
            color: var(--text-400)

</style>
