"use client";

import dynamic from "next/dynamic";
import L from "leaflet";
import { useEffect, useMemo } from "react";

/**
 * ✅ CSS do Leaflet deve ficar no app/layout.tsx:
 * import "leaflet/dist/leaflet.css";
 */

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
) as any;

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
) as any;

const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
) as any;

const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
) as any;

const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
) as any;

function useLeafletIconFix() {
  useEffect(() => {
    // evita rodar 2x
    // @ts-ignore
    if ((L as any).__iadrogarias_leaflet_icon_fix) return;
    // @ts-ignore
    (L as any).__iadrogarias_leaflet_icon_fix = true;

    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);
}

export type ChamadoMapaProps = {
  clienteLat?: number | null;
  clienteLng?: number | null;
  profLat?: number | null;
  profLng?: number | null;
  rota?: Array<[number, number]> | null;
  clienteLabel?: string;
  profLabel?: string;
  height?: number;
};

export default function ChamadoMapa({
  clienteLat,
  clienteLng,
  profLat,
  profLng,
  rota,
  clienteLabel = "Cliente",
  profLabel = "Profissional",
  height = 360,
}: ChamadoMapaProps) {
  useLeafletIconFix();

  const hasCliente = Number.isFinite(clienteLat) && Number.isFinite(clienteLng);
  const hasProf = Number.isFinite(profLat) && Number.isFinite(profLng);

  const center = useMemo<[number, number]>(() => {
    if (hasProf) return [Number(profLat), Number(profLng)];
    if (hasCliente) return [Number(clienteLat), Number(clienteLng)];
    return [-23.55052, -46.633308]; // SP fallback
  }, [hasProf, hasCliente, profLat, profLng, clienteLat, clienteLng]);

  const line = useMemo<Array<[number, number]> | null>(() => {
    if (rota && rota.length >= 2) return rota;
    if (hasProf && hasCliente) {
      return [
        [Number(profLat), Number(profLng)],
        [Number(clienteLat), Number(clienteLng)],
      ];
    }
    return null;
  }, [rota, hasProf, hasCliente, profLat, profLng, clienteLat, clienteLng]);

  if (!hasCliente && !hasProf) {
    return (
      <div className="rounded-2xl border bg-white">
        <div className="p-3 border-b text-sm font-medium">Acompanhamento no mapa</div>
        <div className="p-4 text-sm text-slate-600">
          Ainda não temos coordenadas para exibir no mapa.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-3 border-b text-sm font-medium">Acompanhamento no mapa</div>

      <div style={{ height }} className="w-full">
        <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasProf && (
            <Marker position={[Number(profLat), Number(profLng)]}>
              <Popup>
                <b>{profLabel}</b>
              </Popup>
            </Marker>
          )}

          {hasCliente && (
            <Marker position={[Number(clienteLat), Number(clienteLng)]}>
              <Popup>
                <b>{clienteLabel}</b>
              </Popup>
            </Marker>
          )}

          {line && <Polyline positions={line} />}
        </MapContainer>
      </div>

      <div className="p-3 text-xs text-slate-500">
        Para o cliente ver o profissional se mexendo, você precisa salvar profLat/profLng em tempo real.
      </div>
    </div>
  );
}
