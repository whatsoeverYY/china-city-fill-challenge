export type CityAnswer = {
  id: string;
  name: string;
  provinceCode: string;
};

export type CityTouchDrag = {
  answer: CityAnswer;
  startX: number;
  startY: number;
};

export type CityDragGhost = {
  answer: CityAnswer;
  x: number;
  y: number;
};
