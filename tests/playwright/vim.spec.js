import { expect, test } from "@playwright/test"
import { HeynotePage } from "./test-utils.js"

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    await heynotePage.setContent(`
∞∞∞text
hello
∞∞∞javascript
foo()
∞∞∞text
world`)

    expect((await heynotePage.getBlocks()).length).toBe(3)

    // Switch to the vim keymap.
    const settings = await heynotePage.getSettings()
    await heynotePage.setSettings({ ...settings, keymap: "vim" })
    // Wait for the keymap to reconfigure and the vim mode reporter to attach.
    await expect(page.locator("css=.status-block.vim-mode")).toBeVisible()
    await expect(page.locator("css=.status-block.vim-mode")).toHaveText("NORMAL")
})


test("dd on a 1-line block leaves the delimiter intact", async ({ page }) => {
    // Cursor on the second 'l' of "hello" (block 0).
    await heynotePage.setCursorPosition(11)
    await page.locator("body").press("d")
    await page.locator("body").press("d")
    // Block count stays at 3; no fusion.
    expect((await heynotePage.getBlocks()).length).toBe(3)
    // Block 0's content is empty (the "hello" line was deleted but the
    // delimiter is untouched).
    expect(await heynotePage.getBlockContent(0)).toBe("")
    // Block 1 still contains "foo()" — atomicRanges + protectAllDelimiters
    // kept the next delimiter intact.
    expect(await heynotePage.getBlockContent(1)).toBe("foo()")
    // No ∞∞∞ should leak into any block's content.
    for (let i = 0; i < 3; i++) {
        expect(await heynotePage.getBlockContent(i)).not.toContain("∞")
    }
})


test(":%s substitute does not corrupt delimiters", async ({ page }) => {
    await heynotePage.setCursorPosition(11)
    await page.locator("body").press(":")
    await page.locator("body").pressSequentially("%s/foo/bar/g")
    await page.locator("body").press("Enter")

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("hello")
    expect(await heynotePage.getBlockContent(1)).toBe("bar()")
    expect(await heynotePage.getBlockContent(2)).toBe("world")
})


test("Mod-Enter still creates a new block in vim mode", async ({ page }) => {
    await heynotePage.setCursorPosition(11)
    // Enter insert mode without moving the cursor across a delimiter boundary.
    await page.locator("body").press("i")
    await expect(page.locator("css=.status-block.vim-mode")).toHaveText("INSERT")
    await page.locator("body").press(heynotePage.agnosticKey("Mod+Enter"))
    expect((await heynotePage.getBlocks()).length).toBe(4)
})


test("StatusBar mode indicator updates on i / Escape / v", async ({ page }) => {
    const mode = page.locator("css=.status-block.vim-mode")

    await expect(mode).toHaveText("NORMAL")

    await page.locator("body").press("i")
    await expect(mode).toHaveText("INSERT")

    await page.locator("body").press("Escape")
    await expect(mode).toHaveText("NORMAL")

    await page.locator("body").press("v")
    await expect(mode).toHaveText("VISUAL")

    await page.locator("body").press("Escape")
    await expect(mode).toHaveText("NORMAL")
})


test("Switching keymap away from vim removes the indicator", async ({ page }) => {
    await expect(page.locator("css=.status-block.vim-mode")).toBeVisible()
    const settings = await heynotePage.getSettings()
    await heynotePage.setSettings({ ...settings, keymap: "default" })
    await expect(page.locator("css=.status-block.vim-mode")).not.toBeVisible()
})


test("insert-mode Backspace merges an empty block into the previous one (parity with default)", async ({ page }) => {
    // Empty block 1 ("foo()") cleanly from normal mode, then probe insert-mode
    // Backspace at the start of the empty block. Atomic ranges should absorb
    // the trailing delimiter and merge the empty block into the previous one
    // — matching default-mode behavior.
    const blocks = await heynotePage.getBlocks()
    await heynotePage.setCursorPosition(blocks[1].content.from)
    // dd in normal mode empties block 1's content (delimiter stays).
    await page.locator("body").press("d")
    await page.locator("body").press("d")
    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(1)).toBe("")
    // Enter insert mode and press Backspace at the start of the empty block.
    await page.locator("body").press("i")
    await expect(page.locator("css=.status-block.vim-mode")).toHaveText("INSERT")
    await page.locator("body").press("Backspace")
    const after = await heynotePage.getBlocks()
    expect(after.length).toBe(2)
    expect(await heynotePage.getBlockContent(0)).toBe("hello")
    expect(await heynotePage.getBlockContent(1)).toBe("world")
})
