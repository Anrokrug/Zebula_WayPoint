"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

let L: any = null

interface Location {
  lat: number
  lng: number
}

interface Road {
  id?: string
  points: Location[]
}

interface House {
  id?: string
  number: string
  location: Location
  route?: Location[]
}

export default function GuestMapComponent({
  houses,
  roads,
  reception,
  selectedHouse,
}: {
  houses: House[]
  roads: Road[]
  reception: Location | null
  selectedHouse: House | null
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const currentLocationMarkerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const followUserRef = useRef<boolean>(true)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

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

    const map = L.map(mapContainerRef.current).setView([-24.7761, 30.6297], 16)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 20,
    }).addTo(map)

    // When user pans manually, stop auto-following
    map.on("dragstart", () => {
      followUserRef.current = false
    })

    mapRef.current = map

    // Get initial position
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

  // GPS watch - follows user as they drive
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

        // Follow user on map if following is enabled
        if (followUserRef.current && mapRef.current) {
          mapRef.current.setView([newLocation.lat, newLocation.lng], mapRef.current.getZoom(), {
            animate: true,
            duration: 0.5,
          })
        }
      },
      (error) => console.error("GPS error:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [leafletLoaded])

  // When a house is selected, show the saved route and fit bounds
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return
    if (selectedHouse?.route && selectedHouse.route.length > 0) {
      // Briefly show full route then resume following
      followUserRef.current = false
      const bounds = L.latLngBounds(selectedHouse.route.map((p: Location) => [p.lat, p.lng]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true })

      // After 3 seconds, re-enable following user
      setTimeout(() => {
        followUserRef.current = true
      }, 3000)
    }
  }, [selectedHouse, leafletLoaded])

  // Render all static markers and routes
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return

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
        .bindPopup("<strong>CLUBHOUSE</strong><br>Your Starting Point")
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

    // All roads (grey)
    roads.forEach((road) => {
      if (road.points.length > 1) {
        const polyline = L.polyline(
          road.points.map((p: Location) => [p.lat, p.lng]),
          { color: "#757575", weight: 3, opacity: 0.7 }
        ).addTo(mapRef.current)
        markersRef.current.push(polyline)
      }
    })

    // House markers
    houses.forEach((house) => {
      const isSelected = selectedHouse?.number === house.number
      const houseMarker = L.circleMarker([house.location.lat, house.location.lng], {
        radius: isSelected ? 14 : 10,
        fillColor: isSelected ? "#E65100" : "#2E7D32",
        color: "#FFFFFF",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
        zIndexOffset: isSelected ? 900 : 500,
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
      const labelMarker = L.marker([house.location.lat, house.location.lng], {
        icon,
        interactive: false,
      }).addTo(mapRef.current)

      markersRef.current.push(houseMarker, labelMarker)
    })

    // Show selected house saved route in green
    if (selectedHouse?.route && selectedHouse.route.length > 0) {
      const routePolyline = L.polyline(
        selectedHouse.route.map((p: Location) => [p.lat, p.lng]),
        { color: "#00C853", weight: 6, opacity: 0.85 }
      ).addTo(mapRef.current)
      markersRef.current.push(routePolyline)
    }
  }, [houses, roads, reception, selectedHouse, leafletLoaded])

  // Render current location dot separately
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

      {/* Follow Me button */}
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

      {/* Show Route button when house selected */}
      {selectedHouse && (
        <button
          onClick={() => {
            followUserRef.current = false
            if (selectedHouse?.route && selectedHouse.route.length > 0 && mapRef.current) {
              const bounds = L.latLngBounds(selectedHouse.route.map((p: Location) => [p.lat, p.lng]))
              mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true })
            }
          }}
          style={{
            position: "absolute",
            bottom: "60px",
            right: "10px",
            zIndex: 1000,
            background: "#2E7D32",
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
          Show Route
        </button>
      )}
    </div>
  )
}
