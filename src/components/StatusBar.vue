<script>
    import { mapState, mapStores } from 'pinia'
    import UpdateStatusItem from './UpdateStatusItem.vue'
    import { LANGUAGES } from '../editor/languages.js'
    import { formatDate, formatFullDate } from '../common/format-date'
    import { useHeynoteStore } from "../stores/heynote-store"
    import { useSettingsStore } from "../stores/settings-store"
    
    const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map(l => [l.token, l]))
    const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES.map(l => [l.token, l.name]))


    export default {
        props: [
            "autoUpdate",
            "allowBetaVersions",
        ],

        components: {
            UpdateStatusItem,
        },

        data() {
            return {
                isWebApp: window.heynote.platform.isWebApp,
            }
        },

        mounted() {
            
        },

        computed: {
            ...mapStores(useHeynoteStore),
            ...mapState(useHeynoteStore, [
                "currentBufferName",
                "currentCursorLine",
                "currentLanguage", 
                "currentSelectionSize", 
                "currentLanguage",
                "currentLanguageAuto",
                "currentCreatedTime",
                "systemLocale",
            ]),
            ...mapState(useSettingsStore, [
                "spellcheckEnabled",
                "alwaysOnTop",
                "settings",
                "commandKeyBindingsMap",
            ]),

            languageName() {
                return LANGUAGE_NAMES[this.currentLanguage] || this.currentLanguage
            },

            className() {
                return `status`
            },

            supportsFormat() {
                const lang = LANGUAGE_MAP[this.currentLanguage]
                return !!lang ? lang.supportsFormat : false
            },

            cmdKey() {
                return window.heynote.platform.isMac ? "⌘" : "Ctrl"
            },

            formatBlockTitle() {
                return `Format Block Content (Alt + Shift + F)`
            },

            updatesEnabled() {
                return !!window.heynote.autoUpdate
            },


            formattedCreatedTime() {
                if (!this.currentCreatedTime) {
                    return null
                }
                return formatDate(this.currentCreatedTime, this.systemLocale)
            },

            createdTimeTitle() {
                if (!this.currentCreatedTime) {
                    return null
                }
                return "Block created " +  formatFullDate(this.currentCreatedTime, this.systemLocale)
            },
        },

        methods: {
            onSpellcheckingContextMenu(event) {
                event.preventDefault()
                window.heynote.mainProcess.invoke('showSpellcheckingContextMenu')
            },

            getTooltip(text, command) {
                const bindings = this.commandKeyBindingsMap[command]
                return bindings.length === 0 ? text : `${text} (${bindings[0]})`
            }
        },
    }
</script>

<template>
    <div :class="className">
        <div 
            @click.stop="$emit('toggleLeftPanel')"
            class="status-block sidebar clickable"
            :title="getTooltip('Toggle Sidebar', 'toggleLeftPanel')"
        >
            <span class="icon icon-format"></span>
        </div>
        <div class="status-block line-number">
            Ln <span class="num">{{ currentCursorLine?.line }}</span>
            Col <span class="num">{{ currentCursorLine?.col }}</span>
            <template v-if="currentSelectionSize > 0">
                Sel <span class="num">{{ currentSelectionSize }}</span>
            </template>
        </div>
        <div 
            :title="createdTimeTitle"
            class="status-block created-time"
        >
            {{ formattedCreatedTime }}
        </div>
        <div class="spacer"></div>
        <div 
            @click.stop="$emit('openBufferSelector')"
            class="status-block note clickable"
            :title="getTooltip('Change Buffer', 'openBufferSelector')"
        >
            {{ currentBufferName }} 
        </div>
        <div 
            @click.stop="$emit('openLanguageSelector')"
            class="status-block lang clickable"
            :title="getTooltip('Change language for current block', 'openLanguageSelector')"
        >
            {{ languageName }} 
            <span v-if="currentLanguageAuto" class="auto">(auto)</span>
        </div>
        <div 
            v-if="supportsFormat"
            @click.stop="$emit('formatCurrentBlock')"
            class="status-block format clickable"
            :title="getTooltip('Format Block Content', 'formatBlockContent')"
        >
            <span class="icon icon-format"></span>
        </div>
        <div 
            @click.stop="$emit('toggleSpellcheck')"
            @mousedown.prevent
            @contextmenu="onSpellcheckingContextMenu"
            :class="'status-block spellcheck clickable' + (this.spellcheckEnabled ? ' spellcheck-enabled' : '')"
            :title="getTooltip('Spellchecking', 'toggleSpellcheck')"
        >
            <span class="icon icon-format"></span>
        </div>

        <div 
            v-if="!isWebApp"
            @click.stop="$emit('toggleAlwaysOnTop')"
            @mousedown.prevent
            class="status-block pin clickable"
            :title="getTooltip('Pin', 'toggleAlwaysOnTop')"
        >
            <span class="icon icon-format" :class="{'pinned': alwaysOnTop}"></span>
        </div>

        <UpdateStatusItem 
            v-if="updatesEnabled" 
            :autoUpdate="autoUpdate"
            :allowBetaVersions="allowBetaVersions"
        />
        <div 
            @click.stop="$emit('openSettings')"
            class="status-block settings clickable"
            title="Settings"
        >
            <span class="icon icon-format"></span>
        </div>
    </div>
</template>

<style scoped lang="sass">
    .status
        box-sizing: border-box
        height: var(--status-bar-height)
        width: 100%
        background: var(--fill-25)
        border-top: 1px solid var(--border)
        color: var(--text-600)
        font-size: 12px
        padding: 0 4px
        display: flex
        flex-direction: row
        align-items: center
        user-select: none
        white-space: nowrap
        overflow: hidden
        .spacer
            flex-grow: 1
        
        .status-block
            box-sizing: border-box
            height: 22px
            line-height: 22px
            padding: 0 8px
            margin: 0 1px
            border-radius: 6px
            cursor: default
            &.clickable
                cursor: pointer
                &:hover
                    background-color: var(--fill-100)
                    color: var(--text)
            // icons are SVG masks painted in the current text color
            .icon
                display: block
                width: 14px
                height: 22px
                background-color: currentColor
        .line-number .num
            color: var(--text)
        .lang .auto
            color: var(--text-400)
        
        .sidebar
            padding-top: 0
            padding-bottom: 0
            .icon
                mask-size: 15px
                mask-repeat: no-repeat
                mask-position: center center
                mask-image: url("@/assets/icons/sidebar.svg")
        
        .format
            padding-top: 0
            padding-bottom: 0
            .icon
                mask-size: 16px
                mask-repeat: no-repeat
                mask-position: center center
                mask-image: url("@/assets/icons/format.svg")

        .spellcheck
            padding-top: 0
            padding-bottom: 0
            opacity: 1.0
            .icon
                mask-size: 13px
                mask-repeat: no-repeat
                mask-position: center center
                mask-image: url("@/assets/icons/spellcheck-off.svg")
            &.spellcheck-enabled .icon
                mask-image: url("@/assets/icons/spellcheck.svg")
        
        .pin
            padding-top: 0
            padding-bottom: 0
            .icon   
                mask-size: 13px
                mask-repeat: no-repeat
                mask-position: center center
                mask-image: url("@/assets/icons/pin.svg")
                &.pinned
                    mask-image: url("@/assets/icons/pin-pinned.svg")
        
        .settings
            padding-top: 0
            padding-bottom: 0
            .icon
                mask-size: 13px
                mask-repeat: no-repeat
                mask-position: center center
                mask-image: url("@/assets/icons/settings.svg")

</style>
