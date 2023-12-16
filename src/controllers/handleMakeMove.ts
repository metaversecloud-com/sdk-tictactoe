import { Request, Response } from "express";
import {
  createTextAsset,
  createWebImageAsset,
  errorHandler,
  getFinishLineOptions,
  getWinningCombo,
  resetBoard,
} from "../utils/index.js";
import { DroppedAsset } from "../topia/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import { Game, Player, Position } from "../topia/topia.models.js";
import { activeGames, cellWidth } from "../constants.js";

export const handleMakeMove = async (req: Request, res: Response) => {
  try {
    const { urlSlug, assetId, eventText, visitorId } = req.body;
    const username = eventText.split('"')[1];
    const cell = req.params.cell ? Number(req.params.cell) : NaN;
    if (isNaN(cell)) throw "Cell is missing.";

    const game: Game = activeGames[urlSlug];
    if (!game) throw "No active games found.";

    // Figure out the player who clicked on this cell
    let mover: Player;
    if (game.player1?.username === username && game.player1?.visitorId && game.inControl === 0) mover = game.player1;
    if (game.player2?.username === username && game.player2?.visitorId && game.inControl === 1) mover = game.player2;

    if (!mover) throw "It's not your turn.";

    if (game.finishLineId) {
      // The game is already won, resetting it.
      await resetBoard(game, req.credentials, urlSlug);
      return res.status(200).send({ message: "Game reset." });
    }

    if (game.status[cell] !== 0) throw "Cannot place your move here.";

    const cellAsset = (await DroppedAsset.get(assetId, urlSlug, {
      credentials: req.credentials,
    })) as DroppedAssetInterface;

    game.status[cell] = visitorId;
    game.inControl = ((game.inControl + 1) % 2) as 0 | 1;
    console.log(
      "urlSlug: ",
      urlSlug,
      "\nassetId: ",
      assetId,
      "\npVisitorId: ",
      visitorId,
      "\ngame.status: ",
      game.status,
    );

    // todo drop a ❌ or a ⭕
    const webImageAsset = await createWebImageAsset(req.credentials);
    const droppedAsset = await DroppedAsset.drop(webImageAsset, {
      // @ts-ignore
      layer0: "",
      layer1: `${process.env.BUCKET}/${visitorId === game.player1?.visitorId ? "pink_cross" : "blue_o"}.png`,
      position: new Position(cellAsset.position),
      uniqueName: `${Date.now()}_move${game.id}`,
      urlSlug,
    });

    game.moves[cell] = droppedAsset.id;
    console.log("game.moves: ", game.moves);

    const winningCombo = await getWinningCombo(game.status);
    if (!winningCombo) return res.status(200).send("Move made.");

    // Dropping a finishing line
    const finishLineOptions = getFinishLineOptions(urlSlug, game, winningCombo, req.credentials);
    const finishLine = await DroppedAsset.drop(webImageAsset, { ...finishLineOptions });
    game.finishLineId = finishLine.id;

    // Dropping 👑 and player's name
    const textAsset = await createTextAsset(req.credentials);
    const winnerText = await DroppedAsset.drop(textAsset, {
      position: { x: game.center.x - cellWidth, y: game.center.y + 2.5 * cellWidth * cellAsset.assetScale },
      // @ts-ignore
      text: `👑 ${mover?.username}`,
      textColor: "#ffffff",
      textSize: 24,
      textWidth: 300,
      uniqueName: `win_msg${game.id}`,
      urlSlug,
    });
    game.messageTextId = winnerText.id;

    res.status(200).send({ message: "Move successfully made." });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleMakeMove",
      message: "Error making a move.",
      req,
      res,
    });
  }
};
