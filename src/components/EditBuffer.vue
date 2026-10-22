<script>
    import { toRaw } from 'vue';
    import { mapState, mapActions } from 'pinia'
    import { useHeynoteStore } from "../stores/heynote-store"
    import { filenameSlug } from "@/src/common/sanitize-filename"
    import { shake } from "@/src/util/motion"

    import FolderSelector from './folder-selector/FolderSelector.vue'

    const pathSep = window.heynote.buffer.pathSeparator

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
            this.$refs.nameInput.focus()
            this.updateBuffers()

            this.name = this.currentNote.name

            // build directory tree
            const directories = await window.heynote.buffer.getDirectoryList()
            const rootNode = {
                name: "Heynote Root",
                path: "",
                children: [],
                open: true,
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
                            open: this.currentBufferPath.startsWith(currentPath),
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
            ]),

            currentNote() {
                return this.buffers[this.currentBufferPath]
            },

            currentNoteDirectory() {
                return this.currentBufferPath.split(pathSep).slice(0, -1).join(pathSep)
            },

            nameInputClass() {
                return {
                    "name-input": true,
                    "error": this.errors.name,
                }
            }
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "updateBuffers",
                "updateBufferMetadata",
            ]),

            onKeydown(event) {
                if (event.key === "Escape") {
                    event.preventDefault()
                    this.cancel()
                } if (event.key === "Enter") {
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

            submit() {
                let slug = filenameSlug(this.name)
                if (slug === "") {
                    this.errors.name = true
                    shake(this.$refs.nameInput)
                    return
                }
                const parentPathPrefix = this.parentPath === "" ? "" : this.parentPath + pathSep
                let path;
                for (let i=0; i<1000; i++) {
                    let filename = slug + ".txt"
                    path = parentPathPrefix + filename
                    if (path === this.currentBufferPath || !this.buffers[path]) {
                        // file name is ok if it's the current note, or if it doesn't exist
                        break
                    }
                    slug = filenameSlug(this.name + "-" + i)
                }
                if (path !== this.currentBufferPath && this.buffers[path]) {
                    console.error("Failed to edit note, path already exists", path)
                    this.errors.name = true
                    shake(this.$refs.nameInput)
                    return
                }
                console.log("Update note", path)
                this.updateBufferMetadata(this.currentBufferPath, this.name, path)
                this.$emit("close")
                //this.$emit("create", this.$refs.input.value)
            },
        }
    }
</script>

<template>
    <div class="fader" @keydown.stop="onKeydown" tabindex="-1">
        <form class="new-note" tabindex="-1" @focusout="onFocusOut" ref="container" @submit.prevent="submit">
            <div class="container">
                <h1>Edit Buffer</h1>
                <input 
                    placeholder="Name"
                    type="text" 
                    v-model="name"
                    :class="nameInputClass"
                    ref="nameInput"
                    @keydown="onInputKeydown"
                    @input="errors.name = false"
                />

                <label for="folder-select">Move to</label>
                <FolderSelector 
                    v-if="directoryTree"
                    :directoryTree="directoryTree"
                    :selectedPath="currentNoteDirectory"
                    id="folder-select" 
                    v-model="parentPath"
                    ref="folderSelect"
                />
            </div>
            <div class="bottom-bar">
                <button type="submit">Update Buffer</button>
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
        z-index: 400 // above the search panel which have z-index 300
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0
        background: rgba(0,0,0, 0.2)
        +shader-enter
    // opened with the mouse (tab or sidebar context menu), so it fades in like Settings
    .new-note
        +rc-form-dialog
        +dialog-enter
</style>
