<script>
    export default {
        props: ["tab", "activeTab", "name"],

        computed: {
            tabClass() {
                return "tab-" + this.tab + " " + (this.tab === this.activeTab ? "active" : "")
            }
        }
    }
</script>

<template>
    <li :class="tabClass">{{ name }}</li>
</template>

<style scoped lang="sass">
    li
        padding: 7px 12px
        margin: 0 8px 2px 8px
        border-radius: 6px
        font-size: 13px
        line-height: 1.3
        user-select: none
        cursor: pointer
        color: var(--text-600)
        &:hover
            background: var(--fill-50)
            color: var(--text)
        &.active
            background: var(--fill-100)
            color: var(--text)
            cursor: default
</style>
