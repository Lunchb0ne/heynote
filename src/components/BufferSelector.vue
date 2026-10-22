<script>
    import fuzzysort from 'fuzzysort'

    import { mapState, mapActions } from 'pinia'
    import { SCRATCH_FILE_NAME } from "../common/constants"
    import { useHeynoteStore } from "../stores/heynote-store"
    import { useSettingsStore } from "../stores/settings-store"
    import { HEYNOTE_COMMANDS } from "../editor/commands"

    const pathSep = window.heynote.buffer.pathSeparator

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }

    export default {
        props: {
            headline: String,
            initialFilter: String,
            commandsEnabled: Boolean,
        },
        
        data() {
            return {
                selected: 0,
                actionButton: 0,
                filter: this.initialFilter || "",
                items: [],
                SCRATCH_FILE_NAME: SCRATCH_FILE_NAME,
                deleteConfirm: false,
            }
        },

        async mounted() {
            await this.updateBuffers()
            this.$refs.container.focus()
            this.$refs.input.focus()
            this.buildItems()
            if (this.items.length > 1 && !this.initialFilter?.startsWith(">")) {
                this.selected = 1
            }
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "buffers",
                "recentBufferPaths",
            ]),
            ...mapState(useSettingsStore, [
                "commandKeyBindingsMap",
            ]),

            commands() {
                const commands = Object.entries(HEYNOTE_COMMANDS)
                // sort array first by category, then by description
                commands.sort((a, b) => {
                    const aCategory = a[1].category || ""
                    const bCategory = b[1].category || ""
                    if (aCategory === bCategory) {
                        return a[1].description.localeCompare(b[1].description)
                    } else {
                        return aCategory.localeCompare(bCategory)
                    }
                })
                return commands.map(([cmdKey, cmd]) => ({
                    name: `${cmd.category}: ${cmd.description}`,
                    cmd: cmdKey,
                    isCommand: true,
                    bindings: this.commandKeyBindingsMap[cmdKey],
                }))
            },

            orderedItems() {
                const sortKeys = Object.fromEntries(this.recentBufferPaths.map((item, idx) => [item, idx]))
                const getSortScore = (item) => sortKeys[item.path] !== undefined ? sortKeys[item.path] : 1000
                const compareFunc = (a, b) => {
                    const sortScore = getSortScore(a) - getSortScore(b)
                    if (sortScore !== 0) {
                        // sort by recency first
                        return sortScore
                    } else {
                        // then notes in root
                        const aIsRoot = a.path.indexOf(pathSep) === -1
                        const bIsRoot = b.path.indexOf(pathSep) === -1
                        if (aIsRoot && !bIsRoot) {
                            return -1
                        } else if (!aIsRoot && bIsRoot) {
                            return 1
                        } else {
                            // last sort by path
                            return a.path.localeCompare(b.path)
                        }
                    }
                }
                return [...this.items].sort(compareFunc)
            },

            filteredItems() {
                if (this.commandsEnabled && this.filter.startsWith(">")) {
                    // command mode if the first character is ">"
                    if (this.filter.length < 2) {
                        return this.commands
                    }
                    const searchResults = fuzzysort.go(this.filter.slice(1), this.commands, {
                        keys: ["name", "cmd"],
                    })
                    return searchResults.map((result) => {
                        const obj = {...result.obj}
                        const nameHighlight = result[0].highlight("<b>", "</b>")
                        obj.name = nameHighlight !== "" ? nameHighlight : obj.name
                        return obj
                    })
                } else {
                    let items
                    if (this.filter === "") {
                        items = this.orderedItems
                    } else {
                        const searchResults = fuzzysort.go(this.filter, this.items, {
                            keys: ["name", "folder"],
                        })
                        items = searchResults.map((result) => {
                            const obj = {...result.obj}
                            const nameHighlight = result[0].highlight("<b>", "</b>")
                            const folderHighlight = result[1].highlight("<b>", "</b>")
                            obj.name = nameHighlight !== "" ? nameHighlight : obj.name
                            obj.folder = folderHighlight !== "" ? folderHighlight : obj.folder
                            return obj
                        })
                    }
                    
                    const newNoteItem = {
                        name: "Create new…", 
                        createNew:true,
                    }
                    return [
                        ...items,
                        newNoteItem,
                    ]
                }
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "updateBuffers",
                "editBufferMetadata",
                "deleteBuffer",
                "executeCommand",
            ]),

            // key names from the keymap shown as key glyphs ("Cmd+Enter" -> ⌘ ↩); modifier glyphs on macOS only
            keyCaps(binding) {
                const glyphs = {Enter: "↩", Backspace: "⌫", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
                    ...(window.heynote.platform.isMac ? {Cmd: "⌘", Ctrl: "⌃", Alt: "⌥", Shift: "⇧"} : {})}
                return binding.split(/\+(?=.)/).map(key => glyphs[key] || key)
            },

            buildItems() {
                //console.log("buildItems", Object.entries(this.buffers))
                this.items = Object.entries(this.buffers).map(([path, metadata]) => {
                    return {
                        "path": path,
                        "name": escapeHTML(metadata?.name || path),
                        "folder": escapeHTML(path.split(pathSep).slice(0, -1).join(pathSep)),
                        "scratch": path === SCRATCH_FILE_NAME,
                    }
                })
            },

            onKeydown(event) {
                if (event.key === "Escape") {
                    event.preventDefault()
                    if (this.actionButton !== 0) {
                        this.hideActionButtons()
                    } else {
                        this.$emit("close")
                    }
                    return
                }

                if (this.filteredItems.length === 0) {
                    return
                }
                
                const item = this.filteredItems[this.selected]
                if (event.key === "ArrowDown") {
                    if (this.selected === this.filteredItems.length - 1) {
                        this.selected = 0
                    } else {
                        this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
                    }
                    event.preventDefault()
                    this.$nextTick(() => {
                        this.$refs.container.querySelector(".selected").scrollIntoView({block: "nearest"})
                    })
                    this.actionButton = 0
                } else if (event.key === "ArrowUp") {
                    if (this.selected === 0) {
                        this.selected = this.filteredItems.length - 1
                    } else {
                        this.selected = Math.max(this.selected - 1, 0)
                    }
                    event.preventDefault()
                    this.$nextTick(() => {
                        this.$refs.container.querySelector(".selected").scrollIntoView({block: "nearest"})
                    })
                    this.actionButton = 0
                } else if (event.key === "ArrowRight" && this.itemHasActionButtons(item)) {
                    event.preventDefault()
                    this.actionButton = Math.min(2, this.actionButton + 1)
                } else if (event.key === "ArrowLeft" && this.itemHasActionButtons(item)) {
                    event.preventDefault()
                    this.actionButton = Math.max(0, this.actionButton - 1)
                    this.deleteConfirm = false
                } else if (event.key === "Enter") {
                    event.preventDefault()
                    if (this.actionButton === 1) {
                        //console.log("edit file:", path)
                        this.editBufferMetadata(item.path)
                    } else if (this.actionButton === 2) {
                        this.deleteConfirmNote(item.path)
                    } else {
                        this.selectItem(item)
                    }
                }
            },

            selectItem(item) {
                if (item.createNew) {
                    if (this.filteredItems.length === 1) {
                        this.$emit("openCreateBuffer", this.filter)
                    } else {
                        this.$emit("openCreateBuffer", "")
                    }
                } else if (item.isCommand) {
                    this.$emit("close")
                    this.$nextTick(() => {
                        this.executeCommand(item.cmd)
                    })
                } else {
                    this.$emit("openBuffer", item.path)
                }
            },

            itemHasActionButtons(item) {
                return !item.createNew && item.path !== SCRATCH_FILE_NAME && !item.isCommand
            },

            onInput(event) {
                // reset selection
                this.selected = 0
            },

            onFocusOut(event) {
                let container = this.$refs.container
                if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
                    this.$emit("close")
                }
            },
            
            getItemClass(item, idx) {
                return {
                    "item": true,
                    "selected": idx === this.selected,
                    "action-buttons-visible": this.actionButton > 0,
                    "scratch": item.scratch,
                    "new-note": item.createNew,
                    "command": item.isCommand,
                }
            },

            showActionButtons(idx) {
                this.selected = idx
                this.actionButton = 1
                this.deleteConfirm = false
                this.$refs.input.focus()
            },

            hideActionButtons() {
                this.actionButton = 0
                this.deleteConfirm = false
            },

            async deleteConfirmNote(path) {
                if (this.deleteConfirm) {
                    //console.log("delete file:", path)
                    await this.deleteBuffer(path)
                    this.hideActionButtons()
                    this.buildItems()
                    this.selected = Math.min(this.selected, this.items.length - 1)
                } else {
                    this.deleteConfirm = true
                    this.actionButton = 2
                    this.$refs.input.focus()
                }
            },
        }
    }
</script>

<template>
    <form class="note-selector" tabindex="-1" @focusout="onFocusOut" ref="container" @submit.prevent>
        <div class="input-container">
            <h1 v-if="headline">{{headline}}</h1>
            <input 
                type="text" 
                ref="input"
                @keydown="onKeydown"
                @input="onInput"
                v-model="filter"
                :placeholder="commandsEnabled ? 'Search buffers, or > for commands…' : 'Search buffers…'"
                autocomplete="off"
                spellcheck="false"
            />
        </div>
        <div class="scroller">
            <ul class="items" ref="itemsContainer">
                <template 
                    v-for="item, idx in filteredItems"
                    :key="item.path"
                >
                    <li v-if="item.createNew" class="line-separator"></li>
                    <li
                        :class="getItemClass(item, idx)"
                        @click="selectItem(item)"
                        ref="item"
                    >
                        <span class="name" v-html="item.name" />
                        <span class="path" v-html="item.folder" />
                        <span v-if="item.bindings" class="bindings">
                            <span 
                                v-for="binding in item.bindings.slice(0, 2)" 
                                :key="binding" 
                                class="binding"
                            ><kbd v-for="key, i in keyCaps(binding)" :key="i">{{ key }}</kbd></span>
                            <span v-if="item.bindings.length > 2" class="more">
                                and {{ item.bindings.length - 2 }} more
                            </span>
                        </span>
                        <span :class="{'action-buttons':true, 'visible':actionButton > 0 && idx === selected}">
                            <button 
                                v-if="actionButton > 0 && idx === selected"
                                :class="{'selected':actionButton === 1}"
                                @click.stop.prevent="editBufferMetadata(item.path)"
                            >Edit</button>
                            <button 
                                v-if="actionButton > 0 && idx === selected"
                                :class="{'delete':true, 'selected':actionButton === 2, 'confirm':deleteConfirm}"
                                @click.stop.prevent="deleteConfirmNote(item.path)"
                            >
                                <template v-if="deleteConfirm">
                                    Really Delete?
                                </template>
                                <template v-else>
                                    Delete
                                </template>
                            </button>
                            <button
                                class="show-actions"
                                v-if="itemHasActionButtons(item) && (actionButton === 0 || idx !== selected)"
                                @click.stop.prevent="showActionButtons(idx)"
                            ></button>
                        </span>
                    </li>
                </template>
            </ul>
        </div>
    </form>
</template>

<style scoped lang="sass">
    .note-selector
        +rc-palette
        width: 560px
        max-width: calc(100% - 48px)
        +webapp-mobile
            max-width: calc(100% - 80px)

        .input-container
            padding: 10px 12px
            border-bottom: 1px solid var(--border)
            h1
                font-weight: bold
                margin: 4px 6px 10px
            input
                +rc-palette-input
                padding: 8px 6px
                width: 100%
                +webapp-mobile
                    font-size: 16px
                    max-width: 100%
        
        .scroller
            overflow-y: auto
            padding: 8px

        .items
            > li.line-separator
                height: 1px
                background: var(--border)
                margin: 6px -8px
            > li.item
                +rc-palette-item
                position: relative
                display: flex
                align-items: center
                scroll-margin-top: 6px
                scroll-margin-bottom: 6px
                &:hover, &.selected
                    .action-buttons .show-actions
                        display: inline-block
                .action-buttons button
                    color: var(--text)
                &.selected.action-buttons-visible
                    background: none
                    box-shadow: inset 0 0 0 1px var(--border-200)
                    color: var(--text-600)
                &.scratch
                    font-weight: 600
                &.new-note
                    //font-size: 12px
                &.command
                    .name
                        flex-grow: 1
                .name
                    max-width: 100%
                    margin-right: 12px
                    flex-shrink: 0
                    overflow: hidden
                    text-overflow: ellipsis
                    text-wrap: nowrap
                    ::v-deep(b)
                        font-weight: 700
                .path
                    opacity: 0.6
                    font-size: 12px
                    flex-shrink: 1
                    overflow: hidden
                    text-overflow: ellipsis
                    text-wrap: nowrap
                    ::v-deep(b)
                        font-weight: 700
                .bindings
                    color: var(--text-600)
                    font-size: 11px
                    flex-shrink: 1
                    overflow: hidden
                    text-overflow: ellipsis
                    text-wrap: nowrap
                    .binding
                        display: inline-flex
                        gap: 3px
                        margin-right: 12px
                        &:last-child
                            margin-right: 0
                    kbd
                        font-family: var(--system-font)
                        min-width: 18px
                        height: 18px
                        line-height: 18px
                        padding: 0 5px
                        box-sizing: border-box
                        text-align: center
                        border-radius: 5px
                        background: var(--fill-100)
                    .more
                        font-style: italic
                    
                .action-buttons
                    position: absolute
                    top: 4px
                    right: 4px
                    padding: 0 1px
                    &.visible
                        background: var(--popover-bg)
                    button
                        padding: 0 10px
                        height: 20px
                        font-size: 12px
                        background: none
                        border: none
                        border-radius: 5px
                        margin-right: 2px
                        cursor: pointer
                        &:last-child
                            margin-right: 0
                        &:hover
                            background: var(--fill-100)
                        &.selected
                            background: var(--fill-100)
                            box-shadow: inset 0 0 0 1px var(--border-200)
                            &.delete
                                background: var(--accent)
                                box-shadow: none
                                color: #fff
                            &.confirm
                                font-weight: 600
                        &.show-actions
                            display: none
                            position: relative
                            top: 1px
                            padding: 1px 8px
                            //cursor: default
                            background-image: url(@/assets/icons/arrow-right-black.svg)
                            width: 22px
                            height: 19px
                            background-size: 19px
                            background-position: center center
                            background-repeat: no-repeat
                            +dark-mode
                                background-image: url(@/assets/icons/arrow-right-grey.svg)
</style>
