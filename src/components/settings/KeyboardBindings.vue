<script>
    import { mapState} from 'pinia'
    import draggable from 'vuedraggable'

    import { DEFAULT_KEYMAP, EMACS_KEYMAP, DEFAULT_NOT_EMACS_KEYMAP } from "@/src/editor/keymap"
    import { useSettingsStore } from "@/src/stores/settings-store"
    import KeyBindRow from "./KeyBindRow.vue"
    import AddKeyBind from "./AddKeyBind.vue"

    export default {
        props: [
            "userKeys",
            "modelValue",
        ],
        components: {
            draggable,
            KeyBindRow,
            AddKeyBind,
        },

        data() {
            return {
                keymap: this.modelValue,
                addKeyBinding: false,
            }
        },

        mounted() {
            
        },

        watch: {
            addKeyBinding(newValue) {
                this.$emit("addKeyBindingDialogVisible", newValue)
            },
        },

        computed: {
            ...mapState(useSettingsStore, [
                "settings",
            ]),

            fixedKeymap() {
                const defaultKeymap = (this.settings.keymap === "emacs" ? EMACS_KEYMAP : DEFAULT_NOT_EMACS_KEYMAP).map((km) => ({
                    key: km.key,
                    command: km.command,
                    isDefault: true,
                    source: this.settings.keymap === "emacs" ? "Emacs" : "Default",
                    scope: km.scope,
                }))

                return defaultKeymap.concat(
                    DEFAULT_KEYMAP.map((km) => ({
                        key: km.key,
                        command: km.command,
                        isDefault: true,
                        source: "Default",
                        scope: km.scope,
                    }))
                )
            },
        },

        methods: {
            onDragEnd(event) {
                this.$emit("update:modelValue", this.keymap)
            },

            onSaveKeyBinding(event) {
                this.keymap = [
                    {
                        key: event.key,
                        command: event.command,
                    },
                    ...(this.keymap ? this.keymap : []),
                ]
                //console.log("keymap", this.keymap)
                this.$emit("update:modelValue", this.keymap)
                this.addKeyBinding = false
            },

            deleteKeyBinding(index) {
                this.keymap = this.keymap.toSpliced(index, 1)
                this.$emit("update:modelValue", this.keymap)
            },
        },
    }
</script>

<template>
    <div class="container">
        <div class="header" :inert="addKeyBinding">
            <h2>Keyboard Bindings</h2>
            <!--<p>User key bindings can be reordered. Bindings that appear first take precedence</p>-->
            <div class="button-container">
                <button 
                    class="add-keybinding"
                    @click="addKeyBinding = !addKeyBinding"
                >Add Keybinding</button>
            </div>
        </div>
        
        <AddKeyBind 
            v-if="addKeyBinding" 
            @close="addKeyBinding = false"
            @save="onSaveKeyBinding"
        />

        <table :inert="addKeyBinding">
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Key</th>
                    <th>Command</th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
            <draggable 
                v-model="keymap" 
                tag="tbody"
                group="keymap" 
                ghost-class="ghost"
                handle=".drag-handle"
                @start="drag=true" 
                @end="onDragEnd" 
                item-key="key"
            >
                <template #item="{element, index}">
                    <KeyBindRow 
                        :keys="element.key"
                        :command="element.command"
                        :isDefault="element.isDefault"
                        :index="index"
                        @delete="deleteKeyBinding(index)"
                        source="User"
                    />
                </template>
            </draggable>
            <tbody>
                <KeyBindRow 
                    v-for="key in fixedKeymap" 
                    :key="key.source + '_' + key.key + '_' + key.scope" 
                    :keys="key.key"
                    :command="key.command"
                    :isDefault="key.isDefault"
                    :source="key.source"
                />
            </tbody>
        </table>
    </div>
</template>

<style lang="sass" scoped>
    .header
        display: flex
        margin-bottom: 12px
        h2
            flex-grow: 1
            font-weight: 600
            font-size: 14px
            margin: 0
        .button-container
            .add-keybinding
                +rc-button


    // a grouped list: one rounded container, hairlines between rows
    table
        width: 100%
        border-collapse: separate
        border-spacing: 0
        border: 1px solid var(--border)
        border-radius: 10px
        overflow: hidden
        ::v-deep(tr)
            &.ghost
                background: color-mix(in srgb, var(--accent) 18%, transparent)
            th
                text-align: left
                font-size: 11px
                font-weight: 600
                letter-spacing: 0.04em
                text-transform: uppercase
                color: var(--text-400)
                background: var(--fill-25)
            th, td
                padding: 9px 12px
                border-bottom: 1px solid var(--border)
                &.actions
                    padding: 6px 12px
                    button
                        height: 22px
                        font-size: 11px
            td.source
                color: var(--text-600)
            &:last-child td
                border-bottom: none
        
        tbody
            margin-bottom: 20px

</style>
