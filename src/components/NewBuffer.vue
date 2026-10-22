<script>
    import { mapState, mapActions } from 'pinia'
    import { useHeynoteStore } from "../stores/heynote-store"

    import { filenameSlug } from "@/src/common/sanitize-filename"
    import FolderSelector from './folder-selector/FolderSelector.vue'

    const pathSep = window.heynote.buffer.pathSeparator

    function hasHiddenDirectorySegment(path) {
        return path.split(pathSep).some((segment) => segment.startsWith("."))
    }

    function getArchiveDirectoryPath(directories) {
        // Only auto-select a dedicated archive folder at the library root.
        return [...directories]
            .filter((path) => !hasHiddenDirectorySegment(path))
            .find((path) => !path.includes(pathSep) && path.toLowerCase() === "archive")
    }

    export default {
        data() {
            return {
                name: "",
                filename: "",
                tags: [],
                directoryTree: null,
                parentPath: "",
                errors: {
                    name: null,
                },
            }
        },
        components: {
            FolderSelector
        },

        async mounted() {
            if (!!this.createBufferParams.name) {
                this.name = this.createBufferParams.name
                this.$refs.nameInput.focus()
                this.$nextTick(() => {
                    this.$refs.nameInput.select()
                })
            } else {
                this.$refs.nameInput.focus()
            }

            const directories = await window.heynote.buffer.getDirectoryList()
            let selectedDirectory = this.targetDirectory
            if (this.createBufferParams.mode === "archiveScratch") {
                // check if a root-level archive folder already exists.
                const archiveDirectoryPath = getArchiveDirectoryPath(directories)
                if (archiveDirectoryPath) {
                    selectedDirectory = archiveDirectoryPath
                } else {
                    // otherwise we preselect the path where the synthetic pending folder row will appear.
                    selectedDirectory = "archive"
                }
            }
            this.parentPath = selectedDirectory
            await this.updateBuffers()

            // build directory tree
            const rootNode = {
                name: "Heynote Root",
                path: "",
                children: [],
                open: true,
            }
            if (this.createBufferParams.mode === "archiveScratch" && !getArchiveDirectoryPath(directories)) {
                // show a pending "archive" folder entry so the dialog starts with a concrete target selected
                rootNode.children.push({
                    name: "archive",
                    children: [],
                    path: "archive",
                    newFolder: true,
                    open: false,
                })
            }
            const getNodeFromList = (list, part) => list.find(node => node.name === part)
                
            directories.forEach((path) => {
                const parts = path.split(pathSep)
                let currentLevel = rootNode
                let currentParts = []
                parts.forEach(part => {
                    currentParts.push(part)
                    let node = getNodeFromList(currentLevel.children, part)
                    if (node) {
                        currentLevel = node
                    } else {
                        const currentPath = currentParts.join(pathSep)
                        node = {
                            name: part,
                            children: [],
                            path: currentPath,
                            open: selectedDirectory.startsWith(currentPath),
                        }
                        currentLevel.children.push(node)
                        currentLevel = node
                    }
                })
            })
            //console.log("tree:", rootNode)
            this.directoryTree = rootNode
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "buffers",
                "currentBufferPath",
                "createBufferParams",
            ]),

            currentNoteDirectory() {
                return this.currentBufferPath.split(pathSep).slice(0, -1).join(pathSep)
            },

            targetDirectory() {
                return this.createBufferParams.parentPath || this.currentNoteDirectory
            },

            initialDirectory() {
                return this.parentPath || this.currentNoteDirectory
            },

            nameInputClass() {
                return {
                    "name-input": true,
                    "error": this.errors.name,
                }
            },

            dialogTitle() {
                if (this.createBufferParams.mode === "currentBlock") {
                    return "Move Block to New Buffer"
                }
                if (this.createBufferParams.mode === "archiveScratch") {
                    return "Archive Buffer"
                }
                return "New Buffer"
            },

            folderLabel() {
                return this.createBufferParams.mode === "archiveScratch" ? "Archive in" : "Create in"
            },

            submitButtonText() {
                return this.createBufferParams.mode === "archiveScratch" ? "Archive Buffer" : "Create New Buffer"
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "updateBuffers",
                "createNewBuffer",
                "createNewBufferFromActiveBlock",
                "archiveScratchBuffer",
            ]),

            onKeydown(event) {
                if (event.key === "Escape") {
                    this.$emit("close")
                    event.preventDefault()
                } if (event.key === "Enter") {
                    // without preventDefault, the editor will receive a Enter keydown event on webapp (not in Electron)
                    event.preventDefault()
                    this.submit()
                }
            },

            onCancelKeydown(event) {
                if (event.key === "Enter") {
                    event.preventDefault()
                    event.stopPropagation()
                    this.cancel()
                }
            },

            cancel() {
                this.$emit("close")
            },

            onInputKeydown(event) {
                // support Ctrl/Cmd+A to select all
                if (event.key === "a" && event[window.heynote.platform.isMac ? "metaKey" : "ctrlKey"]) {
                    event.preventDefault()
                    event.srcElement.select()
                }
                
                // redirect arrow keys and page up/down to folder selector
                const redirectKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp"]
                if (redirectKeys.includes(event.key)) {
                    this.$refs.folderSelect.$el.dispatchEvent(new KeyboardEvent("keydown", {key: event.key}))
                    event.preventDefault()
                }
            },

            findAvailableBufferPath() {
                let slug = filenameSlug(this.name)
                if (slug === "") {
                    this.errors.name = true
                    return null
                }
                const parentPathPrefix = this.parentPath === "" ? "" : this.parentPath + pathSep
                let path;
                for (let i=0; i<1000; i++) {
                    let filename = slug + ".txt"
                    path = parentPathPrefix + filename
                    if (!this.buffers[path]) {
                        break
                    }
                    slug = filenameSlug(this.name + "-" + i)
                }
                if (this.buffers[path]) {
                    console.error("Failed to create buffer, path already exists", path)
                    this.errors.name = true
                    return null
                }
                return path
            },

            async submit() {
                const path = this.findAvailableBufferPath()
                if (!path) {
                    return
                }
                //console.log("Creating buffer", path, this.createBufferParams)
                try {
                    if (this.createBufferParams.mode === "currentBlock") {
                        await this.createNewBufferFromActiveBlock(path, this.name)
                    } else if (this.createBufferParams.mode === "new") {
                        await this.createNewBuffer(path, this.name)
                    } else if (this.createBufferParams.mode === "archiveScratch") {
                        await this.archiveScratchBuffer(path, this.name)
                    } else {
                        throw new Error("Unknown createBuffer Mode: " + this.createBufferParams.mode)
                    }
                } catch (error) {
                    console.error("Failed to submit buffer dialog:", error)
                    return
                }

                this.$emit("close")
                //this.$emit("create", this.$refs.input.value)
            },
        }
    }
</script>

<template>
    <div class="fader" @keydown="onKeydown" tabindex="-1">
        <form class="new-buffer" tabindex="-1" @focusout="onFocusOut" ref="container" @submit.prevent="submit">
            <div class="container">
                <h1>{{ dialogTitle }}</h1>
                <input 
                    placeholder="Name"
                    type="text" 
                    v-model="name"
                    :class="nameInputClass"
                    ref="nameInput"
                    @keydown="onInputKeydown"
                    @input="errors.name = false"
                    autocomplete="off"
                    data-1p-ignore
                />

                <label for="folder-select">{{ folderLabel }}</label>
                <FolderSelector 
                    v-if="directoryTree"
                    :directoryTree="directoryTree"
                    :selectedPath="initialDirectory"
                    id="folder-select" 
                    v-model="parentPath"
                    ref="folderSelect"
                />
            </div>
            <div class="bottom-bar">
                <button type="submit">{{ submitButtonText }}</button>
                <button 
                    class="cancel"
                    @keydown="onCancelKeydown"
                    @click.stop.prevent="cancel"
                >Cancel</button>
            </div>
        </form>
    </div>
</template>

<style scoped lang="sass">    
    .fader
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0
        background: rgba(0,0,0, 0.2)
        z-index: 400 // above the search panel which have z-index 300
    .new-buffer
        +rc-popover
        font-size: 13px
        width: 420px
        position: absolute
        top: calc(var(--tab-bar-height) + 8px)
        left: 50%
        transform: translateX(-50%)
        display: flex
        flex-direction: column
        max-height: calc(100% - 16px)
        &:focus
            outline: none
        +webapp-mobile
            max-width: calc(100% - 80px)
        
        .container
            padding: 12px
            min-height: 0
            display: flex
            flex-direction: column

            h1
                font-weight: 600
                margin-bottom: 14px
            
            label
                display: block
                margin-bottom: 6px
                font-size: 12px
                font-weight: 500
                color: var(--text-600)

            .name-input
                +rc-input
                width: 100%
                padding: 6px 8px
                box-sizing: border-box
                margin-bottom: 16px
                +webapp-mobile
                    font-size: 16px
                    max-width: 100%
        
        .bottom-bar
            border-top: 1px solid var(--border)
            background: var(--fill-25)
            padding: 8px 12px
            display: flex
            justify-content: space-between
            button
                +rc-button
                &[type="submit"]
                    order: 1
                    font-weight: 600
                &.cancel
                    order: 0
                    background: transparent
                    color: var(--text-600)
                    &:hover
                        background: var(--fill-100)
        
</style>
