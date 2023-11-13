import { DroppedAssetInterface, UserInterface, VisitorInterface, WorldInterface } from "@rtsdk/topia";

/**
 * Generic class to support saving data in dataObjects of Visitor, DroppedAsset or User on Topia.
 *
 * @param
 */
export default class DataObject<D extends VisitorInterface | DroppedAssetInterface | UserInterface | WorldInterface, T> {
  private readonly _fieldName: string;

  constructor(fieldName: string) {
    this._fieldName = fieldName;
  }

  read = async (dataHolder: D): Promise<T | undefined> => {
    await dataHolder.fetchDataObject();
    // @ts-ignore
    const d = dataHolder.dataObject as any;
    if (!d || !d[this._fieldName])
      return undefined;
    return d[this._fieldName] as T;
  };

  write = async (dataHolder: D, value: T, lock?: { lockId: string, releaseLock?: boolean }) => {
    await dataHolder.fetchDataObject();
    // fixme remove these once dataObject is added to WorldInterface
    // @ts-ignore
    let d = dataHolder.dataObject as any;
    if (!d)
      d = {};
    d[this._fieldName] = value;
    if (lock)
      return dataHolder.setDataObject(d, { lock });
    return dataHolder.setDataObject(d, {});
  };

  remove = async (dataHolder: D) => {
    await dataHolder.fetchDataObject();
    // @ts-ignore
    let d = dataHolder.dataObject as any;
    if (d && d[this._fieldName]) {
      d[this._fieldName] = undefined;
      return dataHolder.setDataObject(d, {});
    }
    return true;
  };
}

/**
 * Example usage
 * ```{typescript}
 * First describe your data like this,
 * export const TttStatsData = new DataObject<Visitor, TttStats>("tttStats");
 *
 * It means, we want to keep TttStats object in `tttStats` field in visitors' dataObjects.
 *
 * export const BoardIdData = new DataObject<DroppedAsset, number>("boardId");
 *
 * This means, we want to keep a number in `boardId` field in a DroppedAsset's dataObject.
 *
 * Now use it,
 * await BardIdData.write(droppedAsset, 4);
 *
 * This will write 4 to the `boardId` property of dataObject of the given droppedAsset.
 *
 * await BoardIdData.read(droppedAsset);
 * It will return a number if found in the boardId property of the dataObject of the given droppedAsset, undefined otherwise.
 *
 * await BoardIdData.remove(droppedAsset);
 *
 * It removes boardId property from the dataObject of the given droppedAsset.
 * ```
 */
