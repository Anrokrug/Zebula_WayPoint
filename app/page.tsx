"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: "absolute", top: "5rem", left: "5rem",
        width: "16rem", height: "16rem",
        background: "rgba(250, 204, 21, 0.15)",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "5rem", right: "5rem",
        width: "24rem", height: "24rem",
        background: "rgba(59, 130, 246, 0.15)",
        borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "28rem", width: "100%", position: "relative", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "5rem", height: "5rem",
            background: "white",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: "2rem", fontWeight: "800", color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)", lineHeight: 1.2,
            marginBottom: "0.5rem",
          }}>
            Zebula Golf Estate
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
            And Spa
          </p>
          <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.75)", marginTop: "0.25rem" }}>
            Property Navigation
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Admin Card */}
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <div style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              display: "flex", alignItems: "center", gap: "1.25rem",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              border: "2px solid transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(0,0,0,0.2)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 40px rgba(0,0,0,0.15)"
            }}>
              <div style={{
                width: "3.5rem", height: "3.5rem", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.4)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/>
                  <path d="M19 11l2 2-4 4-2-2"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#111827", margin: 0 }}>
                  ADMIN MODE
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.2rem 0 0" }}>
                  Set up roads, houses &amp; reception
                </p>
              </div>
            </div>
          </Link>

          {/* Guest Card */}
          <Link href="/guest" style={{ textDecoration: "none" }}>
            <div style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              display: "flex", alignItems: "center", gap: "1.25rem",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(0,0,0,0.2)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 40px rgba(0,0,0,0.15)"
            }}>
              <div style={{
                width: "3.5rem", height: "3.5rem", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #059669, #0d9488)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 15px rgba(5, 150, 105, 0.4)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#111827", margin: 0 }}>
                  GUEST MODE
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.2rem 0 0" }}>
                  Find your way to your house
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Welcome box */}
        <div style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "1rem",
          padding: "1rem 1.5rem",
          marginTop: "1.5rem",
          border: "1px solid rgba(255,255,255,0.3)",
        }}>
          <p style={{ color: "white", fontSize: "0.9rem", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            Welcome to Zebula Golf Estate And Spa! Select Guest Mode to navigate to your accommodation.
          </p>
        </div>

        {/* Developer credit */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", marginTop: "1.5rem" }}>
          Developed by <span style={{ fontWeight: "700", color: "white" }}>Anro Kruger</span>
        </p>
      </div>
    </div>
  )
}
