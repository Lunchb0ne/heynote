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
        padding: 5px 6px
        font-size: 13px
        padding-left: calc(24px + var(--indent-level) * 16px)
        display: flex
        align-items: center
        scroll-margin-top: 6px
        scroll-margin-bottom: 6px
        +disclosure-caret(calc(7px + var(--indent-level) * 16px))
        user-select: none
        border-radius: 6px
        color: var(--text)
        &:hover
            background-color: var(--fill-50)
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
