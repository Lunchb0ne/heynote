<script>
    export default {
        props: {
            name: String,
            level: Number,
            selected: Boolean,
            newFolder: Boolean,
            open: Boolean,
        },

        watch: {
            selected() {
                if (this.selected) {
                    // scrollIntoViewIfNeeded is not supported in all browsers
                    // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
                    if (this.$el.scrollIntoViewIfNeeded) {
                        this.$el.scrollIntoViewIfNeeded({
                            behavior: "auto",
                            block: "nearest",
                        })
                    } else {
                        this.$el.scrollIntoView({
                            behavior: "auto",
                            block: "nearest",
                        })
                    }
                }
            }
        },

        computed: {
            className() {
                return {
                    folder: true,
                    selected: this.selected,
                    new: this.newFolder,
                    open: this.open,
                }
            },
            
            style() {
                return {
                    "--indent-level": this.level,
                }
            }
        },
    }
</script>

<template>
    <div
        :class="className"
        :style="style"
    >
        <span class="name">{{ name }}</span>
        <button class="new-folder" tabindex="-1" @click.stop.prevent="$emit('new-folder')">New folder (+)</button>
    </div>
</template>

<style lang="sass" scoped>
    .folder
        padding: 3px 6px
        font-size: 13px
        padding-left: calc(18px + var(--indent-level) * 16px)
        display: flex
        scroll-margin-top: 5px
        scroll-margin-bottom: 5px
        background-image: url('@/assets/icons/caret-right.svg')
        background-size: 13px
        background-repeat: no-repeat
        background-position-y: 5px
        background-position-x: calc(2px + var(--indent-level) * 16px)
        user-select: none
        border-radius: 6px
        color: var(--text)
        +dark-mode
            background-image: url('@/assets/icons/caret-right-white.svg')
        &:hover
            background-color: var(--fill-50)
        &.open
            background-image: url('@/assets/icons/caret-down.svg')
            +dark-mode
                background-image: url('@/assets/icons/caret-down-white.svg')
        &.selected
            background-color: var(--fill-100)
            .new-folder
                display: block
        &.new
            font-style: italic
            color: var(--text-600)


        .name
            flex-grow: 1
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
        .new-folder
            background: var(--fill-100)
            color: var(--text)
            border: none
            border-radius: 4px
            font-size: 10px
            display: none
            flex-shrink: 0
            cursor: pointer
</style>
