type Point = readonly [number, number];

export function fitRotatedPointsScale(
  points: readonly Point[],
  rotationDegrees: number,
  centerX: number,
  centerY: number,
  availableWidth: number,
  availableHeight: number,
) {
  if (
    points.length === 0 ||
    ![rotationDegrees, centerX, centerY, availableWidth, availableHeight].every(Number.isFinite) ||
    availableWidth <= 0 ||
    availableHeight <= 0
  ) {
    return 1;
  }

  const radians = (rotationDegrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  let maximumX = 0;
  let maximumY = 0;

  for (const [x, y] of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const offsetX = x - centerX;
    const offsetY = y - centerY;
    const rotatedX = offsetX * cosine - offsetY * sine;
    const rotatedY = offsetX * sine + offsetY * cosine;
    maximumX = Math.max(maximumX, Math.abs(rotatedX));
    maximumY = Math.max(maximumY, Math.abs(rotatedY));
  }

  if (maximumX === 0 || maximumY === 0) return 1;

  return Math.min(
    1,
    availableWidth / 2 / maximumX,
    availableHeight / 2 / maximumY,
  );
}
