import { defineConfig, devices } from "@playwright/test";

/**
 * Сервер піднімає сам Playwright і сам його гасить.
 *
 * Чому не `astro preview`: у Astro 7 це фоновий демон. Якщо порт уже зайнятий
 * прев'ю ІНШОГО проєкту, команда мовчки виходить з кодом 0 — і тести міряють
 * чужий сайт, показуючи зелені цифри для сторінки, якої ти не робив.
 * Один раз це вже сталося. `reuseExistingServer: false` робить таку підміну
 * неможливою: зайнятий порт тепер падає з явною помилкою.
 */
export default defineConfig({
  testDir: "./qa",
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:4331",
    trace: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npx sirv dist --port 4331 --host 127.0.0.1",
    url: "http://localhost:4331",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
