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

### Environment Variables

```
APP_URL=http://localhost:3001          # Webhook URL for game events
NODE_ENV=development
PORT=3001
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
API_KEY=xxxxxxxxxxxxx
BUCKET=https://sdk-tictactoe.s3.amazonaws.com/
```

### Optional: Google Sheets Integration

```
GOOGLESHEETS_CLIENT_EMAIL=xxxxxxxxxxxxx
GOOGLESHEETS_SHEET_ID=xxxxxxxxxxxxx
GOOGLESHEETS_PRIVATE_KEY=xxxxxxxxxxxxx
```

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
