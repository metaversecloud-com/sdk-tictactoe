<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Tic-Tac-Toe

Turn-based Tic-Tac-Toe on the Topia canvas, with a React drawer for status, leaderboards, and ecosystem badges.

## Introduction / Summary

Two visitors claim X and O by clicking sprites on a **prebuilt board scene**, then take turns clicking cells on the canvas. The server validates moves, drops the appropriate X/O sprite at the clicked cell, and — on a win — drops a finish-line PNG and a crown, updates a per-instance leaderboard, and awards ecosystem badges. When a visitor clicks the key asset, an in-drawer React UI opens with **Game / Leaderboard / Badges** tabs, a gear icon for an admin panel, and a sticky Reset button.

Built with the [Topia JavaScript SDK](https://metaversecloud-com.github.io/mc-sdk-js/index.html).

## Key Features

### Canvas board (prebuilt scene, not auto-generated)

An admin drops a **prebuilt scene** (`.dropAssetsByScene`) into the world containing all board pieces at their canonical positions. On drawer open, `verifyBoard` self-heals any missing pieces at expected positions relative to the key asset — but the scene is expected to be intact.

The board consists of:

- `TicTacToe_board` — background PNG
- `TicTacToe_gameText` — status text at the top of the board
- `TicTacToe_playerXText`, `TicTacToe_playerOText` — the two player-name labels
- `TicTacToe_x`, `TicTacToe_o` — the pink X and blue O selection sprites (wired to `POST /api/select-player/{x|o}`)
- `TicTacToe_cell` × 9 — 9 clickable cells sharing this unique name (all wired to `POST /api/click/{0..8}`)
- The **key asset** — a separate dropped asset (e.g. a board frame or reset button) whose `assetId` is passed as `credentials.assetId` when the drawer opens

Every scene lookup uses `world.fetchDroppedAssetsBySceneDropId({ sceneDropId, uniqueName })` — no assetId-prefixed unique names anywhere.

### Drawer (React + Vite + TypeScript)

Opened by clicking the key asset. Three tabs plus a gear icon in the header:

- **Game** — status text ("It's Alice's turn." / "Game over…"), a personal record card (your total wins + games played), and a text-only How to Play block. No image.
- **Leaderboard** — top-25 by wins on this key asset. Admin-only "Reset Leaderboard" button at the bottom.
- **Badges** — ecosystem badge grid, owned in color, unowned in grayscale.
- **Admin (gear icon)** — full-screen with a back arrow, force-reset board control, reset-leaderboard shortcut, and placeholder cards. Extend by adding cards to `client/src/components/AdminView.tsx`.

A sticky **Reset Board** button lives at the bottom of the drawer on every tab. It opens a confirm modal. The confirm flow is also triggered by `?reset=true` on the drawer URL.

### First-player pick

When the SECOND player successfully claims their symbol, the server rolls a fresh 50/50 to decide who moves first. `lastPlayerTurn` is set to the _non-first_ player's visitorId (so the first player can move under the existing turn-gate logic) and the game text updates to `It's <firstPlayerUsername>'s turn.`.

### Ecosystem badges

Three badges must be pre-created in the Topia Ecosystem dashboard with `type: BADGE` and matching names:

| Badge Name | Threshold                    |
| ---------- | ---------------------------- |
| `Victory`  | `totalWins >= 1` (first win) |
| `Champion` | `totalWins >= 15`            |
| `Hobbyist` | `totalGamesPlayed >= 10`     |

`totalWins` is incremented on every win in `handleClaimCell`. `totalGamesPlayed` is incremented on both players when the SECOND player joins (in `handlePlayerSelection`). Badge checks are best-effort — a badge failure never breaks the game.

### Analytics — no PII

Server-side analytic events fire on data-object updates via the SDK's `analytics: [...]` option. **No `displayName`, `identityId`, or `username`** is written to Google Sheets or passed to analytics payloads — only `profileId`.

| Event                      | When                                                  |
| -------------------------- | ----------------------------------------------------- |
| `joins`                    | A visitor claims X or O                               |
| `starts`                   | On the first move of a game                           |
| `wins`                     | On win detection                                      |
| `ties`                     | Both players, when the board fills without a winner   |
| `completions`              | Both players on win or tie                            |
| `resets`                   | Every reset                                           |
| `drawer_opened`            | Once per minute-bucketed session per visitor          |
| `badge_earned_<BadgeName>` | Each newly-granted badge (underscores replace spaces) |

### Data Objects

#### Key Asset

The primary source of truth for game state and per-instance leaderboard.

```ts
{
  claimedCells: { 0: null | visitorId, 1: ..., 8: ... };
  isGameOver: boolean;
  isResetInProgress: boolean;
  keyAssetId: string;
  lastInteraction: number;
  lastPlayerTurn: number | null;
  playerCount: number;
  playerX: { profileId, username, visitorId };
  playerO: { profileId, username, visitorId };
  resetCount: number;
  turnCount: number;
  leaderboard: { [profileId]: "displayName|wins" };  // pipe-delimited per lunch-swap format
}
```

#### Visitor

Per-visitor counters for badge thresholds.

```ts
{
  totalWins: number;
  totalGamesPlayed: number;
}
```

#### World

Aggregate counters (kept for backward-compat with world-wide stats consumers).

```ts
{
  keyAssets: {
    [assetId]: {
      totalGamesResetCount: number;
      totalGamesWonCount: number;
    };
  };
}
```

## API Endpoints

All routes mount under `/api`.

| Method | Route                        | Purpose                                                                                                   |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/game-state`            | Drawer boot payload: gameData, leaderboard, badges, visitor inventory, visitor stats. Runs `verifyBoard`. |
| `GET`  | `/api/leaderboard`           | Top-25 leaderboard for this key asset.                                                                    |
| `POST` | `/api/leaderboard/reset`     | Wipe the leaderboard. Admin-only.                                                                         |
| `POST` | `/api/select-player/:symbol` | Claim X or O for the calling visitor. Second-join rolls a coin and picks first mover.                     |
| `POST` | `/api/click/:cell`           | Place a move in cell 0–8; runs win/draw detection; awards badges on win.                                  |
| `POST` | `/api/reset`                 | Reset the board. Admin any time; player if game over or > 5 min stale.                                    |
| `GET`  | `/system/health`             | Version + env presence (public).                                                                          |

Concurrency: every turn / player-selection holds a 5-second-bucketed lock via `lockDataObject`. Collisions return HTTP 409.

## Implementation Requirements

### Ecosystem badges — pre-deploy step

Before deploying, create these three badges in the Topia Ecosystem dashboard with the exact names shown above. Give each a name, an icon (this is what shows in the drawer), and a description. If any badge is missing, that award attempt logs and moves on — the game keeps working.

### Required S3 assets

The `BUCKET` env var must serve these PNGs at its root:

```
Board.png
pink_x.png
blue_o.png
crown.png
TopLeft.png     TopCenter.png    TopRight.png
MiddleLeft.png  MiddleCenter.png MiddleRight.png
BottomLeft.png  BottomCenter.png BottomRight.png
pink_horizontal.png   pink_vertical.png   pink_oblique.png   pink_oblique_1.png
blue_horizontal.png   blue_vertical.png   blue_oblique.png   blue_oblique_1.png
```

### Required Assets with Unique Names

The prebuilt scene the admin drops must contain assets with these unique names. `verifyBoard` (called from `/api/game-state`) checks their existence and self-heals if any are missing.

| Unique Name             | Count | Description                                            |
| ----------------------- | ----- | ------------------------------------------------------ |
| `TicTacToe_board`       | 1     | Board background                                       |
| `TicTacToe_gameText`    | 1     | Status text at top of the board                        |
| `TicTacToe_playerXText` | 1     | Player X label                                         |
| `TicTacToe_playerOText` | 1     | Player O label                                         |
| `TicTacToe_x`           | 1     | Pink X selection sprite (webhook: `select-player/x`)   |
| `TicTacToe_o`           | 1     | Blue O selection sprite (webhook: `select-player/o`)   |
| `TicTacToe_cell`        | 9     | Clickable cells (webhook: `click/0` … `click/8`)       |
| `TicTacToe_move`        | 0..N  | Placed on each turn — not in the base scene            |
| `TicTacToe_finishLine`  | 0..1  | Placed at end-of-game — not in the base scene          |
| `TicTacToe_crown`       | 0..1  | Placed above the winner's name — not in the base scene |

The **key asset** (the visible asset that opens the drawer) is a separate dropped asset. Its `assetId` is passed as `credentials.assetId` and is used to store the game state on its data object.

## Environment Variables

Create a `.env` file in the app root. See `.env-example` for a template.

| Variable                    | Description                                                                                   | Required |
| --------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`           | Topia interactive app key.                                                                    | Yes      |
| `INTERACTIVE_SECRET`        | Topia interactive app secret.                                                                 | Yes      |
| `INSTANCE_DOMAIN`           | Topia API domain (`api.topia.io` / `api-stage.topia.io`).                                     | Yes      |
| `INSTANCE_PROTOCOL`         | `https` for production/staging, `http` for local.                                             | Yes      |
| `APP_URL`                   | Deployment base URL (must end with `/`). Used to wire up webhook URLs.                        | Yes      |
| `BUCKET`                    | S3 URL prefix (must end with `/`) for the board/piece/crown/finish-line PNGs.                 | Yes      |
| `PORT`                      | Server port (defaults to `3000`).                                                             | No       |
| `NODE_ENV`                  | `development` enables the Vite dev-server proxy; anything else serves the built React bundle. | No       |
| `TEXT_ASSET_ID`             | Asset template id for label assets. Defaults to `textAsset`.                                  | No       |
| `WEB_IMAGE_ASSET_ID`        | Asset template id for image assets. Defaults to `webImageAsset`.                              | No       |
| `COMMIT_HASH`               | Reported by `/system/health`.                                                                 | No       |
| `GOOGLESHEETS_CLIENT_EMAIL` | Google service-account email for optional analytics logging.                                  | No       |
| `GOOGLESHEETS_PRIVATE_KEY`  | Google service-account private key.                                                           | No       |
| `GOOGLESHEETS_SHEET_ID`     | Sheet id to append events to. Unset = Sheets logging is skipped.                              | No       |
| `GOOGLESHEETS_SHEET_RANGE`  | Sheet range (defaults to `Sheet1`).                                                           | No       |

## Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Getting Started

```bash
# 1. clone + install
git clone <repo>
cd sdk-tictactoe
npm install              # installs both workspaces via npm workspaces

# 2. .env
cp .env-example .env
# fill in INTERACTIVE_KEY / INTERACTIVE_SECRET / APP_URL / BUCKET

# 3. dev — runs server (3000) + Vite (5173) concurrently
npm run dev

# 4. production
npm run build            # builds both server and client
npm start                # runs the server, which serves the client bundle
```

### Extending the Admin panel

`client/src/components/AdminView.tsx` renders a full-screen admin surface with a back arrow. Add cards there for new admin-only actions. Wire each to a new `POST /api/*` route in `server/routes.ts` and a matching controller in `server/controllers/`. Gate the controller by fetching the visitor and checking `visitor.isAdmin` (see `handleResetLeaderboard.ts` for the pattern).

### Where to find INTERACTIVE_KEY and INTERACTIVE_SECRET

- [Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [View it in action (Dev)](https://topia.io/tictactoe-dev) · [(Prod)](https://topia.io/tictactoe-prod)
