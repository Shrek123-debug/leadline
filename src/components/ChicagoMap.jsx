import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Color scale: green (low risk) -> amber -> rust (high risk), matching the
// app's existing safe/warn/danger palette. Manual 3-stop interpolation so we
// don't need a separate color-scale dependency for 77 polygons.
const STOPS = [
  { pct: 0, rgb: [47, 109, 79] }, // --safe
  { pct: 50, rgb: [181, 122, 30] }, // --warn
  { pct: 100, rgb: [158, 59, 46] }, // --danger
];

function colorFor(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  let a = STOPS[0], b = STOPS[1];
  if (clamped > 50) {
    a = STOPS[1];
    b = STOPS[2];
  }
  const span = b.pct - a.pct;
  const t = span === 0 ? 0 : (clamped - a.pct) / span;
  const rgb = a.rgb.map((c, i) => Math.round(c + (b.rgb[i] - c) * t));
  return `rgb(${rgb.join(",")})`;
}

/**
 * geojson: the trimmed community-areas.geojson (already fetched by parent)
 * highlightArea: area number (int) to visually emphasize, or null
 * onSelectArea: called with the area's properties when a shape is clicked
 * labels: { legendLow, legendHigh, popupPct } for i18n
 */
export default function ChicagoMap({ geojson, highlightArea, onSelectArea, labels }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [41.85, -87.68],
      zoom: 10,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw / redraw the choropleth whenever the data or highlight changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    if (layerRef.current) {
      layerRef.current.remove();
    }

    const layer = L.geoJSON(geojson, {
      style: (feature) => {
        const isHighlighted = highlightArea != null && feature.properties.area === highlightArea;
        return {
          fillColor: colorFor(feature.properties.pctReq),
          fillOpacity: isHighlighted ? 0.9 : 0.65,
          color: isHighlighted ? "#17241F" : "#ffffff",
          weight: isHighlighted ? 3 : 1,
        };
      },
      onEachFeature: (feature, lyr) => {
        lyr.bindTooltip(
          `<strong>${feature.properties.name}</strong><br/>${feature.properties.pctReq}% ${labels.popupPct}`,
          { sticky: true }
        );
        lyr.on("click", () => onSelectArea && onSelectArea(feature.properties));
        lyr.on("mouseover", () => lyr.setStyle({ weight: 2.5 }));
        lyr.on("mouseout", () =>
          lyr.setStyle({ weight: highlightArea === feature.properties.area ? 3 : 1 })
        );
      },
    }).addTo(map);

    layerRef.current = layer;
    map.fitBounds(layer.getBounds(), { padding: [10, 10] });

    if (highlightArea != null) {
      // Bring the highlighted shape's outline to the front so it isn't
      // visually buried under neighboring polygons.
      layer.eachLayer((lyr) => {
        if (lyr.feature.properties.area === highlightArea) lyr.bringToFront();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson, highlightArea]);

  return (
    <div className="ll-map-wrap">
      <div ref={containerRef} className="ll-map" />
      <div className="ll-map-legend">
        <span>{labels.legendLow}</span>
        <div className="ll-map-legend-bar" />
        <span>{labels.legendHigh}</span>
      </div>
    </div>
  );
}
