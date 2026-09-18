import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./qa",
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:4321",
    trace: "off",
    ...devices["Desktop Chrome"],
  },
  // webServer тут не задається навмисно: `astro preview` у Astro 7 —
  // фоновий демон, він одразу віддає керування, і Playwright вважає,
  // що процес помер. Сервер піднімається в npm-скрипті `qa` через wait-on.
});
