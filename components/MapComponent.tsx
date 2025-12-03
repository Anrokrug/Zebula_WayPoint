"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Layer[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const currentLocationMarkerRef = useRef<L.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const initMap = () => {
      if (mapRef.current) return

      const mapContainer = containerRef.current
      if (!mapContainer) {
        return
      }

      try {
        const map = L.map(mapContainer).setView([0, 0], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)

        map.on("click", (e: L.LeafletMouseEvent) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
        })

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              map.setView([position.coords.latitude, position.coords.longitude], 18)
              setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
            },
            () => {
              map.setView([-24.7761, 30.6297], 13)
            },
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000,
            },
          )
        } else {
          map.setView([-24.7761, 30.6297], 13)
        }

        mapRef.current = map

        setTimeout(() => {
          map.invalidateSize()
        }, 100)
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    const timeoutId = setTimeout(initMap, 100)

    return () => {
      clearTimeout(timeoutId)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [onMapClick])

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(newLocation)

        if (isRecording && onLocationUpdate) {
          onLocationUpdate(newLocation)
        }

        if (isRecording && mapRef.current) {
          mapRef.current.setView([newLocation.lat, newLocation.lng], mapRef.current.getZoom(), {
            animate: true,
          })
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
    if (!mapRef.current || !currentLocation) return

    if (currentLocationMarkerRef.current) {
      mapRef.current.removeLayer(currentLocationMarkerRef.current)
    }

    const currentLocationIcon = L.divIcon({
      className: "custom-icon",
      html: `<div style="
        background-color: #4285F4; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);
        position: relative;
      ">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(66, 133, 244, 0.3);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      </style>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const marker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: currentLocationIcon,
      zIndexOffset: 1000,
    })
      .bindPopup("<b>Your Location</b>")
      .addTo(mapRef.current)

    currentLocationMarkerRef.current = marker
  }, [currentLocation])

  useEffect(() => {
    if (!mapRef.current) return

    console.log("Updating markers - Reception:", reception, "Houses:", houses.length, "Roads:", roads.length)

    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    if (reception) {
      console.log("Adding reception marker at:", reception)

      const receptionMarker = L.circleMarker([reception.lat, reception.lng], {
        radius: 25,
        fillColor: "#1976D2",
        color: "#fff",
        weight: 4,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindPopup("<b>Reception - Clubhouse</b>")
        .addTo(mapRef.current)

      const receptionText = L.marker([reception.lat, reception.lng], {
        icon: L.divIcon({
          className: "reception-label",
          html: `<div style="
            color: white;
            font-weight: bold;
            font-size: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            white-space: nowrap;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <div>R</div>
            <div style="font-size: 10px; margin-top: -2px;">Clubhouse</div>
          </div>`,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        }),
        zIndexOffset: 3000,
      }).addTo(mapRef.current)

      markersRef.current.push(receptionMarker, receptionText)

      mapRef.current.setView([reception.lat, reception.lng], 18)
    }

    houses.forEach((house) => {
      const houseIcon = L.divIcon({
        className: "custom-icon",
        html: `<div style="
          background-color: #2E7D32; 
          color: white;
          width: 35px; 
          height: 35px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        ">${house.number}</div>`,
        iconSize: [35, 35],
        iconAnchor: [17.5, 17.5],
      })

      const marker = L.marker([house.location.lat, house.location.lng], { icon: houseIcon })
        .bindPopup(`<b>House ${house.number}</b>`)
        .addTo(mapRef.current!)
      markersRef.current.push(marker)
    })

    roads.forEach((road) => {
      const polyline = L.polyline(
        road.points.map((p) => [p.lat, p.lng]),
        { color: "#FF6B6B", weight: 4 },
      ).addTo(mapRef.current!)
      markersRef.current.push(polyline)
    })

    if (currentRoad.length > 0) {
      const polyline = L.polyline(
        currentRoad.map((p) => [p.lat, p.lng]),
        { color: isRecording ? "#00FF00" : "#FFA500", weight: 5, dashArray: isRecording ? "" : "10, 5" },
      ).addTo(mapRef.current!)
      markersRef.current.push(polyline)

      if (!isRecording) {
        currentRoad.forEach((point) => {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 6,
            color: "#FFA500",
            fillColor: "#FFA500",
            fillOpacity: 1,
          }).addTo(mapRef.current!)
          markersRef.current.push(marker)
        })
      }
    }
  }, [reception, houses, roads, currentRoad, isRecording])

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "400px", background: "#e5e7eb" }} />
}
