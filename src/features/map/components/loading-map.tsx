export default function LoadingMap() {
  return (
    <div className="map-loading" role="status">
      <span className="loading-compass" aria-hidden="true" />
      <p>正在展开地图…</p>
    </div>
  );
}
