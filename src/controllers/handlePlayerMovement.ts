import { Request, Response } from "express";
import { Game, Position } from "../topia/topia.models.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import { errorHandler } from "../utils/errorHandler.js";
import { DroppedAsset } from "../topia/topia.factories.js";
import { removeMessages } from "../utils/removeMessages.js";
import { createTextAsset } from "../utils/createAssets.js";
import { activeGames, cellWidth } from "../constants.js";

export const handlePlayerMovement = async (req: Request, res: Response) => {
  try {
    const player = Number(req.params.player);
    const action = req.params.action as "entered" | "exited";
    const { urlSlug, visitorId, assetId, interactiveNonce } = req.body;

    const username = req.body.eventText.split('"')[1];

    let activeGame = activeGames[urlSlug];

    if (activeGame && action === "exited") {
      if (player === 1) activeGame.player1 = undefined;
      else activeGame.player2 = undefined;

      if (!activeGame.player1 && !activeGame.player2) await removeMessages(req.credentials, activeGame.id, urlSlug);
      return res.status(200).send({ message: "Player moved." });
    }

    console.log(
      `player: ${player}\naction: ${action}\nurlSlug: ${urlSlug}\nvisitorId: ${visitorId}\nassetId: ${assetId}\nusername: ${username}`,
    );

    // Calculating center position from the position of the p1 or p2 asset
    const p1box: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, {
      credentials: req.credentials,
    });

    // Finding scale of the P1 or P2 box, use this scaling to correct positions of center and top
    const scale: number = p1box.assetScale;
    const center = new Position(p1box.position);

    console.log(`scale: ${scale}\nplayerBox position: `, center);

    if (player === 1) center.y += cellWidth * scale;
    else center.y -= cellWidth * scale;
    center.x += Math.floor(cellWidth * scale * 2.5);

    console.log(`center: `, center);

    if (action === "entered") {
      if (!activeGame) {
        // Get position of assetID -NPNcpKdPhRyhnL0VWf_ for center, and the first player box is
        activeGame = new Game(center);
        activeGames[urlSlug] = activeGame;
      }

      if (player === 1 && !activeGame.player1) activeGame.player1 = { visitorId, username, interactiveNonce };
      else if (player === 2 && !activeGame.player2) activeGame.player2 = { visitorId, username, interactiveNonce };

      if (activeGame.player1 && activeGame.player2) await removeMessages(req.credentials, activeGame.id, urlSlug);
    } else {
      // todo Find position from the values of scale and center
      const textAsset = await createTextAsset(req.credentials);
      const messageText = await DroppedAsset.drop(textAsset, {
        position: { x: center.x - cellWidth, y: center.y + 2.5 * cellWidth * scale },
        // @ts-ignore
        text: "Find a second player!",
        textColor: "#333333",
        textSize: 20,
        textWidth: 300,
        uniqueName: `message${activeGame.id}`,
        urlSlug,
      });
      activeGame.messageTextId = messageText.id;
    }

    res.status(200).send({ message: "Player moved." });
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
