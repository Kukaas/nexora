"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import type {
  Map as MlMap,
  Marker as MlMarker,
  StyleSpecification,
} from "maplibre-gl";
import { MapPin, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  isWithinLibtangin,
  LIBTANGIN_BOUNDARY,
  LIBTANGIN_MAP,
  type LibtanginVenue,
} from "@/lib/documents";

export type MapPoint = { lat: number; lng: number };

/** Build the small labeled DOM marker used for a landmark on the picker map. */
function venueMarkerElement(name: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `Use ${name}`);
  el.style.cssText =
    "display:flex;align-items:center;gap:5px;background:transparent;border:0;padding:0;cursor:pointer;";
  const dot = document.createElement("span");
  dot.style.cssText =
    "width:11px;height:11px;border-radius:9999px;background:#d98a1f;box-shadow:0 0 0 2px #fff,0 1px 2px rgba(0,0,0,.35);flex:none;";
  const label = document.createElement("span");
  label.textContent = name;
  label.style.cssText =
    "font:600 11px/1.1 system-ui,sans-serif;background:rgba(20,18,14,.78);color:#fff;padding:3px 8px;border-radius:9999px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.45);backdrop-filter:blur(2px);";
  el.append(dot, label);
  return el;
}

/** Amber pin so the marker reads as the brand's "here" color. */
const MARKER_COLOR = "#d98a1f";

const { bounds, center, defaultZoom, minZoom, maxZoom } = LIBTANGIN_MAP;
/** MapLibre wants [[west, south], [east, north]]. */
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [bounds.west, bounds.south],
  [bounds.east, bounds.north],
];

/**
 * A keyless satellite basemap from Esri World Imagery. No token needed, so the
 * map works out of the box; the imagery is the same in light and dark themes.
 */
function basemapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        // Esri only has imagery for rural Libtangin up to z18; beyond that its
        // tiles are a "not available" placeholder. Cap the source so MapLibre
        // upscales the z18 tile for deeper zooms instead of fetching those.
        maxzoom: 18,
        attribution:
          "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      },
    },
    layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  };
}

/**
 * Interactive location picker locked to Barangay Libtangin. Tap the map (or drag
 * the pin) to choose a spot; panning and zooming out past the barangay box is
 * disabled, so a secretary can only pick a point within Libtangin. Controlled:
 * `value` is the current point (or null), `onChange` fires with each pick.
 */
export function LibtanginMapPicker({
  value,
  onChange,
  venues,
  onPickVenue,
  onRejectOutside,
  disabled,
  className,
}: {
  value: MapPoint | null;
  onChange: (next: MapPoint | null) => void;
  /** Labeled landmarks to drop on the map as one-tap shortcuts. */
  venues?: LibtanginVenue[];
  /** Fired when a labeled landmark is tapped (sets both name and point). */
  onPickVenue?: (venue: LibtanginVenue) => void;
  /** Fired when a click or drag lands outside the Libtangin boundary. */
  onRejectOutside?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<MlMarker | null>(null);
  const glRef = useRef<typeof import("maplibre-gl") | null>(null);
  const [ready, setReady] = useState(false);

  // Keep the latest callbacks/flags without re-running the one-time init effect.
  const onChangeRef = useRef(onChange);
  const onPickVenueRef = useRef(onPickVenue);
  const onRejectOutsideRef = useRef(onRejectOutside);
  const disabledRef = useRef(disabled);
  const venuesRef = useRef(venues);
  const valueRef = useRef(value);
  useEffect(() => {
    onChangeRef.current = onChange;
    onPickVenueRef.current = onPickVenue;
    onRejectOutsideRef.current = onRejectOutside;
    disabledRef.current = disabled;
    venuesRef.current = venues;
    valueRef.current = value;
  });

  useEffect(() => {
    let cancelled = false;
    let map: MlMap | undefined;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      glRef.current = maplibregl;

      const m = new maplibregl.Map({
        container: containerRef.current,
        style: basemapStyle(),
        center: value ? [value.lng, value.lat] : center,
        zoom: value ? 16 : defaultZoom,
        minZoom,
        maxZoom,
        maxBounds: MAX_BOUNDS,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: { compact: true },
      });
      map = m;
      m.touchZoomRotate.disableRotation();
      m.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      mapRef.current = m;

      m.on("click", (e) => {
        if (disabledRef.current) return;
        const { lng, lat } = e.lngLat;
        if (!isWithinLibtangin(lng, lat)) {
          onRejectOutsideRef.current?.();
          return;
        }
        onChangeRef.current({ lat, lng });
      });

      m.on("load", () => {
        if (cancelled) return;

        // Highlight the barangay so it's clear where a spot can be picked.
        m.addSource("barangay", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [LIBTANGIN_BOUNDARY] },
          },
        });
        m.addLayer({
          id: "barangay-fill",
          type: "fill",
          source: "barangay",
          paint: { "fill-color": "#d98a1f", "fill-opacity": 0.1 },
        });
        m.addLayer({
          id: "barangay-line",
          type: "line",
          source: "barangay",
          paint: {
            "line-color": "#f0b653",
            "line-width": 2,
            "line-dasharray": [2, 1.5],
          },
        });

        // Drop the labeled landmark shortcuts. Tapping one picks that venue.
        for (const venue of venuesRef.current ?? []) {
          const el = venueMarkerElement(venue.name);
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (disabledRef.current) return;
            onPickVenueRef.current?.(venue);
          });
          new maplibregl.Marker({ element: el, anchor: "left" })
            .setLngLat([venue.lng, venue.lat])
            .addTo(m);
        }

        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
    // Init once; live values are read through refs / the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect the controlled value onto the marker: create, move, or remove it.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const maplibregl = glRef.current;
    if (!map || !maplibregl) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = new maplibregl.Marker({
        color: MARKER_COLOR,
        draggable: !disabled,
      })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLngLat();
        if (!isWithinLibtangin(p.lng, p.lat)) {
          // Snap back to the last valid spot and warn.
          const prev = valueRef.current;
          if (prev) marker.setLngLat([prev.lng, prev.lat]);
          onRejectOutsideRef.current?.();
          return;
        }
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([value.lng, value.lat]);
      markerRef.current.setDraggable(!disabled);
    }

    // Recenter on the point. A drag ends near the current center (barely moves),
    // while a chip / landmark pick jumps across the barangay (glides into view).
    map.easeTo({ center: [value.lng, value.lat], duration: 500 });
  }, [value, ready, disabled]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl ring-1 ring-foreground/10",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="h-64 w-full sm:h-72"
        role="application"
        aria-label="Map of Barangay Libtangin. Tap to choose a location."
      />

      {/* Hint / clear control, floating over the map. */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
          <MapPin className="size-3.5 text-accent-foreground" aria-hidden />
          {value ? "Drag the pin to adjust" : "Tap the map to set the spot"}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-destructive shadow-sm backdrop-blur-sm outline-none transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <X className="size-3.5" aria-hidden />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Read-only map for the resident feed, showing one pin inside Libtangin. It's
 * lazy: the map only mounts once the card scrolls near the viewport, so a long
 * feed doesn't spin up a WebGL context per notice on load (budget-device
 * friendly). Zoom is gated behind two-finger / ctrl so it never hijacks scroll.
 */
export function LibtanginMapView({
  lat,
  lng,
  label,
  className,
}: {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  // Start visible only where there's no observer (SSR/old browsers); otherwise
  // wait until the card nears the viewport before spinning up the map.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  // Mount the map only when the card nears the viewport.
  useEffect(() => {
    const node = rootRef.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let map: MlMap | undefined;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: basemapStyle(),
        center: [lng, lat],
        zoom: 16,
        minZoom,
        maxZoom,
        maxBounds: MAX_BOUNDS,
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.scrollZoom.disable();
      map.touchZoomRotate.disableRotation();
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, showZoom: true }),
        "top-right",
      );
      new maplibregl.Marker({ color: MARKER_COLOR })
        .setLngLat([lng, lat])
        .addTo(map);
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [visible, lat, lng]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative overflow-hidden rounded-2xl ring-1 ring-foreground/10",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="h-44 w-full bg-muted"
        role="img"
        aria-label={
          label
            ? `Map showing ${label} in Barangay Libtangin`
            : "Map showing the location in Barangay Libtangin"
        }
      />
    </div>
  );
}
