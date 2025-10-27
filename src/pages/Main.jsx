import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ghostIcon from '../assets/ghost.png';
import ufoIcon from '../assets/ufo.png';
import bigfootIcon from '../assets/bigfoot.png';
import otherIcon from '../assets/other.png';
import Navigation from '../components/Navigation';
import api from '../axiosConfig.js';
import PropTypes from 'prop-types';

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

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

MapClickHandler.propTypes = {
  onMapClick: PropTypes.func.isRequired,
};

const MapPage = () => {
  const [setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedIconType, setSelectedIconType] = useState('other');
  const defaultPosition = [48.919, 24.71]; // IF

  let userRole = null;
  const userString = localStorage.getItem('user');
  if (userString) {
    const user = JSON.parse(userString);
    userRole = user.role;
  }

  // create a marker on klick
  const handleMapClick = async (latlng) => {
    const payload = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: selectedIconType,
    };

    try {
      const response = await api.post('markers/', payload);
      const newMarker = response.data;
      setMarkers((prevMarkers) => [
        ...prevMarkers,
        {
          id: newMarker.id,
          pos: [newMarker.lat, newMarker.lng],
          name: newMarker.name,
          icon: customMarkerIcon[newMarker.name] || customMarkerIcon.other,
          user: newMarker.user,
        },
      ]);
      toast.success('You added a new marker!');
    } catch (error) {
      console.error('Error creating marker:', error);
      if (error.response && error.response.status === 403) {
        toast.error("You don't have permission to create a marker.");
      }
    }
  };

  //get all markers
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const response = await api.get('markers/');
        const loadedMarkers = response.data.map((marker) => ({
          id: marker.id,
          pos: [marker.lat, marker.lng],
          name: marker.name,
          icon: customMarkerIcon[marker.name] || customMarkerIcon.other,
          user: marker.user,
        }));
        setMarkers(loadedMarkers);
      } catch (error) {
        console.error('Error fetching markers:', error);
      }
    };
    fetchMarkers();
  }, []);

  //delete marker
  const handleDeleteMarker = async (markerId) => {
    try {
      await api.delete(`markers/${markerId}/`);
      setMarkers((prevMarkers) =>
        prevMarkers.filter((marker) => marker.id !== markerId),
      );
    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 relative pb-8">
      <Navigation />

      <main className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-4 pt-12">
          <div className="flex items-center space-x-4">
            <label htmlFor="icon-select" className="text-sm font-medium">
              Select Icon:
            </label>
            <select
              id="icon-select"
              value={selectedIconType}
              onChange={(e) => setSelectedIconType(e.target.value)}
              className="py-2 px-3 rounded-md shadow-sm text-sm bg-gray-800 border-gray-700 text-white"
            >
              <option value="other">Other</option>
              <option value="ghost">Ghost</option>
              <option value="ufo">UFO</option>
              <option value="bigfoot">Bigfoot</option>
            </select>
            <span className="text-sm text-gray-400">
              (Click on the map to add)
            </span>

            <label htmlFor="icon-select" className="text-sm font-medium">
              Your Rank:
            </label>
            <span className="text-sm text-gray-400">{userRole}</span>
          </div>
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
            {markers.map((marker) => (
              <Marker key={marker.id} position={marker.pos} icon={marker.icon}>
                <Popup>
                  Marker Type: <strong>{marker.name}</strong>
                  <br />
                  Lat: {marker.pos[0].toFixed(4)}, Lng:{' '}
                  {marker.pos[1].toFixed(4)}
                  <br />
                  {(userRole === 'GOLDEN' || userRole === 'ARCHITECT') && (
                    <button
                      onClick={() => handleDeleteMarker(marker.id)}
                      className="mt-2 w-full py-1 px-2 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete Marker
                    </button>
                  )}
                </Popup>
              </Marker>
            ))}
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default MapPage;
