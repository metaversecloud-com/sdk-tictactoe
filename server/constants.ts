export const cellWidth = 80;

export const defaultGameData = {
  claimedCells: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
  },
  isGameOver: false,
  isResetInProgress: false,
  lastInteraction: null,
  lastPlayerTurn: null,
  playerCount: 0,
  playerO: { profileId: null, username: null, visitorId: null },
  playerX: { profileId: null, username: null, visitorId: null },
  resetCount: 0,
  turnCount: 0,
};

// Board initial state — shown until both players join
export const defaultGameText = "Click X or O to begin!";

// Unique name of the key asset (the reset-button asset that opens the drawer
// and holds all game state). All controllers resolve through this to guarantee
// state is read/written on ONE asset per scene drop, regardless of which
// asset a webhook click came from.
export const KEY_ASSET_UNIQUE_NAME = "TicTacToe_reset";

// Badge names — these must be pre-created in the Topia Ecosystem dashboard
export const BADGE_VICTORY = "Victory";
export const BADGE_CHAMPION = "Champion";
export const BADGE_HOBBYIST = "Hobbyist";

// Badge thresholds
export const BADGE_CHAMPION_WINS = 15;
export const BADGE_HOBBYIST_GAMES = 10;
