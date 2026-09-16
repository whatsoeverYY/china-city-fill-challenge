export type AtlasView = {
  scale: number;
  x: number;
  y: number;
};

export type AtlasRegionDrawing = {
  key: string;
  path: string;
  fill: string;
  name: string;
  plate: string;
  labelX: number;
  labelY: number;
  longLabel: boolean;
};

export type AtlasProvinceDrawing = {
  key: string;
  path: string;
};

export type AtlasHoverLabel = {
  name: string;
  plate: string;
  left: number;
  top: number;
};
