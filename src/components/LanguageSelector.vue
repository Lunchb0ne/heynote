<script>
    import fuzzysort from 'fuzzysort'
    import { LANGUAGES } from '../editor/languages.js'

    const items = LANGUAGES.map(l => {
        return {
            "token": l.token, 
            "name": l.name,
            "guesslang": l.guesslang,
        }
    }).sort((a, b) => {
        return a.name.localeCompare(b.name)
    })
    items.unshift({token: "auto", name:"Auto-detect"})

    items.forEach((item, idx) => {
        item.preparedName = fuzzysort.prepare(item.name)
    })

    export default {
        data() {
            return {
                selected: 0,
                filter: "",
            }
        },

        mounted() {
            this.$refs.container.focus()
            this.$refs.input.focus()
        },

        computed: {
            filteredItems() {
                if (this.filter === "") {
                    return items
                }
                const searchResults = fuzzysort.go(this.filter, items, {
                    keys: ['name', 'guesslang'],
                })
                return searchResults.map(result => {
                    const highlight = result[0].highlight("<b>", "</b>")
                    return {
                        "token": result.obj.token,
                        "name": highlight || result.obj.name,
                    }
                })
            },
        },

        methods: {
            onKeydown(event) {
                if (event.key === "ArrowDown") {
                    this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
                    event.preventDefault()
                    if (this.selected === this.filteredItems.length - 1) {
                        this.$refs.container.scrollIntoView({block: "end"})
                    } else {
                        this.$refs.item[this.selected].scrollIntoView({block: "nearest"})
                    }
                    
                } else if (event.key === "ArrowUp") {
                    this.selected = Math.max(this.selected - 1, 0)
                    event.preventDefault()
                    if (this.selected === 0) {
                        this.$refs.container.scrollIntoView({block: "start"})
                    } else {
                        this.$refs.item[this.selected].scrollIntoView({block: "nearest"})
                    }
                } else if (event.key === "Enter") {
                    this.selectItem(this.filteredItems[this.selected].token)
                    event.preventDefault()
                } else if (event.key === "Escape") {
                    this.$emit("close")
                    event.preventDefault()
                }
            },

            selectItem(token) {
                this.$emit("selectLanguage", token)
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
        }
    }
</script>

<template>
    <form class="language-selector" tabindex="-1" @focusout="onFocusOut" ref="container">
        <input 
            type="text" 
            ref="input"
            @keydown="onKeydown"
            @input="onInput"
            v-model="filter"
            placeholder="Change language…"
            spellcheck="false"
        />
        <ul class="items">
            <li
                v-for="item, idx in filteredItems"
                :key="item.token"
                :class="idx === selected ? 'selected' : ''"
                @click="selectItem(item.token)"
                ref="item"
                v-html="item.name"
            />
        </ul>
    </form>
</template>

<style scoped lang="sass">    
    .language-selector
        +rc-palette

        input
            +rc-palette-input
            padding: 18px 18px
            border-bottom: 1px solid var(--border)
            width: 380px
            +webapp-mobile
                font-size: 16px
                max-width: 100%
        
        .items
            overflow-y: auto
            padding: 8px
            > li
                +rc-palette-item
                ::v-deep(b)
                    font-weight: 700
</style>
