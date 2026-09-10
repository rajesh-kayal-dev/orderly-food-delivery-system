import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import OpenStreetMapAdapter from "../../adapters/navigation/OpenStreetMapAdapter";

// Custom Leaflet Markers for Driver & Customer Pins
const driverIcon = new L.DivIcon({
  className: "custom-driver-icon",
  html: `<div style="background-color:#FF6B35; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;">??</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destinationIcon = new L.DivIcon({
  className: "custom-dest-icon",
  html: `<div style="background-color:#EF4444; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;">??</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, 15);
    }
  }, [center, bounds, map]);
  return null;
}

export default function AppMap({ destinationLat, destinationLng }) {
  const navigationService = useMemo(() => new OpenStreetMapAdapter(), []);

  const [currentPosition, setCurrentPosition] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routePositions, setRoutePositions] = useState([]);
  const [mapCenter, setMapCenter] = useState([28.6448, 77.216]);
  const [mapBounds, setMapBounds] = useState(null);

  const watchIdRef = useRef(null);
  const lastRouteFetchRef = useRef(0);

  function setDestinationByCoords(lat, lng) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      return;
    }

    setDestination({ lat: parsedLat, lng: parsedLng });
  }

  useEffect(() => {
    watchIdRef.current = navigationService.watchCurrentPosition(
      (nextPos) => {
        setCurrentPosition(nextPos);
        setMapCenter([nextPos.lat, nextPos.lng]);
      },
      (error) => {
        console.error("GPS error:", error);
      }
    );

    return () => {
      navigationService.clearWatch(watchIdRef.current);
    };
  }, [navigationService]);

  useEffect(() => {
    if (
      destinationLat !== undefined &&
      destinationLng !== undefined &&
      destinationLat !== null &&
      destinationLng !== null
    ) {
      setDestinationByCoords(destinationLat, destinationLng);
    }
  }, [destinationLat, destinationLng]);

  useEffect(() => {
    if (!currentPosition || !destination) return;

    const now = Date.now();
    if (now - lastRouteFetchRef.current < 3000) return;
    lastRouteFetchRef.current = now;

    const fetchRoute = async () => {
      try {
        const route = await navigationService.getRoute(
          currentPosition,
          destination
        );

        if (route && route.geometry && route.geometry.coordinates) {
          // GeoJSON is [lng, lat], Leaflet Polyline needs [lat, lng]
          const latLngs = route.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setRoutePositions(latLngs);

          setMapBounds([
            [Math.min(currentPosition.lat, destination.lat), Math.min(currentPosition.lng, destination.lng)],
            [Math.max(currentPosition.lat, destination.lat), Math.max(currentPosition.lng, destination.lng)],
          ]);
        }
      } catch (err) {
        console.error("Route error:", err);
      }
    };

    fetchRoute();
  }, [currentPosition, destination, navigationService]);

  function handleCenterCurrentLocation() {
    if (currentPosition) {
      setMapBounds(null);
      setMapCenter([currentPosition.lat, currentPosition.lng]);
    }
  }

  function handleFitCurrentAndDestination() {
    if (currentPosition && destination) {
      setMapBounds([
        [Math.min(currentPosition.lat, destination.lat), Math.min(currentPosition.lng, destination.lng)],
        [Math.max(currentPosition.lat, destination.lat), Math.max(currentPosition.lng, destination.lng)],
      ]);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          onClick={handleCenterCurrentLocation}
          style={{
            padding: "10px 14px",
            border: "none",
            borderRadius: 12,
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Focus My Location
        </button>

        <button
          onClick={handleFitCurrentAndDestination}
          style={{
            padding: "10px 14px",
            border: "none",
            borderRadius: 12,
            background: "#FF6B35",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Center The Route
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} bounds={mapBounds} />

        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={driverIcon}
          />
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          />
        )}

        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            color="#FF6B35"
            weight={5}
            opacity={0.85}
          />
        )}
      </MapContainer>
    </div>
  );
}
