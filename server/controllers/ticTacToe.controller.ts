import tttUtils from "../ttt.utils.js";
import { Request, Response } from "express";
import topiaAdapter from "../adapters/topia.adapter.js";
import { Game, Player, Position } from "../topia/topia.models.js";
import { initDroppedAsset } from "../topia/topia.factories.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

const activeGames: { [urlSlug: string]: Game } = {};
const cellWidth = 80;

const ticTacToeController = {

  /**
   * Responds with the stats of the players in the game at the given urlSlug.
   */
  scores: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = activeGames[urlSlug];
    if (!activeGame)
      return res.status(404).send({ message: "Game not found." });

    res.status(200).send(tttUtils.getScores(urlSlug, activeGame, req.visitor.credentials));
  },

  /**
   * Resets the board, and removes all messages.
   */
  resetBoard: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = activeGames[urlSlug];
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
    const player1 = symbol === "cross";
    const { urlSlug, visitorId, assetId, interactiveNonce } = req.body;

    const username = req.body.eventText.split("\"")[1];

    let activeGame = activeGames[urlSlug];

    if (activeGame) {
      if (player1 && activeGame.player1)
        return res.status(400).send({ message: "Player 1 already selected." });
      if (!player1 && activeGame.player2)
        return res.status(400).send({ message: "Player 2 already selected." });
    }

    const symbolAsset = await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials }) as DroppedAssetInterface;

    const scale: number = symbolAsset.assetScale;
    const center = new Position(symbolAsset.position);

    // todo calculate the center of the board from the position of the symbolAsset
    if (!activeGame) {
      activeGame = new Game(center);
      activeGames[urlSlug] = activeGame;

      // todo if webhooks can be added on the fly, then add all the webimageassets on all the cells, and turn-marker
    }

    if (player1)
      activeGame.player1 = { visitorId, username };
    else
      activeGame.player2 = { visitorId, username };

    // todo show the name of the player on board against the symbolAsset
    // todo show the score of the player on the board against his name

    if (activeGame.player1 && activeGame.player2) {
      await tttUtils.removeMessages(urlSlug, activeGame.id, req.visitor.credentials);
      // activeGame.startBtnId = (await tttUtils.dropStartButton(urlSlug, activeGame, req.visitor.credentials))?.id;
    } else {
      activeGame.messageTextId = (await topiaAdapter.createText({
        position: { x: center.x - cellWidth, y: center.y + 2.5 * cellWidth * scale },
        credentials: req.visitor.credentials,
        text: "Find another player!",
        textColor: "#333333",
        textSize: 20,
        urlSlug,
        textWidth: 300,
        uniqueName: `message${activeGame.id}`,
      }))?.id;
    }

    // todo show scores of the players

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

    let activeGame = activeGames[urlSlug];

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
        activeGame = new Game(center);
        activeGames[urlSlug] = activeGame;
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

    const game: Game | undefined = activeGames[urlSlug];
    if (!game)
      return res.status(404).send({ message: "No active games found." });

    // Figure out the player who clicked on this cell
    let mover: Player | undefined = undefined;
    if (game.player1?.username === username && game.player1?.visitorId && game.inControl === 0)
      mover = game.player1;
    if (game.player2?.username === username && game.player2?.visitorId && game.inControl === 1)
      mover = game.player2;

    if (!mover)
      return res.status(400).send({ message: "It's not your turn." });

    if (game.finishLineId) {
      // The game is already won, resetting it.
      await tttUtils.resetBoard(game, urlSlug, req.visitor.credentials);
      return res.status(200).send({ message: "Game reset." });
    }

    if (game.status[cell] !== 0)
      return res.status(400).send({ message: "Cannot place your move here." });

    const cellAsset = (await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials })) as DroppedAssetInterface;

    game.status[cell] = pVisitorId;
    game.inControl = (game.inControl + 1) % 2 as 0 | 1;
    console.log("urlSlug: ", urlSlug, "\nassetId: ", assetId, "\npVisitorId: ", pVisitorId, "\ngame.status: ", game.status);

    // todo drop a ❌ or a ⭕
    const move = await tttUtils.makeMove({
      urlSlug, gameId: game.id, position: new Position(cellAsset.position), credentials: req.visitor.credentials,
      cross: pVisitorId === game.player1!!.visitorId,
    });
    game.moves[cell] = move.id;
    console.log("game.moves: ", game.moves);

    const r = tttUtils.findWinningCombo(game.status);
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
  },
};

export default ticTacToeController;
