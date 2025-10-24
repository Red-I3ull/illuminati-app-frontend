import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ghostIcon from '../assets/ghost.png';
import ufoIcon from '../assets/ufo.png';
import bigfootIcon from '../assets/bigfoot.png';
import otherIcon from '../assets/other.png';
import Navigation from '../components/Navigation';

const customMarkerIcon = {
  ghost: L.icon({
    iconUrl: ghostIcon,
    iconSize: [38, 38],
    draggable: true,
  }),
  ufo: L.icon({
    iconUrl: ufoIcon,
    iconSize: [38, 38],
    draggable: true,
  }),
  bigfoot: L.icon({
    iconUrl: bigfootIcon,
    iconSize: [38, 38],
    draggable: true,
  }),
  other: L.icon({
    iconUrl: otherIcon,
    iconSize: [38, 38],
    draggable: true,
  }),
};

const MapPage = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([
    { pos: [48.919, 24.71], icon: customMarkerIcon.other },
  ]);

  const defaultPosition = [48.919, 24.71]; // IF

  const handleCreateMarker = () => {
    if (!map) return;
    const center = map.getCenter();
    setMarkers((prevMarkers) => [
      ...prevMarkers,
      { pos: [center.lat, center.lng], icon: customMarkerIcon },
    ]);
    map.flyTo(center, map.getZoom());
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 relative pb-8">
      <Navigation />

      <main className="container mx-auto p-8">
        <div className="flex justify-end mb-4 pt-12">
          <button
            onClick={handleCreateMarker}
            className="py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-600"
          >
            Create a Marker
          </button>
        </div>

        <div className="w-full h-[60vh] rounded-lg shadow-lg overflow-hidden">
          <MapContainer
            whenCreated={setMap}
            center={defaultPosition}
            zoom={13}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {markers.map((marker, idx) => (
              <Marker
                key={`marker-${idx}`}
                position={marker.pos}
                icon={marker.icon}
              >
                <Popup>
                  Marker <br /> Lat: {marker.pos[0].toFixed(4)}, Lng:{' '}
                  {marker.pos[1].toFixed(4)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default MapPage;
