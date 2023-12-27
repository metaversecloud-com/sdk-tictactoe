import { Request, Response } from "express";
import {
  createTextAsset,
  createWebImageAsset,
  errorHandler,
  getActiveGames,
  getCredentials,
  getFinishLineOptions,
  getWinningCombo,
  updateActiveGame,
} from "../utils/index.js";
import { DroppedAsset } from "../utils/topiaInit.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import { cellWidth } from "../constants.js";

export const handleClaimCell = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, interactivePublicKey, urlSlug, visitorId } = credentials;
    const cell = parseInt(req.params.cell);
    if (isNaN(cell)) throw "Cell is missing.";

    let activeGame = getActiveGames(urlSlug);
    if (!activeGame) throw "No active games found. Please select X or O to begin!";
    if (!activeGame.player1 || activeGame.player2) throw "Two players are needed to get started.";

    let mover;
    // Figure out the player who clicked on this cell
    if (activeGame.player1?.visitorId === visitorId) {
      mover = activeGame.player1;
      if (activeGame.inControl && activeGame.inControl !== 0) throw "It's not your turn.";
      activeGame.inControl = 1;
    }
    if (activeGame.player2?.visitorId === visitorId) {
      mover = activeGame.player2;
      if (activeGame.inControl && activeGame.inControl !== 1) throw "It's not your turn.";
      activeGame.inControl = 0;
    }

    if (!activeGame.status) activeGame.status = {};
    if (activeGame.status[cell]) throw "Cannot place your move here.";
    activeGame.status[cell] = visitorId;

    const cellAsset: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const webImageAsset = await createWebImageAsset(req.credentials);
    const droppedAsset = await DroppedAsset.drop(webImageAsset, {
      isInteractive: true,
      interactivePublicKey,
      layer0: "",
      layer1: `${process.env.BUCKET}/${visitorId === activeGame.player1?.visitorId ? "pink_x" : "blue_o"}.png`,
      // @ts-ignore
      position: cellAsset.position,
      uniqueName: `TicTacToe_move_${urlSlug}`,
      urlSlug,
    });

    if (!activeGame.moves) activeGame.moves = {};
    activeGame.moves[cell] = droppedAsset.id;
    console.log("activeGame.moves: ", activeGame.moves);

    updateActiveGame(activeGame, urlSlug);

    const winningCombo = await getWinningCombo(activeGame.status);
    if (!winningCombo) return res.status(200).send("Move made.");

    // Dropping a finishing line
    const finishLineOptions = getFinishLineOptions(urlSlug, activeGame, winningCombo, req.credentials);
    const finishLine = await DroppedAsset.drop(webImageAsset, {
      ...finishLineOptions,
      isInteractive: true,
      interactivePublicKey,
    });
    activeGame.finishLineId = finishLine.id;

    // Dropping 👑 and player's name
    let messageTextId;
    const text = `👑 ${mover?.username}`;
    const style = {
      textColor: "#333333",
      textSize: 20,
      textWidth: 300,
    };
    try {
      const textAsset = await DroppedAsset.getWithUniqueName(
        "TicTacToeText",
        urlSlug,
        interactivePublicKey,
        process.env.INTERACTIVE_SECRET,
      );
      await textAsset.updateCustomTextAsset(style, text);
      messageTextId = textAsset.id;
    } catch (error) {
      const boardAsset = await DroppedAsset.getWithUniqueName(
        "TicTacToeBoard",
        urlSlug,
        interactivePublicKey,
        process.env.INTERACTIVE_SECRET,
      );
      if (!boardAsset) throw "TicTacToe board not found";

      const textAsset = await createTextAsset(req.credentials);
      const messageText = await DroppedAsset.drop(textAsset, {
        isInteractive: true,
        interactivePublicKey,
        // @ts-ignore
        position: { x: boardAsset.position.x, y: boardAsset.position.y - cellWidth * 2.5 },
        text,
        uniqueName: "TicTacToeText",
        urlSlug,
        ...style,
      });
      messageTextId = messageText.id;
    }
    activeGame.messageTextId = messageTextId;

    updateActiveGame(activeGame, urlSlug);

    res.status(200).send({ message: "Move successfully made." });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleClaimCell",
      message: "Error making a move.",
      req,
      res,
    });
  }
};
