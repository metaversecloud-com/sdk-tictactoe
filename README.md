<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Tic-Tac-Toe

## Introduction / Summary

Tic-Tac-Toe renders a fully-playable 3×3 board **on the Topia canvas itself** — no drawer, no React UI. An admin drops a single "reset" key asset and the app auto-generates a board (pink `#ff61ff` X, blue `#22ffff` O, board + cells + status text) as `_TicTacToe_`-suffixed unique-name dropped assets. Each cell click fires an `assetClicked` webhook to this server, which validates the turn, updates key-asset data-object state, and drops the appropriate move sprite. When a game ends the server drops a `_finishLine` PNG and a `_crown` on the winner (or fires a `pastelConfetti_explosion` on a draw); admins reset the whole board, non-admins can only reset once the game is over (or after 5+ minutes of inactivity).

> **Note:** this app is intentionally client-less — it's a **server-only reference implementation** for turn-based on-canvas games. There is no `client/` directory, no drawer, no admin panel. All state and rendering happens through Topia dropped assets and webhooks.

## Key Features

### Canvas elements & interactions

- **Key asset (the "reset button"):** placed manually by an admin. Its `assetId` seeds every generated asset's unique name: `{assetId}_TicTacToe_*`. Clicking it triggers a reset (admin: full board rebuild; player: only after game-over or 5+ minutes idle).
- **Auto-generated board (via `generateBoard.ts`):** on first interaction the server drops a `_board` PNG, a `_gameText` label, two player-name labels (`_playerXText`, `_playerOText`), two symbol legends (`_x`, `_o`), and nine `_cell` interactive assets — each wired to `assetClicked` webhook `${APP_URL}click/{N}` for cells 0–8.
- **Move sprites (`_move`):** dropped at the clicked cell's position on each turn.
- **End-of-game overlays:** a `_finishLine` PNG (horizontal / vertical / oblique variants) and a `_crown` above the winner's name.
- **World activities:** `GAME_WAITING` fires on first player claim; `GAME_ON` when both players have joined.

### Drawer content / Admin features

None — this app has no drawer UI. Admin gating happens server-side: `handleResetBoard` inspects `visitor.isAdmin` and lets admins force-rebuild the board at any time (via `fetchDroppedAssetsWithUniqueName({ isPartial: true, uniqueName: assetId })` → `World.deleteDroppedAssets` → `generateBoard`).

### Themes

None. The palette (pink X, blue O, `#ece4c3` text) is baked into `generateBoard.ts`.

## Required Assets with Unique Names

Only one asset needs to be placed manually — everything else is generated:

| Unique Name                                                                    | Placed by | Description                                                                                                                                                 |
| ------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{assetId}` (the key)                                                          | Manually  | The "reset button" asset. Its `uniqueName` can be anything without the `_TicTacToe_` marker (or `reset`); the server strips the marker to identify the key. |
| `{assetId}_TicTacToe_board`                                                    | The app   | Board background PNG (generated).                                                                                                                           |
| `{assetId}_TicTacToe_gameText` / `_playerXText` / `_playerOText` / `_x` / `_o` | The app   | Text + legend labels (generated).                                                                                                                           |
| `{assetId}_TicTacToe_cell` × 9                                                 | The app   | Nine clickable cells with `assetClicked` webhooks pointing at `${APP_URL}click/{0..8}` (generated).                                                         |
| `{assetId}_TicTacToe_move`                                                     | The app   | Placed on each turn at the clicked cell's position.                                                                                                         |
| `{assetId}_TicTacToe_finishLine` / `_crown`                                    | The app   | Placed at end-of-game.                                                                                                                                      |

## Technical Architecture

### Data Objects

#### Key Asset (`GameDataType`)

The primary source of truth for game state.

```ts
{
  claimedCells: { 0: null | visitorId, 1: ..., 8: ... };
  isGameOver: boolean;
  isResetInProgress: boolean;
  keyAssetId: string;
  lastInteraction: number;
  lastPlayerTurn: string;              // "x" or "o"
  playerCount: number;
  playerX: { profileId, username, visitorId } | null;
  playerO: { profileId, username, visitorId } | null;
  resetCount: number;
  turnCount: number;
}
```

#### World

```ts
{
  keyAssets: {
    [assetId]: {
      keyAssetId: string;
      gamesPlayedByUser: { [profileId]: number };
      gamesWonByUser:    { [profileId]: number };
      totalGamesResetCount: number;
      totalGamesWonCount:  number;
    };
  };
}
```

#### Visitor

Not used. `Visitor.get` is called only for `isAdmin` checks and `triggerParticle` targeting.

## API Endpoints

All routes mount under `/api`. All game routes are auth-gated (Topia interactive-key middleware).

| Method | Route                        | Purpose                                                                                                                                      |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/select-player/:symbol` | Claim `x` or `o` for the calling visitor (`handlePlayerSelection`).                                                                          |
| `POST` | `/api/click/:cell`           | Place a move in cell 0–8; runs win/draw detection (`handleClaimCell`).                                                                       |
| `POST` | `/api/reset`                 | Reset the board. Admin: full rebuild via `generateBoard`. Non-admin: only if `isGameOver` or `lastInteraction > 5 min` (`handleResetBoard`). |
| `GET`  | `/api/system/health`         | Version + env presence (public).                                                                                                             |

**Concurrency:** every turn holds a 5-second-bucketed lock (`{keyAssetId}-{resetCount}-{turnCount}-{timestamp}`) via `lockDataObject`. Collisions return HTTP 409.

## Analytics

Fires via SDK `analytics: [...]` on data-object updates, plus optional Google Sheets append on completion.

| Event         | Fired when                                                           |
| ------------- | -------------------------------------------------------------------- |
| `joins`       | A visitor successfully claims X or O (`handlePlayerSelection`).      |
| `wins`        | The winning player, when `handleClaimCell` detects a completed line. |
| `ties`        | Both players, when the board fills without a winner.                 |
| `completions` | Both players, on win or tie (also appended to the Google Sheet).     |
| `resets`      | Every reset (`handleResetBoard`).                                    |

**Particles:** `pastelConfetti_explosion` on draw; `crown_float` (visitor-scoped to winner) on win; `blueSmoke_fog` on reset.

## Environment Variables

Create a `.env` at the app root. See `.env-example` for a template.

| Variable                    | Description                                                                                                | Required |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`           | Topia interactive app key. Verified against `interactivePublicKey` on every request.                       | Yes      |
| `INTERACTIVE_SECRET`        | Topia interactive app secret. Also passed to `World.deleteDroppedAssets` on admin reset.                   | Yes      |
| `INSTANCE_DOMAIN`           | Topia API domain (`api.topia.io` / `api-stage.topia.io`).                                                  | Yes      |
| `INSTANCE_PROTOCOL`         | `https` for production/staging, `http` only for local.                                                     | Yes      |
| `APP_URL`                   | Base URL that webhooks (`{APP_URL}click/N`, `{APP_URL}select-player/x`) are wired to.                      | Yes      |
| `BUCKET`                    | S3 URL prefix (e.g. `https://sdk-tictactoe.s3.amazonaws.com/`) for the board/piece/crown/finish-line PNGs. | Yes      |
| `PORT`                      | Server port (defaults to `3000`).                                                                          | No       |
| `NODE_ENV`                  | Toggles error verbosity.                                                                                   | No       |
| `TEXT_ASSET_ID`             | Asset template id for label assets. Defaults to `textAsset`.                                               | No       |
| `WEB_IMAGE_ASSET_ID`        | Asset template id for image assets. Defaults to `webImageAsset`.                                           | No       |
| `COMMIT_HASH`               | Reported by `/system/health` for deploy tracking.                                                          | No       |
| `GOOGLESHEETS_CLIENT_EMAIL` | Google service-account email for optional analytics logging on completions.                                | No       |
| `GOOGLESHEETS_PRIVATE_KEY`  | Google service-account private key.                                                                        | No       |
| `GOOGLESHEETS_SHEET_ID`     | Sheet id to append `completions` events to. If unset, Sheets logging is skipped.                           | No       |
| `GOOGLESHEETS_SHEET_RANGE`  | Sheet range (defaults to `Sheet1`).                                                                        | No       |

### Required S3 assets

The `BUCKET` above must serve these PNGs at its root: `Board.png`, `pink_x.png`, `blue_o.png`, `crown.png`, plus finish-line variants `pink_horizontal.png`, `pink_vertical.png`, `pink_oblique.png`, `pink_oblique_1.png`, `blue_horizontal.png`, `blue_vertical.png`, `blue_oblique.png`, `blue_oblique_1.png`, and corner offset images `TopLeft.png`, `TopRight.png`, `BottomLeft.png`, `BottomRight.png` used by `getFinishLineOptions`.

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

```bash
# from the app root
npm install

# create a .env at the app root (see Environment Variables above)
cp .env-example .env

# development (watch mode)
npm run start-dev

# production
npm run build
npm start
```

## For Developers

### Built With

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Server-only. No client build.

### App-specific notes

- **`_TicTacToe_` uniqueName parser** (`getDroppedAssetDataObject.ts`): the server splits every incoming asset's `uniqueName` on the `_TicTacToe_` marker. Anything with a `reset` suffix (or no suffix) is treated as the key asset; other suffixes route to the corresponding cell/piece handler.
- **Reset flow (admin):** `fetchDroppedAssetsWithUniqueName({ isPartial: true, uniqueName: assetId })` picks up everything the app has generated, `World.deleteDroppedAssets` wipes them, then `generateBoard` re-drops the full board fresh.
- **Reset flow (player):** gated on `isGameOver || (now - lastInteraction) > 5min`. Only clears the moves, finish-line, and crown — leaves the board and labels in place.
- **Win detection:** `getGameStatus` enumerates 8 combos (3 rows / 3 columns / 2 diagonals); `getFinishLineOptions` maps the winning combo to the correct horizontal/vertical/oblique PNG and offset.
- **No SSE / websocket / polling:** all real-time updates flow through Topia's server-side `updateDataObject` and dropped-asset mutations — clients see canvas changes as they happen.
- **`cleanReturnPayload` middleware** wraps `res.send` globally.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/tictactoe-dev), [Prod](https://topia.io/tictactoe-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/TicTacToe-6c7debdbec214886b0fbb004e293f438?v=71f6c3828d3b4f33960326f9bde24781)
