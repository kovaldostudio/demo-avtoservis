import { test, chromium, type Browser } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";
import fs from "node:fs";

/**
 * Аудит швидкості, SEO й доступності.
 *
 * Чому не lighthouse-ci: на Windows його запускач падає з EPERM,
 * коли прибирає власну тимчасову папку Chrome. Тут браузером керує
 * Playwright, і цієї проблеми немає.
 */

const PORT = 9333;
let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch({
    args: [`--remote-debugging-port=${PORT}`],
  });
  fs.mkdirSync("qa/lighthouse", { recursive: true });
});

test.afterAll(async () => {
  await browser?.close();
});

test("Lighthouse: пороги якості", async () => {
  test.setTimeout(180_000);

  const page = await browser.newPage();
  await page.goto("http://localhost:4331/");

  await playAudit({
    page,
    port: PORT,
    thresholds: {
      performance: 90,
      accessibility: 90,
      "best-practices": 90,
      seo: 95,
    },
    reports: {
      formats: { html: true, json: true },
      directory: "qa/lighthouse",
      name: "report",
    },
    ignoreError: false,
  });

  await page.close();
});
