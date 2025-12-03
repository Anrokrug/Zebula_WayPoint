"use client"

import { useEffect, useRef, useState } from "react"
import * as google from "google.maps"

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
  const mapRef = useRef<google.maps.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<(google.maps.Marker | google.maps.Polyline)[]>([])
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: -24.7761, lng: 30.6297 },
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      }
    })

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
          map.setCenter(pos)
          map.setZoom(18)
          setCurrentLocation(pos)
        },
        () => {
          console.log("Geolocation failed, using default location")
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      )
    }

    mapRef.current = map
  }, [isLoaded, onMapClick])

  // Watch position for GPS tracking
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

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null)
    }

    const marker = new google.maps.Marker({
      position: currentLocation,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      title: "Your Location",
      zIndex: 1000,
    })

    currentLocationMarkerRef.current = marker
  }, [currentLocation])

  // Update all markers and roads
  useEffect(() => {
    if (!mapRef.current) return

    console.log("[v0] Updating markers - Reception:", reception, "Houses:", houses.length, "Roads:", roads.length)

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (reception) {
      console.log("[v0] Adding reception marker at:", reception)

      const receptionMarker = new google.maps.Marker({
        position: reception,
        map: mapRef.current,
        title: "RECEPTION - CLUBHOUSE",
        label: {
          text: "R",
          color: "white",
          fontSize: "16px",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: "#FF0000",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        zIndex: 5000,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: "<b>RECEPTION - CLUBHOUSE</b><br>Starting Point",
      })
      infoWindow.open(mapRef.current, receptionMarker)

      markersRef.current.push(receptionMarker)

      // Center and zoom to reception
      mapRef.current.setCenter(reception)
      mapRef.current.setZoom(18)

      console.log("[v0] Reception marker added successfully - BIG RED CIRCLE WITH R")
    }

    houses.forEach((house) => {
      const marker = new google.maps.Marker({
        position: house.location,
        map: mapRef.current!,
        title: `House ${house.number}`,
        label: {
          text: house.number,
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: "#2E7D32",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      })

      markersRef.current.push(marker)
    })

    roads.forEach((road) => {
      const polyline = new google.maps.Polyline({
        path: road.points,
        strokeColor: "#FF6B6B",
        strokeWeight: 4,
        map: mapRef.current!,
      })

      markersRef.current.push(polyline)
    })

    if (currentRoad.length > 0) {
      const polyline = new google.maps.Polyline({
        path: currentRoad,
        strokeColor: isRecording ? "#00FF00" : "#FFA500",
        strokeWeight: 5,
        strokeOpacity: 0.8,
        map: mapRef.current!,
      })

      markersRef.current.push(polyline)
    }
  }, [reception, houses, roads, currentRoad, isRecording])

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "400px", background: "#e5e7eb" }} />
}
