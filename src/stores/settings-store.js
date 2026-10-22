import { nextTick, toRaw, watch } from "vue"
import { defineStore } from "pinia"

import { SETTINGS_CHANGE_EVENT } from "@/src/common/constants"
import { getCommandKeyBindings } from "@/src/editor/keymap"

export const useSettingsStore = defineStore("settings", {
    state: () => {
        return {
            settings: window.heynote.settings,
            themeSetting: "system",
            theme: window.heynote.themeMode.initial,
            spellcheckEnabled: window.heynote.settings.spellcheckEnabled === true,
            alwaysOnTop: window.heynote.settings.alwaysOnTop,
        }
    },

    getters: {
        commandKeyBindingsMap(state) {
            return getCommandKeyBindings(state.settings.keymap, state.settings.keyBindings, state.settings.emacsMetaKey)
        },
    },
        

    actions: {
        onSettingsChange(settings) {
            //console.log("settings updated", settings)
            this.settings = settings
            this.spellcheckEnabled = settings.spellcheckEnabled === true
            this.alwaysOnTop = settings.alwaysOnTop
        },

        updateSettings(settings) {
            window.heynote.setSettings({
                ...toRaw(this.settings),
                ...settings,
            })
        },

        setSpellcheckEnabled(enabled) {
            this.updateSettings({spellcheckEnabled: enabled})
        },

        setTheme(theme) {
            window.heynote.themeMode.set(theme)
            this.themeSetting = theme
        },

        setUp() {
            window.heynote.mainProcess.on(SETTINGS_CHANGE_EVENT, (event, settings) => {
                this.onSettingsChange(settings)
            })

            window.heynote.themeMode.get().then((mode) => {
                this.theme = mode.computed
                this.themeSetting = mode.theme
            })
            const applyTheme = (theme) => {
                this.theme = theme
                if (theme === "system") {
                    document.documentElement.setAttribute("theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                } else {
                    document.documentElement.setAttribute("theme", theme)
                }
            }
            // crossfade the whole window (the default 250ms view transition) instead of snapping
            // between light and dark; nextTick lets the editor swap its theme inside the transition
            const onThemeChange = (theme) => {
                if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    applyTheme(theme)
                    return
                }
                document.startViewTransition(() => {
                    applyTheme(theme)
                    return nextTick()
                })
            }
            applyTheme(window.heynote.themeMode.initial)
            // vibrancy is macOS only (see registerTranslucentWindow in the main process)
            watch(() => this.settings.translucentWindow, (translucent) => {
                document.documentElement.toggleAttribute("translucent", window.heynote.platform.isMac && translucent === true)
            }, {immediate: true})
            // interface font, in front of the system font stack (--system-font in base.sass)
            watch(() => this.settings.uiFontFamily, (font) => {
                const style = document.documentElement.style
                font ? style.setProperty("--ui-font", JSON.stringify(font)) : style.removeProperty("--ui-font")
            }, {immediate: true})
            window.heynote.themeMode.onChange(onThemeChange)
        },

        tearDown() {
            window.heynote.themeMode.removeListener()
        }
    },
})
