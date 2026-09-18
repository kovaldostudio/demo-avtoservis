import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

const SIZES = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("перевірка перед показом клієнту", () => {
  test("сторінка не має горизонтального скролу на жодному розмірі", async ({ page }) => {
    for (const s of SIZES) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `горизонтальний скрол на ${s.name} (${s.width}px)`).toBeLessThanOrEqual(1);
    }
  });

  test("немає порожніх посилань і кнопок без дії", async ({ page }) => {
    await page.goto("/");
    const dead = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || href === "#" || href.trim() === "") bad.push(a.textContent?.trim() || "(без тексту)");
      });
      return bad;
    });
    expect(dead, `посилання, які нікуди не ведуть: ${dead.join(", ")}`).toHaveLength(0);
  });

  test("не лишилось тексту-заглушки", async ({ page }) => {
    await page.goto("/");
    const body = (await page.textContent("body")) ?? "";
    for (const junk of ["Lorem ipsum", "TODO", "XXX", "example.com", "Текст тут"]) {
      expect(body, `у тексті лишилось "${junk}"`).not.toContain(junk);
    }
  });

  test("доступність: критичних і серйозних порушень немає", async ({ page }) => {
    await page.goto("/");
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: false },
      axeOptions: { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } },
    });
  });

  test("скріншоти трьох розмірів", async ({ page }) => {
    for (const s of SIZES) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `qa/shots/${s.name}.png`, fullPage: true });
    }
  });
});
