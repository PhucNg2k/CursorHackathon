import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Green icon for donation points
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Blue icon for user location
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map center changes
function MapController({ centerPoint }) {
  const map = useMap()
  const prevCenterPointIdRef = useRef(null)
  
  useEffect(() => {
    if (centerPoint && centerPoint.id !== prevCenterPointIdRef.current) {
      try {
        if (map && map.setView) {
          map.setView([centerPoint.latitude, centerPoint.longitude], 15, {
            animate: true,
            duration: 0.5
          })
          prevCenterPointIdRef.current = centerPoint.id
        }
      } catch (error) {
        console.error('Error setting map view:', error)
      }
    }
  }, [centerPoint, map])
  
  return null
}

function MapView({ points, userLocation, loading, centerPoint }) {
  const mapRef = useRef(null)
  const hasCenteredRef = useRef(false)

  useEffect(() => {
    // Only fit bounds if we haven't manually centered on a point
    if (mapRef.current && points.length > 0 && !centerPoint) {
      const bounds = points.map(point => [point.latitude, point.longitude])
      if (userLocation) {
        bounds.push([userLocation.lat, userLocation.lng])
      }
      if (bounds.length > 0) {
        try {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        } catch (error) {
          console.error('Error fitting bounds:', error)
        }
      }
    }
  }, [points, userLocation, centerPoint])

  if (loading) {
    return <div className="map-loading">Loading map...</div>
  }

  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [10.8231, 106.6297] // Default to Ho Chi Minh City

  return (
    <div className="map-view">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController centerPoint={centerPoint} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={blueIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        {points.map((point) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]} icon={greenIcon}>
            <Popup>
              <div>
                <h3>{point.organization_name}</h3>
                <p>{point.address}</p>
                <p>Status: {point.status}</p>
                <a href={`/points/${point.id}`}>View Details</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapView

