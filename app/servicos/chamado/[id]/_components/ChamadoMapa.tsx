"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useMemo } from "react";

// Corrige ícone do Leaflet no Next
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ChamadoMapa({
  clienteLat,
  clienteLng,
  profLat,
  profLng,
}: {
  clienteLat?: number | null;
  clienteLng?: number | null;
  profLat?: number | null;
  profLng?: number | null;
}) {
  const hasCliente = typeof clienteLat === "number" && typeof clienteLng === "number";
  const hasProf = typeof profLat === "number" && typeof profLng === "number";

  const center = useMemo(() => {
    if (hasProf) return [profLat!, profLng!] as [number, number];
    if (hasCliente) return [clienteLat!, clienteLng!] as [number, number];
    return [-23.55052, -46.633308] as [number, number]; // fallback SP
  }, [hasProf, hasCliente, clienteLat, clienteLng, profLat, profLng]);

  // Se não tem coordenadas ainda, não mostra mapa
  if (!hasCliente && !hasProf) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
        Mapa indisponível (sem coordenadas salvas). Assim que o profissional ativar o GPS, o mapa aparece.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border bg-white">
      <div className="p-3 border-b text-sm font-medium">Acompanhamento no mapa</div>
      <div className="h-[360px] w-full">
        <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasCliente && (
            <Marker position={[clienteLat!, clienteLng!]}>
              <Popup>Cliente</Popup>
            </Marker>
          )}

          {hasProf && (
            <Marker position={[profLat!, profLng!]}>
              <Popup>Profissional</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
