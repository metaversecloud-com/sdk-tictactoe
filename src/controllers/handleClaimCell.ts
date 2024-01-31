import { Request, Response } from "express";
import {
  dropWebImageAsset,
  errorHandler,
  getCredentials,
  getDroppedAsset,
  getDroppedAssetDataObject,
  getGameStatus,
  getFinishLineOptions,
  getWorldDataObject,
  lockDataObject,
  updateGameText,
} from "../utils/index.js";
import { GameDataType } from "../types/gameDataType";
import { cellWidth } from "../constants.js";

export const handleClaimCell = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);
    const { profileId, visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = false;

    const cell = parseInt(req.params.cell);
    if (isNaN(cell)) throw "Cell is missing.";

    const { keyAsset } = await getDroppedAssetDataObject(credentials);

    let {
      claimedCells,
      isGameOver,
      isResetInProgress,
      keyAssetId,
      lastPlayerTurn,
      playerO,
      playerX,
      resetCount,
      turnCount,
    } = keyAsset.dataObject as GameDataType;

    if (isResetInProgress) throw "Reset in progress.";

    const updatedData = {
      isGameOver,
      lastPlayerTurn,
      lastInteraction: new Date(),
      turnCount: turnCount + 1,
    };

    try {
      try {
        const timestamp = new Date(Math.round(new Date().getTime() / 5000) * 5000);
        await lockDataObject(`${keyAssetId}-${resetCount}-${turnCount}-${timestamp}`, keyAsset);
      } catch (error) {
        return res.status(409).json({ message: "Move already in progress." });
      }

      if (isGameOver) {
        text = "Game over! Press Reset to play again.";
      } else if (!playerO.visitorId || !playerX.visitorId) {
        text = "Two players are needed to get started.";
      } else if (playerO.visitorId !== visitorId && playerX.visitorId !== visitorId) {
        text = "Game in progress.";
      } else if (claimedCells[cell]) {
        text = "Cannot place your move here.";
      } else if (lastPlayerTurn === visitorId) {
        const username = playerX.visitorId === visitorId ? playerO.username : playerX.username;
        text = `It's ${username}'s turn.`;
      } else {
        updatedData.lastPlayerTurn = visitorId;
        claimedCells[cell] = visitorId;
        shouldUpdateGame = true;
      }

      if (!shouldUpdateGame) {
        await updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`);
        throw text;
      }

      const promises = [];

      const cellAsset = await getDroppedAsset(credentials);
      promises.push(
        dropWebImageAsset({
          credentials,
          layer1: `${process.env.BUCKET}${visitorId === playerO.visitorId ? "blue_o" : "pink_x"}.png`,
          position: cellAsset.position,
          uniqueName: `${keyAssetId}_TicTacToe_move`,
        }),
      );

      const gameStatus = await getGameStatus(claimedCells);
      if (gameStatus.isDraw) {
        text = "It's a draw! Press Reset to play again.";
        updatedData.isGameOver = true;
      } else if (gameStatus.hasWinningCombo) {
        await keyAsset.fetchDroppedAssetById();
        // @ts-ignore
        const keyAssetPosition = keyAsset.position;

        text = `${username} wins!`;
        updatedData.isGameOver = true;

        // drop a finishing line
        const finishLineOptions = await getFinishLineOptions(
          playerO.visitorId === visitorId,
          keyAssetId,
          keyAssetPosition,
          gameStatus.winningCombo,
        );
        promises.push(
          dropWebImageAsset({
            credentials,
            ...finishLineOptions,
          }),
        );

        // drop crown
        const position = {
          x: playerO.visitorId === visitorId ? keyAssetPosition.x + 200 : keyAssetPosition.x - 200,
          y: keyAssetPosition.y - 180 - cellWidth * 2,
        };
        promises.push(
          dropWebImageAsset({
            credentials,
            layer0: `${process.env.BUCKET}crown.png`,
            position,
            uniqueName: `${keyAssetId}_TicTacToe_crown`,
          }),
        );

        // update world data object
        const world = await getWorldDataObject(credentials);
        promises.push(world.incrementDataObjectValue(`keyAssets.${keyAssetId}.gamesWonByUser.${profileId}.count`, 1));
        promises.push(world.incrementDataObjectValue(`keyAssets.${keyAssetId}.totalGamesWonCount`, 1));
      }

      promises.push(
        keyAsset.updateDataObject({
          ...updatedData,
          [`claimedCells.${cell}`]: visitorId,
        }),
      );

      promises.push(updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`));

      await Promise.all(promises);
    } catch (error) {
      await keyAsset.updateDataObject({ turnCount: turnCount + 1 });
      throw error;
    }
    return res.status(200).send({ message: "Move successfully made." });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleClaimCell",
      message: "Error making a move.",
      req,
      res,
    });
  }
};
