import { Optional } from "sequelize";
import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface TttPlayerAttributes {
  id: number;
  username: string;
  urlSlug: string;
  played: number;
  won: number;
  lost: number;
}

export interface TttPlayerCreationAttributes extends Optional<TttPlayerAttributes, "id"> {
}

@Table({ indexes: [{ type: "UNIQUE", fields: ["username", "urlSlug"] }] })
export class TttPlayer extends Model<TttPlayerAttributes, TttPlayerCreationAttributes> {
  @Column({ type: DataType.STRING, allowNull: false })
  public username!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public urlSlug!: string;

  @Column({ type: DataType.INTEGER.ZEROFILL })
  public played?: number;

  @Column({ type: DataType.INTEGER.ZEROFILL })
  public won?: number;

  @Column({ type: DataType.INTEGER.ZEROFILL })
  public lost?: number;
}
