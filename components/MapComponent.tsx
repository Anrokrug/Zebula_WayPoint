"use client"

import { useEffect, useRef, useState } from "react"
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api"

interface Location {
  lat: number
  lng: number
}

interface House {
  id: string
  number: string
  location: Location
}

interface Road {
  id: string
  points: Location[]
}

interface MapComponentProps {
  onMapClick: (location: Location) => void
  houses: House[]
  roads: Road[]
  reception: Location | null
  currentRoad: Location[]
  mode: string
  isRecording?: boolean
  onLocationUpdate?: (location: Location) => void
}

export default function MapComponent({
  onMapClick,
  houses,
  roads,
  reception,
  currentRoad,
  mode,
  isRecording = false,
  onLocationUpdate,
}: MapComponentProps) {
  const mapRef = useRef(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const watchIdRef = useRef(null)
  const [showReceptionInfo, setShowReceptionInfo] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(newLocation)

        if (isRecording && onLocationUpdate) {
          onLocationUpdate(newLocation)
        }

        if (isRecording && mapRef.current) {
          mapRef.current.panTo(newLocation)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    )

    watchIdRef.current = watchId

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isRecording, onLocationUpdate])

  useEffect(() => {
    if (reception && mapRef.current) {
      mapRef.current.setCenter(reception)
      mapRef.current.setZoom(18)
      setShowReceptionInfo(true)
    }
  }, [reception])

  const mapCenter = currentLocation || reception || { lat: -24.7761, lng: 30.6297 }

  return (
    <LoadScript googleMapsApiKey="AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: "400px" }}
        center={mapCenter}
        zoom={15}
        onClick={(e) => {
          if (e.latLng) {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })
          }
        }}
        onLoad={(map) => {
          mapRef.current = map
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
                map.setCenter(pos)
                map.setZoom(18)
                setCurrentLocation(pos)
              },
              () => {
                console.log("Geolocation failed")
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
            )
          }
        }}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              path: "M 0,0 C -2,-20 2,-20 4,0 C 2,20 -2,20 -4,0 Z",
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
            title="Your Location"
            zIndex={1000}
          />
        )}

        {/* Reception Marker - BIG RED CIRCLE */}
        {reception && (
          <>
            <Marker
              position={reception}
              icon={{
                path: "M 0,0 C -2,-20 2,-20 4,0 C 2,20 -2,20 -4,0 Z",
                scale: 25,
                fillColor: "#FF0000",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 4,
              }}
              label={{
                text: "R",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
              title="RECEPTION - CLUBHOUSE"
              zIndex={5000}
              onClick={() => setShowReceptionInfo(true)}
            />
            {showReceptionInfo && (
              <InfoWindow position={reception} onCloseClick={() => setShowReceptionInfo(false)}>
                <div style={{ padding: "8px" }}>
                  <strong>RECEPTION - CLUBHOUSE</strong>
                  <br />
                  Starting Point
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {/* House Markers */}
        {houses.map((house) => (
          <Marker
            key={house.id}
            position={house.location}
            icon={{
              path: "M 0,0 C -2,-20 2,-20 4,0 C 2,20 -2,20 -4,0 Z",
              scale: 15,
              fillColor: "#2E7D32",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
            label={{
              text: house.number,
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
            }}
            title={`House ${house.number}`}
          />
        ))}

        {/* Roads */}
        {roads.map((road) => (
          <Polyline
            key={road.id}
            path={road.points}
            options={{
              strokeColor: "#FF6B6B",
              strokeWeight: 4,
            }}
          />
        ))}

        {/* Current Road/Path Being Drawn */}
        {currentRoad.length > 0 && (
          <Polyline
            path={currentRoad}
            options={{
              strokeColor: isRecording ? "#00FF00" : "#FFA500",
              strokeWeight: 5,
              strokeOpacity: 0.8,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  )
}
