import tttUtils from "../ttt.utils.js";
import { Request, Response } from "express";
import topiaAdapter from "../adapters/topia.adapter.js";
import { Game, Player, Position } from "../topia/topia.models.js";
import { initDroppedAsset } from "../topia/topia.factories.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

const activeGames: { [urlSlug: string]: Game[] } = {};

export default {
  leaderboard: async (req: Request, res: Response) => {
    // let { urlSlug, pageSize, page } = req.body;
    // pageSize = pageSize ? Number(pageSize) : 3;
    // if (isNaN(pageSize))
    //   pageSize = 3;
    // page = page ? Number(page) : 0;
    // if (isNaN(page))
    //   page = 0;

    // todo list all visitors, and then get their data-object. No pagination.

    // const r = await TttPlayer.findAndCountAll({
    //   where: { urlSlug },
    //   order: ["won", "DESC"],
    //   limit: pageSize,
    //   offset: page * pageSize,
    // });

    res.status(200).send([]);
  },

  playerMovement: async (req: Request, res: Response) => {
    const player = Number(req.params.player);
    const action = req.params.action; // : "entered"  | "exited"
    const { urlSlug, visitorId, assetId } = req.body;
    const boardId = tttUtils.extractBoardId(req.body);
    if (!boardId)
      return res.status(400).send({ message: "boardId must be supplied in dataObject." });

    const username = req.body.eventText.split("\"")[1];

    let activeGame = activeGames[urlSlug]?.find(g => g.boardId === boardId);

    if (activeGame && action === "exited") {
      if (player === 1)
        activeGame.player1 = undefined;
      else
        activeGame.player2 = undefined;

      if (!activeGame.player1 && !activeGame.player2)
        await tttUtils.removeMessages(urlSlug, boardId, req.body);
      return res.status(200).send({ message: "Player moved." });
    }

    console.log(`player: ${player}\naction: ${action}\nurlSlug: ${urlSlug}\nvisitorId: ${visitorId}\nassetId: ${assetId}\nboardId: ${boardId}\nusername: ${username}`);

    // todo calculate center position from the position of the p1 or p2 asset
    const p1box = await initDroppedAsset().get(assetId, urlSlug, { credentials: req.body }) as DroppedAssetInterface;

    // todo find scale of the P1 or P2 box, use this scaling to correct positions of center and top
    const scale: number = p1box.assetScale;
    const center = new Position(p1box.position);

    console.log(`scale: ${scale}\ncenter: `, center);
    const cellWidth = 90;

    if (player === 1)
      center.x += cellWidth * scale;
    else
      center.x -= cellWidth * scale;
    center.y -= 2 * cellWidth * scale;

    console.log(`center: `, center);

    if (action === "entered") {
      if (!activeGame) {
        // Get position of assetID -NPNcpKdPhRyhnL0VWf_ for center, and the first player box is
        activeGame = new Game(boardId, center);
        if (activeGames[urlSlug]?.length)
          activeGames[urlSlug].push(activeGame);
        else
          activeGames[urlSlug] = [activeGame];
      }

      if (player === 1 && !activeGame.player1)
        activeGame.player1 = { visitorId, username };
      else if (player === 2 && !activeGame.player2)
        activeGame.player2 = { visitorId, username };

      if (activeGame.player1 && activeGame.player2) {
        await tttUtils.removeMessages(urlSlug, boardId, req.body);
        activeGame.startBtnId = (await tttUtils.dropStartButton(urlSlug, activeGame, req.body)).id;
      } else {
        // todo Find position from the values of scale and center
        activeGame.messageTextId = (await topiaAdapter.createText({
          position: { x: center.x, y: center.y - 200 * scale },
          requestBody: req.body,
          text: "Find a second player!",
          textColor: "#333333",
          textSize: 20,
          urlSlug: req.body.urlSlug,
          textWidth: 50,
          uniqueName: boardId + "_message",
        })).id;
      }
    }

    res.status(200).send({ message: "Player moved." });
  },

  gameMoves: async (req: Request, res: Response) => {
    const { urlSlug, assetId, visitorId } = req.body;
    const username = req.body.eventText.split("\"")[1];
    const cell = req.params.cell ? Number(req.params.cell) : NaN;
    if (isNaN(cell))
      return res.status(400).send({ message: "cell is missing." });

    console.log(1);
    const pVisitorId = visitorId ? Number(visitorId) : NaN;
    if (isNaN(pVisitorId))
      return res.status(400).send({ message: "visitorId must be a number." });

    console.log(2);
    const boardId = tttUtils.extractBoardId(req.body);
    if (!boardId)
      return res.status(400).send({ message: "boardId is missing." });

    console.log(3);
    // if (!activeGames.hasOwnProperty(urlSlug))
    //     return res.status(400).send({message: 'No active game found.'})
    //
    // console.log(4)
    console.log(`active games found in worlds: `, Object.keys(activeGames));
    console.log(`activeGames: `, activeGames);
    const game = activeGames[urlSlug]?.find(ag => ag.boardId === boardId);
    if (!game)
      return res.status(404).send({ message: "No active game found." });
    console.log(5);

    // Figure out the player who clicked on this cell
    let mover: Player | undefined = undefined;
    if (game.player1?.username === username && game.player1?.visitorId)
      mover = game.player1;
    if (game.player2?.username === username && game.player2?.visitorId)
      mover = game.player2;
    game.status[cell] = pVisitorId;
    console.log("urlSlug: ", urlSlug, "\nassetId: ", assetId, "\npVisitorId: ", pVisitorId, "\ngame.status: ", game.status);

    // todo drop a ❌ or a ⭕
    const move = await tttUtils.makeMove({
      urlSlug, game, cell: assetId, requestBody: req.body,
      cross: pVisitorId === game.player1!!.visitorId,
    });
    game.moves[cell] = move.id;
    console.log("game.moves: ", game.moves);

    const r = tttUtils.findWinningCombo(game.status);
    if (!r)
      return res.status(200).send("Move made.");
    console.log(8);

    // todo drop a finishing line
    game.finishLineId = (await tttUtils.dropFinishLine(urlSlug, game, r.combo, req.body)).id;
    console.log(9);

    // todo drop 👑 and player's name
    game.messageTextId = (await topiaAdapter.createText({
      position: { x: game.center.x, y: game.center.y - 60 },
      requestBody: req.body, text: "👑 " + mover?.username, textColor: "#ffffff", textSize: 24,
      urlSlug: req.body.urlSlug, textWidth: 14, uniqueName: boardId + "_win_msg",
    })).id;
    res.status(200).send({ message: "Move completed." });
  },

  newGame: async (req: Request, res: Response) => {
    // todo Handles click on the start button
    const urlSlug: string = req.body.urlSlug;
    const boardId = tttUtils.extractBoardId(req.body);
    if (!boardId)
      return res.status(400).send({ message: "dataObject must contain boardId." });
    const game = activeGames[req.body.urlSlug]?.find(g => g.boardId === boardId);
    if (!game)
      return res.status(404).send({ message: "Could not find this game." });

    if (game.player1 && game.player2) {
      if (game.startBtnId) {
        await topiaAdapter.removeDroppedAsset(urlSlug, game.startBtnId, req.body);
        game.startBtnId = undefined;
      }

      if (game.finishLineId) {
        await topiaAdapter.removeDroppedAsset(urlSlug, game.finishLineId, req.body);
        game.finishLineId = undefined;
      }

      if (game.messageTextId) {
        await topiaAdapter.removeDroppedAsset(urlSlug, game.messageTextId, req.body);
        game.messageTextId = undefined;
      }

      for (let m of game.moves) {
        if (!m)
          continue;
        await topiaAdapter.removeDroppedAsset(urlSlug, m, req.body);
      }
      game.moves = [];

      return res.status(200).send({ message: "Game started." });
    }

    res.status(409).send({ message: "Both players must be present to start the game." });
  },
};

