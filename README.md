<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 25%" alt="Topia logo">

# TicTacToe

## Introduction / Summary

TicTacToe is a real-time, multiplayer tic-tac-toe game built with the Topia SDK. Two players compete on a 3x3 board with full game state persistence, win detection, and visual effects. The game board is generated dynamically using dropped assets with webhook interactions.

## Built With

### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

## Key Features

- **Two-Player Gameplay**: Players select X (pink) or O (blue) symbols before the game begins
- **Interactive Board**: 3x3 grid with clickable cells
- **Win Detection**: Automatic detection of winning combinations (horizontal, vertical, diagonal) plus draw detection
- **Visual Effects**: Particle effects for wins (crown, confetti) and resets (smoke)
- **Analytics Tracking**: Tracks player joins, moves, wins, ties, and resets
- **World Activities**: Triggers world activities for game states (GAME_WAITING, GAME_ON)

### Canvas Elements & Interactions

- **Reset Button (Key Asset)**: Clicking resets the board. Admin can force reset; players can reset completed games
- **Player Selection**: Pink X and Blue O symbols for players to claim their side
- **Game Board**: 3x3 grid of clickable cells
- **Status Text**: Dynamic text showing game instructions and current player turn

### Admin Features

- **Full Board Reset**: Admins can completely rebuild the game board at any time
- **Player Reset**: Players can reset after game completion or 5+ minutes of inactivity

## Implementation Requirements

### Required Assets with Unique Names

The app dynamically generates assets using the following unique name pattern:

| Unique Name Pattern               | Description                  |
| --------------------------------- | ---------------------------- |
| `{assetId}_TicTacToe_board`       | The board background image   |
| `{assetId}_TicTacToe_gameText`    | Main game status message     |
| `{assetId}_TicTacToe_playerXText` | Player X name display        |
| `{assetId}_TicTacToe_playerOText` | Player O name display        |
| `{assetId}_TicTacToe_x`           | Pink X selection button      |
| `{assetId}_TicTacToe_o`           | Blue O selection button      |
| `{assetId}_TicTacToe_cell`        | Board cells (9 total)        |
| `{assetId}_TicTacToe_move`        | Player moves placed on board |
| `{assetId}_TicTacToe_finishLine`  | Win line visualization       |
| `{assetId}_TicTacToe_crown`       | Victory crown for winner     |

### Data Objects

**Key Asset (Reset Button)**:

```typescript
{
  claimedCells: { 0-8: visitorId | null },  // Which cells are claimed
  isGameOver: boolean,
  isResetInProgress: boolean,
  keyAssetId: string,
  lastInteraction: Date,
  lastPlayerTurn: number | null,
  playerCount: number,                       // 0, 1, or 2
  playerO: { profileId, username, visitorId },
  playerX: { profileId, username, visitorId },
  resetCount: number,
  turnCount: number
}
```

**World Data Object**:

```typescript
{
  keyAssets: {
    [assetId]: {
      gamesPlayedByUser: { [profileId]: { count } },
      gamesWonByUser: { [profileId]: { count } },
      totalGamesResetCount: number,
      totalGamesWonCount: number
    }
  }
}
```

## Environment Variables

Create a `.env` file in the root directory. See `.env-example` for a template.

| Variable                    | Description                                                                        | Required |
| --------------------------- | ---------------------------------------------------------------------------------- | -------- |
| `NODE_ENV`                  | Node environment (`development` or `production`)                                   | Yes      |
| `PORT`                      | Server port (default: `3001`)                                                      | No       |
| `INSTANCE_DOMAIN`           | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging) | Yes      |
| `INTERACTIVE_KEY`           | Topia interactive app key                                                          | Yes      |
| `INTERACTIVE_SECRET`        | Topia interactive app secret                                                       | Yes      |
| `APP_URL`                   | Webhook URL for game events (e.g., ngrok URL in development)                       | Yes      |
| `APP_VERSION`               | Application version string                                                         | Yes      |
| `BUCKET`                    | S3 bucket URL for game assets (e.g., `https://sdk-tictactoe.s3.amazonaws.com/`)    | Yes      |
| `TEXT_ASSET_ID`             | Asset ID for creating text assets (default: `textAsset`)                           | No       |
| `WEB_IMAGE_ASSET_ID`        | Asset ID for creating web image assets (default: `webImageAsset`)                  | No       |
| `GOOGLESHEETS_CLIENT_EMAIL` | Google service account email for analytics                                         | No       |
| `GOOGLESHEETS_SHEET_ID`     | Google Sheet ID for analytics                                                      | No       |
| `GOOGLESHEETS_PRIVATE_KEY`  | Google service account private key                                                 | No       |

## Developers

### Getting Started

- Clone this repository
- Run `npm i` in root directory

### Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [View it in action!](https://topia.io/tictactoe-prod)
