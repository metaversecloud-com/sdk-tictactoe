import { defineConfig, devices } from "@playwright/test";
import { APP_PORT, INTERACTIVE_KEY, INTERACTIVE_SECRET, MOCK_TOPIA_PORT } from "./constants";

// E2E_APP_IMAGE=<image> runs the app from a Docker image (what ships, e.g. to test a Node upgrade)
// instead of local Node. The container reaches the mock on the host through host.docker.internal.
const APP_IMAGE = process.env.E2E_APP_IMAGE;
const mockHost = `${APP_IMAGE ? "host.docker.internal" : "localhost"}:${MOCK_TOPIA_PORT}`;

// The real app (production build) talks to an in-memory fake of the Topia public API.
// Explicit env wins over any developer ../.env because dotenv never overrides existing variables.
const appEnv = {
  PORT: APP_IMAGE ? "3000" : String(APP_PORT),
  NODE_ENV: "test",
  INSTANCE_DOMAIN: mockHost,
  INSTANCE_PROTOCOL: "http",
  INTERACTIVE_KEY,
  INTERACTIVE_SECRET,
  API_KEY: "",
  // Only used as strings: sprite URLs written onto dropped assets and webhook URLs registered on them.
  // Neither is ever fetched by the server, and the browser can only reach localhost (fixtures.ts).
  BUCKET: "https://example.invalid/tictactoe/",
  APP_URL: `http://localhost:${APP_PORT}/api/`,
  TEXT_ASSET_ID: "textAsset",
  WEB_IMAGE_ASSET_ID: "webImageAsset",
  // Never let a test reach a real service: analytics rows go to Google Sheets only when a sheet id is set.
  GOOGLESHEETS_SHEET_ID: "",
  GOOGLESHEETS_CLIENT_EMAIL: "",
  GOOGLESHEETS_PRIVATE_KEY: "",
};

const imageEnvFlags = Object.entries(appEnv)
  .map(([key, value]) => `-e ${key}=${value}`)
  .join(" ");

const appServer = APP_IMAGE
  ? {
      command: `docker run --rm --init --name sdk-app-e2e --add-host=host.docker.internal:host-gateway -p ${APP_PORT}:3000 ${imageEnvFlags} ${APP_IMAGE}`,
      // Never reuse a server already on the port: it wouldn't be the image under test.
      reuseExistingServer: false,
    }
  : {
      command: "npm run build --prefix .. && npm start --prefix ..",
      // The image bakes COMMIT_HASH in (Dockerfile ENV); a local run has to provide it.
      env: { ...appEnv, COMMIT_HASH: "local" },
      reuseExistingServer: !process.env.CI,
    };

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node mock-topia/server.mjs",
      url: `http://localhost:${MOCK_TOPIA_PORT}/__mock/health`,
      env: { MOCK_TOPIA_PORT: String(MOCK_TOPIA_PORT), INTERACTIVE_KEY },
      reuseExistingServer: !process.env.CI,
    },
    {
      ...appServer,
      url: `http://localhost:${APP_PORT}/api/system/health`,
      timeout: 180_000,
    },
  ],
});
