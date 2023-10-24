import { Game } from "./topia/topia.models.js";
import topiaAdapter from "./adapters/topia.adapter.js";
import { initDroppedAsset } from "./topia/topia.factories.js";
import { DroppedAsset, DroppedAssetInterface, InteractiveCredentials } from "@rtsdk/topia";
import { TttStats } from "./models.js";
import storageAdapter from "./adapters/storage.adapter.js";

export const cellWidth = 80;

export const WinningCombo = {
  H_TOP: [0, 1, 2],
  H_MID: [3, 4, 5],
  H_BOT: [6, 7, 8],
  V_LEFT: [0, 3, 6],
  V_MID: [1, 4, 7],
  V_RIGHT: [2, 5, 8],
  L_CROSS: [2, 4, 6],
  R_CROSS: [0, 4, 8],
  identify: (game: Game): null | readonly [number, number, number] => {
    if (game.getStatus(0) && game.getStatus(1) && game.getStatus(2) && game.getStatus(0) === game.getStatus(1) && game.getStatus(1) === game.getStatus(2))
      return WinningCombo.H_TOP;

    if (game.getStatus(3) && game.getStatus(4) && game.getStatus(5) && game.getStatus(3) === game.getStatus(4) && game.getStatus(4) === game.getStatus(5))
      return WinningCombo.H_MID;

    if (game.getStatus(6) && game.getStatus(7) && game.getStatus(8) && game.getStatus(6) === game.getStatus(7) && game.getStatus(7) === game.getStatus(8))
      return WinningCombo.H_BOT;

    if (game.getStatus(0) && game.getStatus(3) && game.getStatus(6) && game.getStatus(0) === game.getStatus(3) && game.getStatus(3) === game.getStatus(6))
      return WinningCombo.V_LEFT;

    if (game.getStatus(1) && game.getStatus(4) && game.getStatus(7) && game.getStatus(1) === game.getStatus(4) && game.getStatus(4) === game.getStatus(7))
      return WinningCombo.V_MID;

    if (game.getStatus(2) && game.getStatus(5) && game.getStatus(8) && game.getStatus(2) === game.getStatus(5) && game.getStatus(5) === game.getStatus(8))
      return WinningCombo.V_RIGHT;

    if (game.getStatus(0) && game.getStatus(4) && game.getStatus(8) && game.getStatus(0) === game.getStatus(4) && game.getStatus(4) === game.getStatus(8))
      return WinningCombo.R_CROSS;

    if (game.getStatus(2) && game.getStatus(4) && game.getStatus(6) && game.getStatus(2) === game.getStatus(4) && game.getStatus(4) === game.getStatus(6))
      return WinningCombo.L_CROSS;

    return null;
  },
} as const;

export default {
  updateLeaderboard: () => {
  },
  updateMessage: () => {
  },

  findWinningCombo: (game: Game): null | {
    player: number,
    combo: readonly [number, number, number]
  } => {
    const combo = WinningCombo.identify(game);
    if (!combo)
      return null;
    return { player: game.getStatus(combo[0]), combo };
  },

  /**
   * Drops a finish line in the world
   */
  dropFinishLine: async (urlSlug: string, game: Game, combo: readonly [number, number, number], credentials: InteractiveCredentials) => {
    const color = game.player1.visitorId === credentials.visitorId ? "pink" : "blue";
    const options = {
      urlSlug,
      imageUrl: `${process.env.API_URL}/${color}_horizontal.png`,
      position: { x: game.center.x, y: game.center.y - cellWidth },
      uniqueName: `finish_line${game.id}`, credentials,
    };

    switch (combo) {
      case WinningCombo.H_MID:
        options.position = game.center;
        break;

      case WinningCombo.H_BOT:
        options.position = { x: game.center.x, y: game.center.y + cellWidth };
        break;

      case WinningCombo.V_LEFT:
        options.position = { x: game.center.x - cellWidth, y: game.center.y };
        options.imageUrl = `${process.env.API_URL}/${color}_vertical.png`;
        break;

      case WinningCombo.V_MID:
        options.position = game.center;
        options.imageUrl = `${process.env.API_URL}/${color}_vertical.png`;
        break;

      case WinningCombo.V_RIGHT:
        options.position = { x: game.center.x + cellWidth, y: game.center.y };
        options.imageUrl = `${process.env.API_URL}/${color}_vertical.png`;
        break;

      case WinningCombo.L_CROSS:
        // options.position = { x: game.center.x - cellWidth, y: game.center.y + cellWidth };
        options.position = game.center;
        options.imageUrl = `${process.env.API_URL}/${color}_oblique_1.png`;
        break;

      case WinningCombo.R_CROSS:
        // options.position = { x: game.center.x - cellWidth, y: game.center.y - cellWidth };
        options.position = game.center;
        options.imageUrl = `${process.env.API_URL}/${color}_oblique.png`;
        break;
    }

    return topiaAdapter.createWebImage(options);
  },

  resetBoard: async (activeGame: Game, urlSlug: string, credentials: InteractiveCredentials) => {
    const finishLine: DroppedAsset | undefined = activeGame.finishLineId ? initDroppedAsset().create(activeGame.finishLineId, urlSlug, { credentials }) : undefined;
    const message = activeGame.messageTextId ? initDroppedAsset().create(activeGame.messageTextId, urlSlug, { credentials }) : undefined;
    const player1Text = activeGame.player1TextId ? initDroppedAsset().create(activeGame.player1TextId, urlSlug, { credentials }) : undefined;
    const player2Text = activeGame.player2TextId ? initDroppedAsset().create(activeGame.player2TextId, urlSlug, { credentials }) : undefined;
    const player1Score = activeGame.player1ScoreId ? initDroppedAsset().create(activeGame.player1ScoreId, urlSlug, { credentials }) : undefined;
    const player2Score = activeGame.player2ScoreId ? initDroppedAsset().create(activeGame.player2ScoreId, urlSlug, { credentials }) : undefined;

    const moves: DroppedAsset[] = [];
    for (let i = 0; i < 9; i++) {
      const move = activeGame.getMove(i);
      if (move) {
        const droppedAsset = initDroppedAsset().create(move, urlSlug, { credentials });
        moves.push(droppedAsset);
      }
    }

    await Promise.allSettled([finishLine?.deleteDroppedAsset(), message?.deleteDroppedAsset(),
      player1Text?.deleteDroppedAsset(), player1Score?.deleteDroppedAsset(), player2Score?.deleteDroppedAsset(),
      player2Text?.deleteDroppedAsset(), ...moves.map(m => m.deleteDroppedAsset())]);
    return activeGame.reset(credentials);
  },

  updateNameInGame: async (game: Game, credentials: InteractiveCredentials) => {
    if (game.player1TextId) {
      const txtAsset = initDroppedAsset().create(game.player1TextId, game.urlSlug, { credentials });
      await txtAsset.updateCustomTextAsset(undefined, game.inControl ? game.player1.username : `> ${game.player1.username}`);
    }

    if (game.player2TextId) {
      const txtAsset = initDroppedAsset().create(game.player2TextId, game.urlSlug, { credentials });
      await txtAsset.updateCustomTextAsset(undefined, game.inControl ? `> ${game.player2.username}` : game.player1.username);
    }
  },

  updateScoreInGame: async (game: Game, player1: boolean, score: TttStats, credentials: InteractiveCredentials) => {
    if (player1 && game.player1ScoreId) {
      const txtAsset = initDroppedAsset().create(game.player1ScoreId, game.urlSlug, { credentials });
      await txtAsset.updateCustomTextAsset(undefined, `${score.played}-${score.won}-${score.lost}`);
    } else if (game.player2ScoreId) {
      const txtAsset = initDroppedAsset().create(game.player2ScoreId, game.urlSlug, { credentials });
      await txtAsset.updateCustomTextAsset(undefined, `${score.played}-${score.won}-${score.lost}`);
    }
  },

  showNameAndScore: async (game: Game, player: 0 | 1, symbolAsset: DroppedAssetInterface, urlSlug: string, credentials: InteractiveCredentials) => {
    let text = game[`player${player + 1}`].username;
    if (game.inControl == player)
      text = `> ${text}`;

    const score: TttStats = (await storageAdapter.getScores(urlSlug, game, credentials))[game[`player${player + 1}`].visitorId];
    const scoreText = `${score.played}-${score.won}-${score.lost}`;

    const [nameAsset, scoreAsset] = await Promise.all([topiaAdapter.createText({
      position: { x: symbolAsset.position.x, y: symbolAsset.position.y + cellWidth * symbolAsset.assetScale },
      credentials,
      textColor: "#333333",
      textSize: 20,
      textWidth: 150,
      uniqueName: `player${player + 1}Text${game.id}`,
      urlSlug, text,
    }), topiaAdapter.createText({
      position: { x: symbolAsset.position.x, y: symbolAsset.position.y + cellWidth * 2 * symbolAsset.assetScale },
      credentials,
      textColor: "#333333",
      textSize: 20,
      textWidth: 150,
      uniqueName: `player${player + 1}Text${game.id}`,
      urlSlug, text: scoreText,
    })]);

    game[`player${player + 1}TextId`] = nameAsset?.id;
    game[`player${player + 1}ScoreId`] = scoreAsset?.id;
  },
};
