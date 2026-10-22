<script>
    import { toRaw} from 'vue';
    import { mapStores, mapState } from 'pinia'
    import { useSettingsStore } from "@/src/stores/settings-store.js"
    import { useHeynoteStore } from "@/src/stores/heynote-store"

    import { LANGUAGES } from '../../editor/languages.js'
    import { DEFAULT_LINE_HEIGHT } from '../../editor/theme/font-theme.js'
    import KeyboardHotkey from "./KeyboardHotkey.vue"
    import TabListItem from "./TabListItem.vue"
    import TabContent from "./TabContent.vue"
    import KeyboardBindings from './KeyboardBindings.vue'

    const defaultFontFamily = window.heynote.defaultFontFamily
    const defaultFontSize = window.heynote.defaultFontSize
    const defaultDefaultBlockLanguage = "text"
    const defaultDefaultBlockLanguageAutoDetect = true

    export default {
        props: {
            initialKeymap: String,
            initialSettings: Object,
            themeSetting: String,
        },
        components: {
            KeyboardHotkey,
            TabListItem,
            TabContent,
            KeyboardBindings,
        },

        data() {
            //console.log("settings:", this.initialSettings)
            return {
                keymaps: [
                    { name: "Default", value: "default" },
                    { name: "Emacs", value: "emacs" },
                ],
                keymap: this.initialSettings.keymap,
                keyBindings: this.initialSettings.keyBindings || [],
                metaKey: this.initialSettings.emacsMetaKey,
                isMac: window.heynote.platform.isMac,
                isLinux: window.heynote.platform.isLinux,
                showLineNumberGutter: this.initialSettings.showLineNumberGutter,
                showFoldGutter: this.initialSettings.showFoldGutter,
                showWhitespace: this.initialSettings.showWhitespace,
                colorPreviewEnabled: this.initialSettings.colorPreviewEnabled ?? true,
                showTabs: this.initialSettings.showTabs,
                showTabsInFullscreen: this.initialSettings.showTabsInFullscreen,
                showLeftPanel: this.initialSettings.showLeftPanel ?? true,
                allowBetaVersions: this.initialSettings.allowBetaVersions,
                enableGlobalHotkey: this.initialSettings.enableGlobalHotkey,
                globalHotkey: this.initialSettings.globalHotkey,
                showInDock: this.initialSettings.showInDock,
                showInMenu: this.initialSettings.showInMenu,
                alwaysOnTop: this.initialSettings.alwaysOnTop,
                translucentWindow: this.initialSettings.translucentWindow ?? false,
                openAtLogin: this.initialSettings.openAtLogin,
                startHidden: this.initialSettings.startHidden ?? false,
                bracketClosing: this.initialSettings.bracketClosing,
                indentType: this.initialSettings.indentType || "space",
                tabSize: this.initialSettings.tabSize || 4,
                autoUpdate: this.initialSettings.autoUpdate,
                autoInstallUpdates: this.initialSettings.autoInstallUpdates !== false,
                bufferPath: this.initialSettings.bufferPath,
                fontFamily: this.initialSettings.fontFamily || defaultFontFamily,
                fontSize: this.initialSettings.fontSize || defaultFontSize,
                lineHeight: this.initialSettings.lineHeight || DEFAULT_LINE_HEIGHT,
                uiFontFamily: this.initialSettings.uiFontFamily || "",
                cursorBlinkRate: this.initialSettings.cursorBlinkRate ?? 1000,
                languageOptions: LANGUAGES.map(l => {
                    return {
                        "value": l.token,
                        "name": l.token == "text" ? l.name + " (default)" : l.name,
                    }
                }).sort((a, b) => {
                    return a.name.localeCompare(b.name)
                }),
                defaultBlockLanguage: this.initialSettings.defaultBlockLanguage || defaultDefaultBlockLanguage,
                defaultBlockLanguageAutoDetect: this.initialSettings.defaultBlockLanguageAutoDetect === false ? false : defaultDefaultBlockLanguageAutoDetect,

                activeTab: "general",
                tabs: [
                    { tab: "general", name: "General" },
                    { tab: "editing", name: "Editing" },
                    { tab: "appearance", name: "Appearance" },
                    { tab: "keyboard-bindings", name: "Key Bindings" },
                    { tab: "updates", name: window.heynote.platform.isWebApp ? "Version" : "Updates" },
                ],
                themes: [
                    { value: "system", name: "Auto" },
                    { value: "light", name: "Light" },
                    { value: "dark", name: "Dark" },
                ],
                isWebApp: window.heynote.platform.isWebApp,
                customBufferLocation: !!this.initialSettings.bufferPath,
                // the saved fonts are listed even before (or without) queryLocalFonts, so the selects show them
                systemFonts: [
                    [defaultFontFamily, defaultFontFamily + " (default)"],
                    ...[...new Set([this.initialSettings.fontFamily, this.initialSettings.uiFontFamily])]
                        .filter(f => f && f !== defaultFontFamily).map(f => [f, f]),
                ],
                defaultFontSize: defaultFontSize,
                appVersion: "",
                theme: this.themeSetting,

                // tracks if the add key binding dialog is visible (so that we can set inert on the save button)
                addKeyBindingDialogVisible: false,
            }
        },

        async mounted() {
            window.addEventListener("keydown", this.onKeyDown);

            this.appVersion = await window.heynote.getVersion()

            if (window.queryLocalFonts !== undefined) {
                let localFonts = [... new Set((await window.queryLocalFonts()).map(f => f.family))].filter(f => f !== "Hack")
                localFonts = [...new Set(localFonts)].map(f => [f, f])
                this.systemFonts = [[defaultFontFamily, defaultFontFamily + " (default)"], ...localFonts]
            }
        },
        beforeUnmount() {
            window.removeEventListener("keydown", this.onKeyDown);
        },

        watch: {
            keyBindings(newKeyBindings) {
                this.updateSettings()
            }
        },

        computed: {
            ...mapStores(useSettingsStore, useHeynoteStore),

            paneTitle() {
                return this.tabs.find(t => t.tab === this.activeTab).name
            },
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Escape" && !this.addKeyBindingDialogVisible) {
                    this.$emit("closeSettings")
                }
            },

            updateSettings() {
                if (this.heynoteStore.showLeftPanel !== this.showLeftPanel) {
                    this.heynoteStore.setLeftPanelVisible(this.showLeftPanel, false)
                }
                this.settingsStore.updateSettings({
                    showLineNumberGutter: this.showLineNumberGutter,
                    showFoldGutter: this.showFoldGutter,
                    showWhitespace: this.showWhitespace,
                    colorPreviewEnabled: this.colorPreviewEnabled,
                    showTabs: this.showTabs,
                    showTabsInFullscreen: this.showTabsInFullscreen,
                    showLeftPanel: this.showLeftPanel,
                    keymap: this.keymap,
                    keyBindings: this.keyBindings.map((kb) => toRaw(kb)),
                    emacsMetaKey: window.heynote.platform.isMac ? this.metaKey : "alt",
                    allowBetaVersions: this.allowBetaVersions,
                    enableGlobalHotkey: this.enableGlobalHotkey,
                    globalHotkey: this.globalHotkey,
                    showInDock: this.showInDock,
                    showInMenu: this.showInMenu || !this.showInDock,
                    alwaysOnTop: this.alwaysOnTop,
                    translucentWindow: this.translucentWindow,
                    openAtLogin: this.openAtLogin,
                    startHidden: this.startHidden,
                    autoUpdate: this.autoUpdate,
                    autoInstallUpdates: this.autoInstallUpdates,
                    bracketClosing: this.bracketClosing,
                    indentType: this.indentType,
                    tabSize: this.tabSize,
                    bufferPath: this.bufferPath,
                    fontFamily: this.fontFamily === defaultFontFamily ? undefined : this.fontFamily,
                    fontSize: this.fontSize === defaultFontSize ? undefined : this.fontSize,
                    lineHeight: this.lineHeight === DEFAULT_LINE_HEIGHT ? undefined : this.lineHeight,
                    uiFontFamily: this.uiFontFamily || undefined,
                    cursorBlinkRate: this.cursorBlinkRate,
                    defaultBlockLanguage: this.defaultBlockLanguage === "text" ? undefined : this.defaultBlockLanguage,
                    defaultBlockLanguageAutoDetect: this.defaultBlockLanguageAutoDetect === true ? undefined : this.defaultBlockLanguageAutoDetect,
                })
                if (!this.showInDock) {
                    this.showInMenu = true
                }
                if (this.theme != this.themeSetting) {
                    this.settingsStore.setTheme(this.theme)
                }
            },

            async selectBufferLocation() {
                const path = await window.heynote.buffer.selectLocation()
                if (path) {
                    this.bufferPath = path
                    this.updateSettings()
                }
            },

            onCustomBufferLocationChange() {
                if (!this.customBufferLocation) {
                    this.bufferPath = ""
                    this.updateSettings()
                }
            },
        }
    }
</script>

<template>
    <div class="settings">
        <div class="dialog">
            <div class="dialog-content">
                <nav class="sidebar">
                    <ul>
                        <TabListItem
                            v-for="t in tabs"
                            :key="t.tab"
                            :name="t.name"
                            :tab="t.tab"
                            :activeTab="activeTab"
                            @click="activeTab = t.tab"
                        />
                    </ul>
                </nav>
                <div class="settings-content">
                    <h1 class="pane-title">{{ paneTitle }}</h1>

                    <TabContent tab="general" :activeTab="activeTab">
                        <section v-if="!isWebApp">
                            <h2>Global Keyboard Shortcut</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">
                                        Enable Global Hotkey
                                        <small>Show and hide Heynote from any app</small>
                                    </span>
                                    <input type="checkbox" v-model="enableGlobalHotkey" @change="updateSettings" />
                                </label>
                                <div class="setting hotkey">
                                    <KeyboardHotkey
                                        :disabled="!enableGlobalHotkey"
                                        v-model="globalHotkey"
                                        @change="updateSettings"
                                    />
                                </div>
                            </div>
                        </section>
                        <section v-if="!isWebApp">
                            <h2>Window & Application</h2>
                            <div class="card">
                                <label class="setting" v-if="isMac">
                                    <span class="text">Show in dock</span>
                                    <input type="checkbox" v-model="showInDock" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">{{ isMac ? "Show in menu bar" : "Show in system tray" }}</span>
                                    <input type="checkbox" :disabled="!showInDock" v-model="showInMenu" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Always on top</span>
                                    <input type="checkbox" v-model="alwaysOnTop" @change="updateSettings" />
                                </label>
                                <label class="setting" v-if="!isLinux">
                                    <span class="text">Launch at login</span>
                                    <input type="checkbox" v-model="openAtLogin" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">
                                        Start hidden
                                        <small>Open in the background, ready for the hotkey</small>
                                    </span>
                                    <input type="checkbox" v-model="startHidden" @change="updateSettings" />
                                </label>
                            </div>
                        </section>
                        <section v-if="!isWebApp" class="buffer-location">
                            <h2>Buffer Files</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">
                                        Use custom location for the buffer files
                                        <small>By default they live in Heynote's own app data folder</small>
                                    </span>
                                    <input type="checkbox" v-model="customBufferLocation" @change="onCustomBufferLocationChange" />
                                </label>
                                <div class="setting file-path" v-if="customBufferLocation">
                                    <span class="path" :title="bufferPath">{{ bufferPath || "No folder selected" }}</span>
                                    <button @click="selectBufferLocation">Select Directory</button>
                                </div>
                            </div>
                        </section>
                    </TabContent>

                    <TabContent tab="editing" :activeTab="activeTab">
                        <section>
                            <h2>Input</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Auto-close brackets and quotation marks</span>
                                    <input type="checkbox" v-model="bracketClosing" @change="updateSettings" />
                                </label>
                            </div>
                        </section>
                        <section>
                            <h2>Indentation</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Tab size</span>
                                    <select v-model="tabSize" @change="updateSettings" class="tab-size">
                                        <option
                                            v-for="size in [1, 2, 3, 4, 5, 6, 7, 8]"
                                            :key="size"
                                            :selected="tabSize === size"
                                            :value="size"
                                        >{{ size }} {{ size === 1 ? 'space' : 'spaces' }}</option>
                                    </select>
                                </label>
                                <label class="setting">
                                    <span class="text">Indent using</span>
                                    <select v-model="indentType" @change="updateSettings" class="indent-type">
                                        <option value="space" :selected="indentType === 'space'">Spaces</option>
                                        <option value="tab" :selected="indentType === 'tab'">Tabs</option>
                                    </select>
                                </label>
                            </div>
                        </section>
                        <section>
                            <h2>New Blocks</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Default block language</span>
                                    <select v-model="defaultBlockLanguage" @change="updateSettings" class="block-language">
                                        <template v-for="lang in languageOptions" :key="lang.value">
                                            <option :selected="lang.value === defaultBlockLanguage" :value="lang.value">{{ lang.name }}</option>
                                        </template>
                                    </select>
                                </label>
                                <label class="setting">
                                    <span class="text">
                                        Auto-detection
                                        <small>Switch a block's language to match what you type</small>
                                    </span>
                                    <input
                                        type="checkbox"
                                        v-model="defaultBlockLanguageAutoDetect"
                                        @change="updateSettings"
                                        class="language-auto-detect"
                                    />
                                </label>
                            </div>
                        </section>
                    </TabContent>

                    <TabContent tab="appearance" :activeTab="activeTab">
                        <section>
                            <h2>Theme</h2>
                            <div class="card">
                                <div class="setting theme-setting">
                                    <div class="theme-picker" role="radiogroup" aria-label="Color theme">
                                        <label v-for="t in themes" :key="t.value" :class="['theme-option', t.value]">
                                            <input type="radio" name="theme" :value="t.value" v-model="theme" @change="updateSettings" />
                                            <span class="thumb"></span>
                                            {{ t.name }}
                                        </label>
                                    </div>
                                </div>
                                <label class="setting" v-if="isMac && !isWebApp">
                                    <span class="text">
                                        Translucent window
                                        <small>Let the desktop show through the window</small>
                                    </span>
                                    <input type="checkbox" v-model="translucentWindow" @change="updateSettings" />
                                </label>
                            </div>
                        </section>
                        <section>
                            <h2>Editor Font</h2>
                            <div class="card">
                                <div
                                    class="font-preview"
                                    :style="{ fontFamily: `'${fontFamily}'`, fontSize: fontSize + 'px', lineHeight }"
                                    aria-hidden="true"
                                >The quick brown fox jumps over the lazy dog<br>0O 1lI {} [] () => != === 3.14</div>
                                <label class="setting">
                                    <span class="text">Font</span>
                                    <select v-model="fontFamily" @change="updateSettings" class="font-family">
                                        <option
                                            v-for="[font, label] in systemFonts"
                                            :selected="font === fontFamily"
                                            :value="font"
                                        >{{ label }}</option>
                                    </select>
                                </label>
                                <label class="setting">
                                    <span class="text">Size</span>
                                    <select v-model="fontSize" @change="updateSettings" class="font-size">
                                        <option
                                            v-for="size in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                                            :selected="size === fontSize"
                                            :value="size"
                                        >{{ size }}px{{ size === defaultFontSize ? " (default)" : "" }}</option>
                                    </select>
                                </label>
                                <label class="setting">
                                    <span class="text">Line height</span>
                                    <select v-model.number="lineHeight" @change="updateSettings" class="line-height">
                                        <option :value="1.2">1.2</option>
                                        <option :value="1.3">1.3 (compact)</option>
                                        <option :value="1.4">1.4 (default)</option>
                                        <option :value="1.5">1.5</option>
                                        <option :value="1.6">1.6</option>
                                        <option :value="1.8">1.8</option>
                                    </select>
                                </label>
                            </div>
                        </section>
                        <section>
                            <h2>Editor</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Show line numbers</span>
                                    <input type="checkbox" v-model="showLineNumberGutter" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Show fold gutter</span>
                                    <input type="checkbox" v-model="showFoldGutter" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Show white-space</span>
                                    <input type="checkbox" v-model="showWhitespace" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">
                                        Show color previews
                                        <small>CSS, HTML, JavaScript, TypeScript, Vue and TSX blocks</small>
                                    </span>
                                    <input type="checkbox" v-model="colorPreviewEnabled" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Cursor blink rate</span>
                                    <select v-model.number="cursorBlinkRate" @change="updateSettings" class="cursor-blink-rate">
                                        <option :value="0">Off</option>
                                        <option :value="250">250 ms</option>
                                        <option :value="500">500 ms</option>
                                        <option :value="750">750 ms</option>
                                        <option :value="1000">1000 ms (default)</option>
                                        <option :value="1250">1250 ms</option>
                                        <option :value="1500">1500 ms</option>
                                        <option :value="2000">2000 ms</option>
                                    </select>
                                </label>
                            </div>
                        </section>
                        <section>
                            <h2>Window</h2>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Interface font</span>
                                    <select v-model="uiFontFamily" @change="updateSettings" class="ui-font-family">
                                        <option value="">System font (default)</option>
                                        <option
                                            v-for="[font, label] in systemFonts.slice(1)"
                                            :value="font"
                                        >{{ label }}</option>
                                    </select>
                                </label>
                                <label class="setting">
                                    <span class="text">Show sidebar</span>
                                    <input type="checkbox" v-model="showLeftPanel" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Show tabs</span>
                                    <input type="checkbox" v-model="showTabs" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Show tabs in fullscreen mode</span>
                                    <input type="checkbox" v-model="showTabsInFullscreen" @change="updateSettings" :disabled="!showTabs" />
                                </label>
                            </div>
                        </section>
                    </TabContent>

                    <TabContent tab="keyboard-bindings" :activeTab="activeTab">
                        <section>
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Keymap</span>
                                    <select v-model="keymap" @change="updateSettings" class="keymap">
                                        <template v-for="km in keymaps" :key="km.value">
                                            <option :selected="km.value === keymap" :value="km.value">{{ km.name }}</option>
                                        </template>
                                    </select>
                                </label>
                                <label class="setting" v-if="keymap === 'emacs' && isMac">
                                    <span class="text">Meta key</span>
                                    <select v-model="metaKey" @change="updateSettings" class="metaKey">
                                        <option :selected="metaKey === 'meta'" value="meta">Command</option>
                                        <option :selected="metaKey === 'alt'" value="alt">Option</option>
                                    </select>
                                </label>
                            </div>
                        </section>
                        <KeyboardBindings
                            :userKeys="keyBindings ? keyBindings : {}"
                            v-model="keyBindings"
                            @addKeyBindingDialogVisible="addKeyBindingDialogVisible = $event"
                        />
                    </TabContent>

                    <TabContent tab="updates" :activeTab="activeTab">
                        <section class="about">
                            <img src="@/resources/icon.png" alt="" />
                            <div>
                                <div class="app-name">Heynote</div>
                                <div class="version">Version {{ appVersion }}</div>
                            </div>
                        </section>
                        <section v-if="!isWebApp">
                            <div class="card">
                                <label class="setting">
                                    <span class="text">Periodically check for new updates</span>
                                    <input type="checkbox" v-model="autoUpdate" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">Automatically install new updates</span>
                                    <input type="checkbox" v-model="autoInstallUpdates" @change="updateSettings" />
                                </label>
                                <label class="setting">
                                    <span class="text">
                                        Use beta versions of Heynote
                                        <small>Get new features early, with a few more rough edges</small>
                                    </span>
                                    <input type="checkbox" v-model="allowBetaVersions" @change="updateSettings" />
                                </label>
                            </div>
                        </section>
                    </TabContent>
                </div>
            </div>

            <div class="bottom-bar" :inert="addKeyBindingDialogVisible">
                <button
                    @click="$emit('closeSettings')"
                    class="close"
                >Done</button>
            </div>
        </div>
        <div class="shader"></div>
    </div>
</template>

<style lang="sass" scoped>
    // the theme thumbnails: a tiny window with a sidebar, an accent (selected) line and two lines of text
    =theme-thumb($bg, $sidebar, $line)
        background: linear-gradient(var(--accent), var(--accent)) 26px 11px / 26px 4px no-repeat, linear-gradient($line, $line) 26px 20px / 32px 3px no-repeat, linear-gradient($line, $line) 26px 28px / 22px 3px no-repeat, linear-gradient(to right, $sidebar 0 20px, $bg 20px)

    .settings
        z-index: 500 // above the search panel and other overlays
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0

        .shader
            z-index: 1
            position: absolute
            top: 0
            left: 0
            bottom: 0
            right: 0
            background: rgba(0, 0, 0, 0.5)
            +shader-enter

        .dialog
            --dialog-height: 620px
            --bottom-bar-height: 56px
            box-sizing: border-box
            z-index: 2
            position: absolute
            left: 50%
            top: 50%
            transform: translate(-50%, -50%)
            +dialog-enter
            width: 820px
            height: var(--dialog-height)
            max-width: calc(100% - 32px)
            max-height: calc(100% - 32px)
            display: flex
            flex-direction: column
            +rc-popover
            &:active, &:selected, &:focus, &:focus-visible
                outline: none
            .dialog-content
                flex-grow: 1
                display: flex
                min-height: 0
                // edge to edge, a shade off the content, like System Settings
                .sidebar
                    box-sizing: border-box
                    flex-shrink: 0
                    width: 196px
                    padding: 16px 10px
                    background: var(--fill-25)
                    border-right: 1px solid var(--border)
                .settings-content
                    flex-grow: 1
                    padding: 22px 32px 32px
                    overflow-y: auto
                    position: relative
                    .pane-title
                        font-size: 20px
                        font-weight: 700
                        letter-spacing: -0.01em
                        margin-bottom: 20px
                    select
                        +rc-select
                        width: 200px
                    // on/off settings are switches; the hotkey modifiers (KeyboardHotkey) stay checkboxes
                    input[type=checkbox]
                        +rc-switch
                    section
                        margin-bottom: 26px
                        > h2
                            font-size: 13px
                            font-weight: 600
                            color: var(--text-600)
                            margin: 0 0 8px 2px
                    // a grouped list: one rounded container, inset hairlines between rows
                    .card
                        border: 1px solid var(--border)
                        border-radius: 10px
                        background: var(--fill-25)
                        overflow: hidden
                    .setting
                        position: relative
                        box-sizing: border-box
                        display: flex
                        align-items: center
                        justify-content: space-between
                        gap: 20px
                        min-height: 46px
                        padding: 9px 14px
                        user-select: none
                        & + .setting::before, .font-preview + &::before
                            content: ""
                            position: absolute
                            top: 0
                            left: 14px
                            right: 14px
                            height: 1px
                            background: var(--border)
                        .text
                            display: flex
                            flex-direction: column
                            gap: 2px
                            font-size: 13px
                            small
                                font-size: 11.5px
                                color: var(--text-400)
                        &:has(input:disabled)
                            color: var(--text-400)
                            input
                                opacity: 1
                        &.hotkey
                            :deep(.keyboard-hotkey)
                                flex-grow: 1
                                padding: 0
                                border: none
                                background: none
                    .font-family, .ui-font-family
                        width: 240px
                    .font-size, .line-height
                        width: 140px
                    .font-preview
                        padding: 16px 18px
                        border-bottom: 1px solid var(--border)
                        background: var(--fill-25)
                        color: var(--text)
                        white-space: nowrap
                        overflow: hidden
                        text-overflow: ellipsis

                    .theme-setting
                        justify-content: center
                        padding: 16px 14px 14px
                    .theme-picker
                        display: flex
                        gap: 28px
                        .theme-option
                            display: flex
                            flex-direction: column
                            align-items: center
                            gap: 7px
                            font-size: 12px
                            color: var(--text-600)
                            cursor: pointer
                            input
                                position: absolute
                                opacity: 0
                                pointer-events: none
                            .thumb
                                width: 72px
                                height: 46px
                                border-radius: 7px
                                box-shadow: 0 0 0 1px var(--border-200), 0 1px 3px rgb(0 0 0 / 0.15)
                                outline: 2px solid transparent
                                outline-offset: 2px
                                transition: outline-color 150ms ease, scale 120ms var(--ease-out)
                            &:active .thumb
                                scale: 0.96
                            &.light .thumb
                                +theme-thumb(#fff, #e8e8ed, #d1d1d6)
                            &.dark .thumb
                                +theme-thumb(#1e1e20, #2c2c2f, #48484c)
                            // half light, half dark
                            &.system .thumb
                                position: relative
                                +theme-thumb(#fff, #e8e8ed, #d1d1d6)
                                &::after
                                    content: ""
                                    position: absolute
                                    inset: 0
                                    border-radius: inherit
                                    clip-path: inset(0 0 0 50%)
                                    +theme-thumb(#1e1e20, #2c2c2f, #48484c)
                            &:has(input:checked)
                                color: var(--text)
                                font-weight: 600
                                .thumb
                                    outline-color: var(--accent)
                            &:has(input:focus-visible) .thumb
                                outline-color: var(--text-400)
                            @media (prefers-reduced-motion: reduce)
                                &:active .thumb
                                    scale: none

                    .file-path
                        .path
                            min-width: 0
                            font-size: 12px
                            font-family: "Hack"
                            color: var(--text-600)
                            white-space: nowrap
                            overflow: hidden
                            text-overflow: ellipsis
                            direction: rtl
                            text-align: left
                        > button
                            +rc-button
                            flex-shrink: 0

                    .about
                        display: flex
                        align-items: center
                        gap: 16px
                        padding: 4px 2px
                        img
                            width: 64px
                            height: 64px
                        .app-name
                            font-size: 17px
                            font-weight: 700
                        .version
                            margin-top: 3px
                            font-size: 12px
                            color: var(--text-600)
                            user-select: text
            .bottom-bar
                box-sizing: border-box
                flex-shrink: 0
                display: flex
                justify-content: flex-end
                align-items: center
                height: var(--bottom-bar-height)
                border-top: 1px solid var(--border)
                padding: 0 20px
                .close
                    +rc-button
                    +rc-button-primary
                    min-width: 76px
                    padding: 0 16px
</style>
