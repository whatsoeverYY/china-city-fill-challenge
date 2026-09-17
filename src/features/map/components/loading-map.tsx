export default function LoadingMap() {
  return (
    <div className="map-loading grid place-items-center gap-3 p-10 text-sm font-bold text-ink-soft" role="status">
      <span className="loading-compass block size-9 animate-spin rounded-full border-4 border-black/10 border-t-city-500" aria-hidden="true" />
      <p className="m-0">正在展开地图…</p>
    </div>
  );
}
