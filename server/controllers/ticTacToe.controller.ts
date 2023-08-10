import tttUtils from "../ttt.utils.js";
import { Request, Response } from "express";
import topiaAdapter from "../adapters/topia.adapter.js";
import { Game, Player, Position } from "../topia/topia.models.js";
import { initDroppedAsset, initWorld } from "../topia/topia.factories.js";
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

  resetBoard: async (req: Request, res: Response) => {
    const urlSlug: string = req.body.urlSlug;
    const boardId = tttUtils.extractBoardId(req.body);
    let activeGame = activeGames[urlSlug]?.find(g => g.boardId === boardId);
    if (!activeGame)
      return res.status(400).send({ message: "Game not found." });

    const finishLine = initDroppedAsset().create(activeGame.finishLineId, urlSlug, { credentials: req.visitor.credentials });
    const message = initDroppedAsset().create(activeGame.messageTextId, urlSlug, { credentials: req.visitor.credentials });
    const moves = activeGame.moves.map(m => initDroppedAsset().create(m, urlSlug, { credentials: req.visitor.credentials }));
    activeGame.moves = [];
    activeGame.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    await Promise.allSettled([finishLine.deleteDroppedAsset(), message.deleteDroppedAsset(), ...moves.map(m => m.deleteDroppedAsset())]);
    return res.status(200).send({ message: "Game reset" });
  },

  removeStartBtn: async (req: Request, res: Response) => {
    const { urlSlug, visitorId, assetId, interactiveNonce } = req.body;
    const boardId = tttUtils.extractBoardId(req.body);
    let activeGame = activeGames[urlSlug]?.find(g => g.boardId === boardId);
    if (!activeGame)
      return res.status(400).send({ message: "Game not found." });

    const world = initWorld().create(urlSlug, { credentials: req.visitor.credentials });
    // const startBtn = initDroppedAsset().create(activeGame.startBtnId, urlSlug, { credentials: req.visitor.credentials });
    // await startBtn.deleteDroppedAsset();
    return res.status(200).send({ message: "Start button removed." });
  },

  playerMovement: async (req: Request, res: Response) => {
    const player = Number(req.params.player);
    const action = req.params.action; // : "entered"  | "exited"
    const { urlSlug, visitorId, assetId, interactiveNonce } = req.body;
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
        await tttUtils.removeMessages(urlSlug, boardId, req.visitor.credentials);
      return res.status(200).send({ message: "Player moved." });
    }

    console.log(`player: ${player}\naction: ${action}\nurlSlug: ${urlSlug}\nvisitorId: ${visitorId}\nassetId: ${assetId}\nboardId: ${boardId}\nusername: ${username}`);

    // Calculating center position from the position of the p1 or p2 asset
    const p1box = await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials }) as DroppedAssetInterface;

    // Finding scale of the P1 or P2 box, use this scaling to correct positions of center and top
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
        activeGame.player1 = { visitorId, username, interactiveNonce };
      else if (player === 2 && !activeGame.player2)
        activeGame.player2 = { visitorId, username, interactiveNonce };

      if (activeGame.player1 && activeGame.player2) {
        await tttUtils.removeMessages(urlSlug, boardId, req.visitor.credentials);
        // activeGame.startBtnId = (await tttUtils.dropStartButton(urlSlug, activeGame, req.visitor.credentials))?.id;
      } else {
        // todo Find position from the values of scale and center
        activeGame.messageTextId = (await topiaAdapter.createText({
          position: { x: center.x, y: center.y - 200 * scale },
          credentials: req.visitor.credentials,
          text: "Find a second player!",
          textColor: "#333333",
          textSize: 20,
          urlSlug,
          textWidth: 50,
          uniqueName: boardId + "_message",
        }))?.id;
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

    const pVisitorId = visitorId ? Number(visitorId) : NaN;
    if (isNaN(pVisitorId))
      return res.status(400).send({ message: "visitorId must be a number." });

    const boardId = tttUtils.extractBoardId(req.body);
    if (!boardId)
      return res.status(400).send({ message: "boardId is missing." });

    console.log(`active games found in worlds: `, Object.keys(activeGames));
    console.log(`activeGames: `, activeGames);
    const game = activeGames[urlSlug]?.find(ag => ag.boardId === boardId);
    if (!game)
      return res.status(404).send({ message: "No active game found." });

    // Figure out the player who clicked on this cell
    let mover: Player | undefined = undefined;
    if (game.player1?.username === username && game.player1?.visitorId && game.inControl === 0)
      mover = game.player1;
    if (game.player2?.username === username && game.player2?.visitorId && game.inControl === 1)
      mover = game.player2;

    if (!mover)
      return res.status(400).send({ message: "It's not your turn." });

    if (game.status[cell] !== 0)
      return res.status(400).send({ message: "Cannot place your move here." });

    const scale = ((await initDroppedAsset().get(assetId, urlSlug, { credentials: req.visitor.credentials })) as DroppedAssetInterface).assetScale;

    game.status[cell] = pVisitorId;
    game.inControl = (game.inControl + 1) % 2 as 0 | 1;
    console.log("urlSlug: ", urlSlug, "\nassetId: ", assetId, "\npVisitorId: ", pVisitorId, "\ngame.status: ", game.status);

    // todo drop a ❌ or a ⭕
    const move = await tttUtils.makeMove({
      urlSlug, game, cell: assetId, credentials: req.visitor.credentials,
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
      position: { x: game.center.x, y: game.center.y - 200 * scale },
      credentials: req.visitor.credentials, text: "👑 " + mover?.username, textColor: "#ffffff", textSize: 24,
      urlSlug: req.body.urlSlug, textWidth: 14, uniqueName: boardId + "_win_msg",
    }))?.id;
    res.status(200).send({ message: "Move completed." });
  },
};

