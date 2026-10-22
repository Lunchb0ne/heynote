import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("translucentWindow setting makes the window background see-through", async ({ page }) => {
    test.skip(!await page.evaluate(() => window.heynote.platform.isMac), "vibrancy is macOS only")
    const body = page.locator("body")
    await expect(body).toHaveCSS("background-color", "rgb(255, 255, 255)")
    // the editor never paints its own background, so the window background (or native vibrancy) shows through
    await expect(page.locator(".cm-editor")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")

    await heynotePage.setSettings({...await heynotePage.getSettings(), translucentWindow: true})
    await expect(page.locator("html")).toHaveAttribute("translucent", "")
    await expect(body).toHaveCSS("background-color", "rgba(255, 255, 255, 0.4)")

    await heynotePage.setSettings({...await heynotePage.getSettings(), translucentWindow: false})
    await expect(page.locator("html")).not.toHaveAttribute("translucent")
    await expect(body).toHaveCSS("background-color", "rgb(255, 255, 255)")
})
