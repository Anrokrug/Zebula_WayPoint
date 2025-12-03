"use client"

import Link from "next/link"
import { Home, UserCog, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center p-4">
      <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-xl">
            <Home className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-white">Zebula Golf Estate And Spa</h1>
          <p className="mt-2 text-xl text-emerald-50">Property Navigation</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/admin"
            className="flex flex-col items-center gap-3 w-full bg-white hover:bg-emerald-50 text-gray-900 rounded-2xl p-6 shadow-2xl transition-all transform hover:scale-105 hover:shadow-emerald-500/50"
          >
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <UserCog className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">ADMIN MODE</h2>
              <p className="text-sm text-gray-600 mt-1">Set up roads, houses, and reception</p>
            </div>
          </Link>

          <Link
            href="/guest"
            className="flex flex-col items-center gap-3 w-full bg-white hover:bg-emerald-50 text-gray-900 rounded-2xl p-6 shadow-2xl transition-all transform hover:scale-105 hover:shadow-emerald-500/50"
          >
            <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">GUEST MODE</h2>
              <p className="text-sm text-gray-600 mt-1">Find your way to your house</p>
            </div>
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            Welcome to our estate! Select Guest Mode to navigate to your accommodation.
          </p>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-white drop-shadow-md">
            Developed by <span className="font-semibold">Anro Kruger</span>
          </p>
        </div>
      </div>
    </div>
  )
}
