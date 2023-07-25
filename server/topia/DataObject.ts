import { DroppedAssetInterface, Visitor, VisitorInterface } from "@rtsdk/topia";
import { TttStats } from "../models.js";

/**
 * Generic class to support saving data in `visitor.dataObject` on Topia.
 */
class DataObject<D extends VisitorInterface | DroppedAssetInterface, T> {
  _fieldName: string;

  constructor(fieldName: string) {
    this._fieldName = fieldName;
  }

  read = async (dataHolder: D): Promise<T | undefined> => {
    await dataHolder.fetchDataObject();
    // fixme user.dataObject is not defined. That's why it cannot be used as a supertype of D. This is a lacuna in Topia RTSDK.
    const d = dataHolder.dataObject as any;
    if (!d || !d[this._fieldName])
      return undefined;
    return d[this._fieldName] as T;
  };

  write = async (dataHolder: D, value: T) => {
    await dataHolder.fetchDataObject();
    let d = dataHolder.dataObject as any;
    if (!d)
      d = {};
    d[this._fieldName] = value;
    return dataHolder.setDataObject(d, {});
  };

  remove = async (dataHolder: D) => {
    await dataHolder.fetchDataObject();
    let d = dataHolder.dataObject as any;
    if (d && d[this._fieldName]) {
      d[this._fieldName] = undefined;
      return dataHolder.setDataObject(d, {});
    }
    return true;
  };
}

/**
 * App-specific data for a visitor.
 */
export const TttStatsData = new DataObject<Visitor, TttStats>("tttStats");
