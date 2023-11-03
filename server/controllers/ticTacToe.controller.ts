import tttUtils, { cellWidth } from "../ttt.utils.js";
import { Request, Response } from "express";
import topiaAdapter from "../adapters/topia.adapter.js";
import { Game, Player, Position } from "../topia/topia.models.js";
import { initDroppedAsset } from "../topia/topia.factories.js";
import { DroppedAsset, DroppedAssetInterface } from "@rtsdk/topia";
import storageAdapter from "../adapters/storage.adapter.js";

const TTL = 0.5; // In hour

const ticTacToeController = {

  /**
   * Responds with the stats of the players in the game at the given urlSlug.
   */
  scores: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = await storageAdapter.getGame(urlSlug, req.credentials);
    if (!activeGame)
      return res.status(404).send({ message: "Game not found." });

    res.status(200).send(storageAdapter.getScores(urlSlug, activeGame, req.credentials));
  },

  /**
   * Resets the board, and removes all messages.
   */
  resetBoard: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = await storageAdapter.getGame(urlSlug, req.credentials);
    if (!activeGame)
      return res.status(400).send({ message: "Game not found." });

    if (!req.visitor.isAdmin && req.visitor.id !== activeGame.player1?.visitorId && req.visitor.id !== activeGame.player2?.visitorId)
      return res.status(403).send({ message: "You are not authorized to reset this board." });

    await tttUtils.resetBoard(activeGame, urlSlug, req.credentials);
    return res.status(200).send({ message: "Game reset" });
  },

  /**
   * Handles click on cross or o button in the world. These buttons let the players choose their symbol.
   */
  playerSelection: async (req: Request, res: Response) => {
    const symbol = req.params.symbol as "cross" | "o";
    const player = symbol === "cross" ? 0 : 1;
    const { urlSlug, visitorId, assetId } = req.body;

    const username = req.body.eventText.split("\"")[1];

    let activeGame = await storageAdapter.getGame(urlSlug, req.credentials);

    if (activeGame && activeGame.lastUpdated > Date.now() - 1000 * 60 * 60 * TTL) {
      // let the player be re-assigned if the game has not been updated from quite some time.
      if (!player && activeGame.player1)
        return res.status(400).send({ message: "Player 1 already selected." });
      if (player && activeGame.player2)
        return res.status(400).send({ message: "Player 2 already selected." });
    }

    const symbolAsset = await initDroppedAsset().get(assetId, urlSlug, { credentials: req.credentials }) as DroppedAssetInterface;

    const scale: number = symbolAsset.assetScale;
    const center = new Position(symbolAsset.position);
    center.y += 1.5 * cellWidth * scale;

    // fixme calculate the center of the board from the position of the symbolAsset
    if (symbol == "cross")
      center.x += 4.5 * cellWidth * scale;
    else
      center.x -= 5.5 * cellWidth * scale;

    if (!activeGame) {
      activeGame = new Game({ newInstance: { center, urlSlug, credentials: req.credentials } });
      await storageAdapter.saveGame(activeGame, req.credentials);
    }

    if (activeGame.player1?.visitorId === visitorId || activeGame.player2?.visitorId === visitorId)
      return res.status(400).send({ message: "You are already playing this game." });

    activeGame[`player${player + 1}`] = { visitorId, username };
    await tttUtils.showNameAndScore(activeGame, player, symbolAsset, urlSlug, req.credentials);

    if (activeGame.player1 && activeGame.player2) {
      if (activeGame.messageTextId) {
        const messageAsset = initDroppedAsset().create(activeGame.messageTextId, urlSlug, { credentials: req.credentials });
        await messageAsset.updateCustomTextAsset(undefined, ``);
      }
    } else {
      if (activeGame.messageTextId) {
        const messageAsset = initDroppedAsset().create(activeGame.messageTextId, urlSlug, { credentials: req.credentials });
        await messageAsset.updateCustomTextAsset(undefined, `Waiting for another player...`);
      } else {
        activeGame.messageTextId = (await topiaAdapter.createText({
          position: { x: center.x, y: center.y - 3 * cellWidth * scale },
          credentials: req.credentials,
          text: "Find another player!",
          textColor: "#333333",
          textSize: 20,
          urlSlug,
          textWidth: 300,
          uniqueName: `message${activeGame.id}`,
        }))?.id;
      }
    }

    storageAdapter.saveGame(activeGame, req.credentials).then((r) => console.log("Game saved: ", r))
      .catch((e) => console.log("Error saving game: ", e));

    res.status(200).send({ message: "Player selected." });
  },

  /**
   * Handles the moves made by the players.
   */
  gameMoves: async (req: Request, res: Response) => {
    const { urlSlug, assetId, visitorId } = req.body;

    const username = req.body.eventText.split("\"")[1];
    const cell = req.params.cell ? Number(req.params.cell) : NaN;
    if (isNaN(cell))
      return res.status(400).send({ message: "cell is missing." });

    const pVisitorId = visitorId ? Number(visitorId) : NaN;
    if (isNaN(pVisitorId))
      return res.status(400).send({ message: "visitorId must be a number." });

    const game = await storageAdapter.getGame(urlSlug, req.credentials);
    if (!game)
      return res.status(404).send({ message: "No active games found." });

    // Figure out the player who clicked on this cell
    let mover: Player | undefined = undefined;
    let player: 0 | 1 = 0;
    if (!game.inControl && game.player1?.visitorId && game.player1?.username === username) {
      mover = game.player1;
      player = 0;
    }
    if (game.inControl && game.player2?.visitorId && game.player2?.username === username) {
      mover = game.player2;
      player = 1;
    }

    if (!mover)
      return res.status(400).send({ message: "It's not your turn." });

    if (game.finishLineId) {
      // The game is already won, resetting it.
      await tttUtils.resetBoard(game, urlSlug, req.credentials);
      return res.status(200).send({ message: "Game reset." });
    }

    if (game.getStatus(cell) !== 0)
      return res.status(400).send({ message: "Cannot place your move here." });

    const cellAsset = (await initDroppedAsset().get(assetId, urlSlug, { credentials: req.credentials })) as DroppedAsset & DroppedAssetInterface;

    // Changing image URL to a ❌ or a ⭕
    const firstMove = await game.makeMove(cell, cellAsset, req.credentials);
    console.log("firstMove: ", firstMove);

    const r = tttUtils.findWinningCombo(game);
    if (!r) {
      // updating the score if this is the first move made by this player, increase its played count
      if (firstMove)
        await tttUtils.updateScoreInGame(game, player, (await storageAdapter.updateScore(urlSlug, mover.visitorId, {
          played: 1,
          won: 0,
          lost: 0,
        }, req.credentials)), req.credentials);

      // updating the turn marker in the world
      await tttUtils.updateNameInGame(game, req.credentials);
      await storageAdapter.saveGame(game, req.credentials);
      return res.status(200).send("Move made.");
    }

    // Dropping a finishing line
    game.finishLineId = (await tttUtils.dropFinishLine(urlSlug, game, r.combo, req.credentials)).id;
    await storageAdapter.updateScore(urlSlug, mover.visitorId, {
      played: 0,
      won: 1,
      lost: 0,
    }, req.credentials);
    if (player)
      await storageAdapter.updateScore(urlSlug, game.player1.visitorId, {
        played: 0,
        won: 0,
        lost: 1,
      }, req.credentials);
    else
      await storageAdapter.updateScore(urlSlug, game.player2.visitorId, {
        played: 0,
        won: 0,
        lost: 1,
      }, req.credentials);

    // Dropping 👑 and player's name
    // todo Instead of dropping a new text asset, update the existing one
    if (game.messageTextId) {
      const messageAsset = initDroppedAsset().create(game.messageTextId, urlSlug, { credentials: req.credentials });
      await messageAsset.updateCustomTextAsset(undefined, `👑 ${mover?.username}`);
    } else {
      game.messageTextId = (await topiaAdapter.createText({
        // position: { x: game.center.x, y: game.center.y - 60 },
        position: {
          x: game.center.x - cellWidth * cellAsset.assetScale,
          y: game.center.y + 2 * cellWidth * cellAsset.assetScale,
        },
        credentials: req.credentials, text: `👑 ${mover?.username}`, textColor: "#ffffff", textSize: 24,
        urlSlug: req.body.urlSlug, textWidth: 300, uniqueName: `win_msg${game.id}`,
      }))?.id;
    }
    await storageAdapter.saveGame(game, req.credentials);
    res.status(200).send({ message: "Move made." });
  },
};

export default ticTacToeController;
