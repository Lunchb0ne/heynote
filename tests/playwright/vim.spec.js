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


// vim ships no built-in :q or :w; without our aliases users get a cryptic
// "Not an editor command" error in vim's panel. These tests verify the
// aliases land cleanly without surfacing such an error.

// vim ships no built-in :w / :q / :wq; without our aliases users get a
// "Not an editor command" message in vim's status panel. These tests verify
// the aliases land without surfacing such a message.
async function runExAndCollectPanel(page, exCmd) {
    await page.locator("body").press(":")
    await page.locator("body").pressSequentially(exCmd)
    await page.locator("body").press("Enter")
    await page.waitForTimeout(100)
    const texts = await page.locator("css=.cm-vim-message").allInnerTexts()
    return texts.join(" | ")
}

test(":w is a no-op (Heynote auto-saves) and produces no vim error", async ({ page }) => {
    const messages = await runExAndCollectPanel(page, "w")
    expect(messages).not.toContain("Not an editor command")
    expect((await heynotePage.getBlocks()).length).toBe(3)
})


test(":q does not surface a 'Not an editor command' error", async ({ page }) => {
    const messages = await runExAndCollectPanel(page, "q")
    expect(messages).not.toContain("Not an editor command")
    // Heynote's closeCurrentTab is a no-op when the scratch buffer is the
    // only tab, so we don't assert tab count here — the wider tab-close
    // behavior is covered by existing tabs.spec.js tests.
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


test("visual selection across blocks yanks clean text (no delimiters) and pastes safely", async ({ page }) => {
    // Cursor at start of "hello" (block 0), select down across the delimiter
    // into block 1, then yank. The register should contain "hello\nfoo()"
    // with no ∞ delimiter, and pasting it should not create a stray block.
    const blocks = await heynotePage.getBlocks()
    await heynotePage.setCursorPosition(blocks[0].content.from)
    await page.locator("body").press("v")
    await expect(page.locator("css=.status-block.vim-mode")).toHaveText("VISUAL")
    // extend selection down into block 1 and to end of "foo()"
    await page.locator("body").press("j")
    await page.locator("body").press("$")
    await page.locator("body").press("y")
    await expect(page.locator("css=.status-block.vim-mode")).toHaveText("NORMAL")

    // Paste into block 2 ("world"): go there, append at end of line, paste.
    const after = await heynotePage.getBlocks()
    await heynotePage.setCursorPosition(after[2].content.to)
    await page.locator("body").press("p")

    const finalBlocks = await heynotePage.getBlocks()
    const content = await heynotePage.getContent()
    // No new block was created by the paste.
    expect(finalBlocks.length).toBe(3)
    // No block's content contains a delimiter character.
    for (const b of finalBlocks) {
        expect(content.slice(b.content.from, b.content.to)).not.toContain("∞")
    }
    // The yanked text (hello + foo()) landed in block 2 without delimiters.
    expect(await heynotePage.getBlockContent(2)).toContain("hello")
    expect(await heynotePage.getBlockContent(2)).toContain("foo()")
})


test("gg / G stay within the active block", async ({ page }) => {
    // Put a multi-line block so gg/G have somewhere to move.
    await heynotePage.setContent(`
∞∞∞text
alpha
beta
gamma
∞∞∞text
delta
epsilon`)
    const settings = await heynotePage.getSettings()
    await heynotePage.setSettings({ ...settings, keymap: "vim" })
    await expect(page.locator("css=.status-block.vim-mode")).toBeVisible()

    const blocks = await heynotePage.getBlocks()
    // Cursor on "beta" (middle line of block 0).
    await heynotePage.setCursorPosition(blocks[0].content.from + "alpha\n".length)

    // G should go to the last line of block 0 ("gamma"), not the buffer end.
    await page.locator("body").press("G")
    let pos = await heynotePage.getCursorPosition()
    let block0 = (await heynotePage.getBlocks())[0]
    expect(pos).toBeGreaterThanOrEqual(block0.content.from)
    expect(pos).toBeLessThanOrEqual(block0.content.to)
    // Specifically on the "gamma" line.
    const gammaStart = block0.content.from + "alpha\nbeta\n".length
    expect(pos).toBe(gammaStart)

    // gg should return to the first line of block 0 ("alpha").
    await page.locator("body").press("g")
    await page.locator("body").press("g")
    pos = await heynotePage.getCursorPosition()
    expect(pos).toBe(block0.content.from)
})


test("/ opens Heynote search panel, not vim's; n advances the match", async ({ page }) => {
    // "hello" appears in block 0; search for it from elsewhere.
    await page.locator("body").press("/")
    // Heynote's search panel should appear; vim's panel should not.
    await expect(page.locator("css=.search-panel")).toBeVisible()
    await expect(page.locator("css=.cm-vim-panel")).toHaveCount(0)

    await page.locator(".search-panel input[main-field]").fill("o")
    await page.waitForTimeout(150)
    await page.locator("body").press("Escape")
    await expect(page.locator("css=.search-panel")).not.toBeVisible()

    // n / N should drive Heynote's find-next/prev with the panel closed.
    const before = await heynotePage.getCursorPosition()
    await page.locator("body").press("n")
    await page.waitForTimeout(100)
    const afterN = await heynotePage.getCursorPosition()
    expect(afterN).not.toBe(before)
})
