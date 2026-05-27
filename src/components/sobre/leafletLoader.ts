type LeafletLike = any;

declare global {
  interface Window {
    L?: LeafletLike;
    __leafletLoading?: Promise<LeafletLike>;
  }
}

export function loadLeaflet(): Promise<LeafletLike> {
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoading) return window.__leafletLoading;

  window.__leafletLoading = new Promise<LeafletLike>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet não carregou.'));
    };
    script.onerror = () => reject(new Error('Falha ao carregar Leaflet.'));
    document.head.appendChild(script);
  });

  return window.__leafletLoading;
}

export function buildMapsLink(lat: number, lng: number): string {
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  if (isMobile) {
    return `https://maps.google.com/maps?q=Boulevard+Arquitetura+e+Constru%C3%A7%C3%A3o&near=${lat},${lng}`;
  }
  return 'https://www.google.com/maps/place/?q=place_id:ChIJpxkrxFK5uZQRf7bslNct4Qc';
}
