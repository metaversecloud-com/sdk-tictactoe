export type DroppedAsset = any
export type Visitor = any

export interface IInteractiveParams {
  interactiveNonce: string;
  interactivePublicKey: string;
  urlSlug: string;
  assetId: string;
  visitorId: string | number;
}

export interface IConfig {
  interactiveKey: string | undefined;
  interactiveSecret: string | undefined;
}

export interface ITextForm {
  textColor: string;
  textFontFamily: string;
  textSize: number;
  textWeight: string;
  textWidth: number;
}

export interface IZonesBox {
  broadcastZoneEntered: ISingleZone;
  privateZoneEntered: ISingleZone;
  webhookZoneEntered: ISingleZone;
  webhookZoneExited: ISingleZone;
}

export interface ISingleZone {
  name: string;
  value: boolean;
}

export interface ITextStyle {
  "textColor": string;
  "textFontFamily": string;
  "textSize": number;
  "textWeight": string;
  "textWidth": number;
}
