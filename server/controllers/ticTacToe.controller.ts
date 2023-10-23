import tttUtils, { cellWidth } from "../ttt.utils.js";
import { Request, Response } from "express";
import topiaAdapter from "../adapters/topia.adapter.js";
import { Game, Player, Position } from "../topia/topia.models.js";
import { initDroppedAsset } from "../topia/topia.factories.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import storageAdapter from "../adapters/storage.adapter";

const TTL = 0.5; // In hour

const ticTacToeController = {

  /**
   * Responds with the stats of the players in the game at the given urlSlug.
   */
  scores: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = await storageAdapter.getGame(urlSlug, req.visitor.credentials);
    if (!activeGame)
      return res.status(404).send({ message: "Game not found." });

    res.status(200).send(tttUtils.getScores(urlSlug, activeGame, req.visitor.credentials));
  },

  /**
   * Resets the board, and removes all messages.
   */
  resetBoard: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = await storageAdapter.getGame(urlSlug, req.visitor.credentials);
    if (!activeGame)
      return res.status(400).send({ message: "Game not found." });

    if (!req.visitor.isAdmin && req.visitor.id !== activeGame.player1?.visitorId && req.visitor.id !== activeGame.player2?.visitorId)
      return res.status(403).send({ message: "You are not authorized to reset this board." });

    await tttUtils.resetBoard(activeGame, urlSlug, req.visitor.credentials);
    return res.status(200).send({ message: "Game reset" });
  },

  /**
   * Handles click on cross or o button in the world. These buttons let the players choose their symbol.
   */
  playerSelection: async (req: Request, res: Response) => {
    const symbol = req.params.symbol as "cross" | "o";
    const player = symbol === "cross" ? 0 : 1;
    const { urlSlug, visitorId, assetId, interactiveNonce } = req.body;

    const username = req.body.eventText.split("\"")[1];

    let activeGame = await storageAdapter.getGame(urlSlug, req.visitor.credentials);

    if (activeGame && activeGame.lastUpdated.getTime() > Date.now() - 1000 * 60 * 60 * TTL) {
      // let the player be re-assigned if the game has not been updated from quite some time.
      if (!player && activeGame.player1)
        return res.status(400).send({ message: "Player 1 already selected." });
      if (player && activeGame.player2)
        return res.status(400).send({ message: "Player 2 already selected." });
    }

    const symbolAsset = await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials }) as DroppedAssetInterface;

    const scale: number = symbolAsset.assetScale;
    const center = new Position(symbolAsset.position);
    center.y += 2.5 * cellWidth * scale;

    // fixme calculate the center of the board from the position of the symbolAsset
    if (symbol == "cross")
      center.x += 6.5 * cellWidth * scale;
    else
      center.x -= 6.5 * cellWidth * scale;

    if (!activeGame) {
      activeGame = new Game(center, urlSlug, req.visitor.credentials);
      await storageAdapter.saveGame(activeGame, req.visitor.credentials);
      // todo if webhooks can be added on the fly, then add all the webimageassets on all the cells

    }

    activeGame[`player${player + 1}`] = { visitorId, username };
    await tttUtils.showNameAndScore(activeGame, player, symbolAsset, urlSlug, req.visitor.credentials);

    if (activeGame.player1 && activeGame.player2) {
      await tttUtils.removeMessages(urlSlug, activeGame.id, req.visitor.credentials);
      // activeGame.startBtnId = (await tttUtils.dropStartButton(urlSlug, activeGame, req.visitor.credentials))?.id;
    } else {
      activeGame.messageTextId = (await topiaAdapter.createText({
        position: { x: center.x - cellWidth, y: center.y - 2.5 * cellWidth * scale },
        credentials: req.visitor.credentials,
        text: "Find another player!",
        textColor: "#333333",
        textSize: 20,
        urlSlug,
        textWidth: 300,
        uniqueName: `message${activeGame.id}`,
      }))?.id;
    }

    storageAdapter.saveGame(activeGame, req.visitor.credentials).then((r) => console.log("Game saved: ", r))
      .catch((e) => console.log("Error saving game: ", e));

    res.status(200).send({ message: "Player selected." });
  },

  /**
   * Handles movement of player into player-boxes and out of them.
   */
  playerMovement: async (req: Request, res: Response) => {
    const player = Number(req.params.player);
    const action = req.params.action as "entered" | "exited";
    const { urlSlug, visitorId, assetId, interactiveNonce } = req.body;

    const username = req.body.eventText.split("\"")[1];

    let activeGame = await storageAdapter.getGame(urlSlug, req.visitor.credentials);

    if (activeGame && action === "exited") {
      if (player === 1)
        activeGame.player1 = undefined;
      else
        activeGame.player2 = undefined;

      if (!activeGame.player1 && !activeGame.player2)
        await tttUtils.removeMessages(urlSlug, activeGame.id, req.visitor.credentials);
      return res.status(200).send({ message: "Player moved." });
    }

    console.log(`player: ${player}\naction: ${action}\nurlSlug: ${urlSlug}\nvisitorId: ${visitorId}\nassetId: ${assetId}\nusername: ${username}`);

    // Calculating center position from the position of the p1 or p2 asset
    const p1box = await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials }) as DroppedAssetInterface;

    // Finding scale of the P1 or P2 box, use this scaling to correct positions of center and top
    const scale: number = p1box.assetScale;
    const center = new Position(p1box.position);

    console.log(`scale: ${scale}\nplayerBox position: `, center);

    if (player === 1)
      center.y += cellWidth * scale;
    else
      center.y -= cellWidth * scale;
    center.x += Math.floor(cellWidth * scale * 2.5);

    console.log(`center: `, center);

    if (action === "entered") {
      if (!activeGame) {
        // Get position of assetID -NPNcpKdPhRyhnL0VWf_ for center, and the first player box is
        activeGame = new Game(center, urlSlug, req.visitor.credentials);
        await storageAdapter.saveGame(activeGame, req.visitor.credentials);
      }

      if (player === 1 && !activeGame.player1)
        activeGame.player1 = { visitorId, username };
      else if (player === 2 && !activeGame.player2)
        activeGame.player2 = { visitorId, username };

      if (activeGame.player1 && activeGame.player2) {
        await tttUtils.removeMessages(urlSlug, activeGame.id, req.visitor.credentials);
        // activeGame.startBtnId = (await tttUtils.dropStartButton(urlSlug, activeGame, req.visitor.credentials))?.id;
      } else {
        // todo Find position from the values of scale and center
        activeGame.messageTextId = (await topiaAdapter.createText({
          position: { x: center.x - cellWidth, y: center.y + 2.5 * cellWidth * scale },
          credentials: req.visitor.credentials,
          text: "Find a second player!",
          textColor: "#333333",
          textSize: 20,
          urlSlug,
          textWidth: 300,
          uniqueName: `message${activeGame.id}`,
        }))?.id;
      }
    }

    res.status(200).send({ message: "Player moved." });
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

    const game = await storageAdapter.getGame(urlSlug, req.visitor.credentials);
    if (!game)
      return res.status(404).send({ message: "No active games found." });

    // Figure out the player who clicked on this cell
    let mover: Player | undefined = undefined;
    if (game.player1?.username === username && game.player1?.visitorId && !game.inControl)
      mover = game.player1;
    if (game.player2?.username === username && game.player2?.visitorId && game.inControl)
      mover = game.player2;

    if (!mover)
      return res.status(400).send({ message: "It's not your turn." });

    if (game.finishLineId) {
      // The game is already won, resetting it.
      await tttUtils.resetBoard(game, urlSlug, req.visitor.credentials);
      return res.status(200).send({ message: "Game reset." });
    }

    if (game.getStatus(cell) !== 0)
      return res.status(400).send({ message: "Cannot place your move here." });

    const cellAsset = (await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials })) as DroppedAssetInterface;

    // Changing image URL to a ❌ or a ⭕
    await game.makeMove(cell, cellAsset, req.visitor.credentials);
    // console.log("game.moves: ", game.moves);

    const r = tttUtils.findWinningCombo(game);
    if (!r)
      return res.status(200).send("Move made.");

    // Dropping a finishing line
    game.finishLineId = (await tttUtils.dropFinishLine(urlSlug, game, r.combo, req.visitor.credentials)).id;

    // Dropping 👑 and player's name
    game.messageTextId = (await topiaAdapter.createText({
      // position: { x: game.center.x, y: game.center.y - 60 },
      position: { x: game.center.x - cellWidth, y: game.center.y + 2.5 * cellWidth * cellAsset.assetScale },
      credentials: req.visitor.credentials, text: `👑 ${mover?.username}`, textColor: "#ffffff", textSize: 24,
      urlSlug: req.body.urlSlug, textWidth: 300, uniqueName: `win_msg${game.id}`,
    }))?.id;
    res.status(200).send({ message: "Move made." });
  }
};

export default ticTacToeController;
