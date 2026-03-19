"use client"

import { useEffect, useRef, useState, useCallback } from "react"

let L: any = null

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
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const currentLocationMarkerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const followUserRef = useRef<boolean>(true) // Always follow user by default
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)

  // Load Leaflet dynamically
  useEffect(() => {
    import("leaflet").then((leaflet) => {
      L = leaflet.default || leaflet
      setLeafletLoaded(true)
    })
  }, [])

  // Initialize map once
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([-24.7761, 30.6297], 16)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 20,
    }).addTo(map)

    // When user manually pans the map, stop auto-following temporarily
    map.on("dragstart", () => {
      followUserRef.current = false
    })

    mapRef.current = map

    // Start GPS tracking immediately on map init
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: Location = { lat: position.coords.latitude, lng: position.coords.longitude }
          setCurrentLocation(pos)
          if (followUserRef.current) {
            map.setView([pos.lat, pos.lng], 18)
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      )
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [leafletLoaded])

  // Update click handler
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return
    mapRef.current.off("click")
    mapRef.current.on("click", (e: any) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
  }, [onMapClick, leafletLoaded])

  // GPS watch - follows user continuously
  useEffect(() => {
    if (!leafletLoaded) return
    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(newLocation)

        // Re-enable following if recording
        if (isRecording) {
          followUserRef.current = true
        }

        // Follow user on the map
        if (followUserRef.current && mapRef.current) {
          mapRef.current.setView([newLocation.lat, newLocation.lng], mapRef.current.getZoom(), {
            animate: true,
            duration: 0.5,
          })
        }

        if (isRecording && onLocationUpdate) {
          onLocationUpdate(newLocation)
        }
      },
      (error) => console.error("GPS error:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000, distanceFilter: 2 } as any
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [leafletLoaded, isRecording, onLocationUpdate])

  // Render static markers (reception, houses, roads) - NOT the current location
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return

    // Clear all static markers
    markersRef.current.forEach((m) => {
      try { m.remove() } catch (_) {}
    })
    markersRef.current = []

    // Reception / Clubhouse marker
    if (reception) {
      const receptionMarker = L.circleMarker([reception.lat, reception.lng], {
        radius: 14,
        fillColor: "#1565C0",
        color: "#FFFFFF",
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
        zIndexOffset: 1000,
      })
        .bindPopup("<strong>CLUBHOUSE</strong><br>Reception / Starting Point")
        .addTo(mapRef.current)

      const labelIcon = L.divIcon({
        html: `<div style="
          background: #1565C0;
          color: white;
          font-weight: bold;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 2px solid white;
          white-space: nowrap;
          margin-top: 18px;
          margin-left: -20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        ">Clubhouse</div>`,
        className: "",
        iconSize: [80, 24],
        iconAnchor: [0, 0],
      })
      const labelMarker = L.marker([reception.lat, reception.lng], {
        icon: labelIcon,
        interactive: false,
      }).addTo(mapRef.current)

      markersRef.current.push(receptionMarker, labelMarker)
    }

    // House markers
    houses.forEach((house) => {
      const houseMarker = L.circleMarker([house.location.lat, house.location.lng], {
        radius: 10,
        fillColor: "#2E7D32",
        color: "#FFFFFF",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindPopup(`<strong>House ${house.number}</strong>`)
        .addTo(mapRef.current)

      const icon = L.divIcon({
        html: `<div style="
          color: white;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          line-height: 20px;
        ">${house.number}</div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
      const labelMarker = L.marker([house.location.lat, house.location.lng], { icon, interactive: false }).addTo(mapRef.current)

      markersRef.current.push(houseMarker, labelMarker)
    })

    // Saved roads
    roads.forEach((road) => {
      if (road.points.length > 1) {
        const polyline = L.polyline(
          road.points.map((p: Location) => [p.lat, p.lng]),
          { color: "#E65100", weight: 4, opacity: 0.8 }
        ).addTo(mapRef.current)
        markersRef.current.push(polyline)
      }
    })

    // Current recording road
    if (currentRoad.length > 0) {
      const currentPolyline = L.polyline(
        currentRoad.map((p) => [p.lat, p.lng]),
        { color: isRecording ? "#00C853" : "#FFA000", weight: 5, opacity: 0.9 }
      ).addTo(mapRef.current)
      markersRef.current.push(currentPolyline)
    }
  }, [houses, roads, reception, currentRoad, isRecording, leafletLoaded])

  // Render current location marker separately so it doesn't reset map view
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || !currentLocation) return

    if (currentLocationMarkerRef.current) {
      try { currentLocationMarkerRef.current.remove() } catch (_) {}
    }

    currentLocationMarkerRef.current = L.circleMarker(
      [currentLocation.lat, currentLocation.lng],
      {
        radius: 9,
        fillColor: "#4285F4",
        color: "#FFFFFF",
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
        zIndexOffset: 2000,
      }
    )
      .bindPopup("Your Location")
      .addTo(mapRef.current)
  }, [currentLocation, leafletLoaded])

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "500px" }} />
      {/* Re-center button */}
      <button
        onClick={() => {
          followUserRef.current = true
          if (currentLocation && mapRef.current) {
            mapRef.current.setView([currentLocation.lat, currentLocation.lng], 18, { animate: true })
          }
        }}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "10px",
          zIndex: 1000,
          background: "#1565C0",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 14px",
          fontWeight: "bold",
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        Follow Me
      </button>
    </div>
  )
}
