# End-to-end tests

Playwright tests that drive the real app (production build of `client/` + `server/`) in a browser.
The server's `@rtsdk/topia` calls go to `mock-topia/server.mjs`, an in-memory fake of the Topia public
API, so no Topia credentials, world or network access are needed. The PR check (`E2E`) runs them on
every push; see `.github/workflows/e2e.yml` (managed by Terraform in config_texts).

## Run

```bash
npm install                      # app deps, repo root
cd e2e
npm install
npx playwright install chromium
npm test                         # builds the app, starts the mock + app, runs all specs
npm run test:ui                  # interactive mode
```

Against the Docker image instead of local Node (what ships; needs Docker):

```bash
e2e/scripts/test-image.sh        # image exactly as the Dockerfile builds it
e2e/scripts/test-image.sh 24     # --build-arg NODE_VERSION=24, fails unless the image runs Node 24
```

Ports: app `3100`, mock `3101` (override with `APP_PORT` / `MOCK_TOPIA_PORT`).

## Layout

| Path | What it is | When forking into a new app |
|---|---|---|
| `tests/platform/` | Checks every SDK app must pass: health endpoint contract, app shell fallback, credential checks, the interactive secret never reaching the browser | Keep identical; only edit `app.config.ts` |
| `app.config.ts` | The app's credentialed API routes, their known bugs, the entry page and the app shell marker | List every route that calls `getCredentials`; set `APP_SHELL_MARKER` if the page isn't a React root |
| `tests/app/` | Tic-Tac-Toe tests: joining (`join`), turns (`moves`), wins and draws (`endings`), resets and the Reset page (`reset`), the Leaderboard/Badges drawer (`drawer`), permissions, anti-cheat and concurrency (`security`) | Replace with tests for the app's own pages and rules |
| `fixtures.ts` | `world.seed({...})` builds one isolated Topia world per test with the board scene dropped (key asset, labels, X/O sprites, 9 cells) and four people (`ALICE`, `BOB`, `CAROL`, `ADMIN`); `gameData()` builds the key asset's game state; `world.select()` / `world.click()` / `world.reset()` send what the board's webhooks and the drawer send; `world.url()` / `world.api()` add the session credentials Topia appends | Extend `seed` for the app's data objects |
| `mock-topia/server.mjs` | Fake Topia public API. Like the real one, world routes reject calls with neither an API key nor an interactive JWT carrying a nonce, and data-object writes honour `lock` (409 when the lockId is held) | Add routes for any endpoint the app calls that isn't there |

Every test gets its own world, so the suite runs fully in parallel. Each test also fails if the app
calls a public-API endpoint the mock doesn't implement, so an `@rtsdk/topia` upgrade that starts using
new endpoints can't pass silently. A full app example lives in sdk-quiz (`e2e/tests`).

## Known bugs

Tests for bugs that still exist are marked `test.fail(...)`: they pass while the bug is there and
fail with "Expected to fail, but passed" once it's fixed, so the marker is removed in the same change
as the fix. In `tests/platform/` the markers come from `knownBugs` on each route in `app.config.ts`
(and `ENTRY_PAGE_KNOWN_BUGS` for the page load), so the specs stay identical across apps.

| Test | Bug | Fix |
|---|---|---|
| `platform/credentials.spec.ts` "names the credential problem" (`unnamedCredentialError`) | `getCredentials` returns `{ error }` instead of throwing, so requests with bad credentials carry on and fail later on a Topia call. | Throw from `getCredentials` (protected file: needs explicit approval). Tracked in EXP-428 #6. |
| `platform/credentials.spec.ts` "rejects credentials signed for another app's public key" (`acceptsForeignCredentials`) | `getCredentials` never compares `interactivePublicKey` with `INTERACTIVE_KEY`. | Same fix, EXP-428 #6. |
| `app/security.spec.ts` "cells outside the board" | `click/9`, `click/-1` are accepted and pass the turn. | Accept only cells 0-8. EXP-442 #1. |
| `app/security.spec.ts` "a display name can't change the number of wins" | Leaderboard entries are `name\|wins` split on `\|`. | Store objects or strip `\|`. EXP-442 #2. |
| `app/security.spec.ts` "at the same time" joins (2) | The join lock is per visitor, so simultaneous joins race. | Lock per board. EXP-442 #3. |

The interactive secret leak (EXP-429) doesn't apply to this app: no route returns SDK objects (the
platform `secrets.spec.ts` tests and `app/security.spec.ts` "error responses never carry the interactive
secret" check it).

Tic-Tac-Toe's sprite and webhook URLs (`BUCKET`, `APP_URL`) are only written onto dropped assets as
strings, Google Sheets logging is off (no sheet id), and the browser can only reach localhost, so no
test reaches a real service.

## Conventions

- New tests are mutation-checked: break the behavior in the app and confirm the test goes red.
- Before merging, `npx playwright test --repeat-each=3` must pass every time.
