"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

/* ── Hexagon rows config ── */
const HEX_ROWS = [12, 11, 12, 11, 12];

export function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      const err = await login(username.trim(), password, rememberMe);
      if (err) setError(err);
      setLoading(false);
    },
    [username, password, login, rememberMe]
  );

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* ── Spinning ring ── */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 500, height: 500,
          top: "50%", left: "50%",
          marginTop: -250, marginLeft: -250,
          borderRadius: "50%",
          border: "10px solid #00a4a2",
          boxShadow: "0 0 0 2px #000, 0 0 0 6px #00fffc",
          opacity: 0.35,
          zIndex: 0,
          animation: "rg-spin 6s linear infinite, rg-ring-entry 3s ease-in forwards",
        }}
      >
        {/* inner ring */}
        <div
          style={{
            position: "absolute", inset: 10,
            borderRadius: "50%",
            border: "36px solid #00fffc",
            overflow: "hidden",
          }}
        >
          {/* cross mask */}
          <div style={{ position:"absolute", top:0, left:0, width:"50%", height:"100%", background:"#000" }} />
          <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"50%", background:"#000" }} />
        </div>
      </div>

      {/* ── Hexagon mesh ── */}
      <div
        className="pointer-events-none absolute w-full"
        style={{
          top: "54%", zIndex: 0,
          color: "#000",
          fontSize: "5.1rem",
          letterSpacing: "-0.2em",
          lineHeight: 0.7,
          textAlign: "center",
          textShadow: "0 0 6px #00fffc",
          transform: "perspective(600px) rotateX(60deg) scale(1.4)",
          animation: "rg-fade-in 4s ease-in forwards",
        }}
      >
        {HEX_ROWS.map((count, ri) => (
          <div key={ri}>
            {"⬢".repeat(count)}
          </div>
        ))}
      </div>

      {/* ── Floating particles (ul/li style) ── */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 4 + i * 2, height: 4 + i * 2,
            background: "#00fffc",
            opacity: 0.15 + i * 0.05,
            top: `${15 + i * 16}%`,
            left: `${8 + i * 18}%`,
            boxShadow: "0 0 8px #00fffc",
            animation: `rg-float ${3 + i}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* ── Logo ── */}
      <div
        className="relative z-10 mb-2 text-center"
        style={{ animation: "rg-fade-in 4s ease-in forwards" }}
      >
        <h1
          className="font-bold italic tracking-widest"
          style={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            color: "#00a4a2",
            animation: "rg-text-glow 2s ease-out infinite alternate",
          }}
        >
          RIDER GARAGE
        </h1>
        <p
          className="mt-1 text-xs tracking-[0.3em] uppercase"
          style={{ color: "#00a4a2", opacity: 0.7 }}
        >
          Fleet Management System
        </p>
      </div>

      {/* ── Login form ── */}
      <div
        className="relative z-10 mt-6"
        style={{ animation: "rg-form-entry 3s ease-in-out forwards" }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center rg-form-box"
          style={{
            background: "linear-gradient(175deg, #002e2d 0%, #0a0a0a 100%)",
            border: "1px solid #00a4a2",
            boxShadow: "0 0 0 1px #001f1f, 0 0 20px rgba(0,255,253,0.25), inset 0 1px 0 rgba(0,255,253,0.08)",
            width: "min(90vw, 380px)",
            padding: "clamp(24px, 4vw, 36px) clamp(24px, 4vw, 32px)",
            transition: "box-shadow 0.6s",
            borderRadius: 16,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLFormElement).style.boxShadow = "0 0 0 1px #001f1f, 0 0 40px rgba(0,255,253,0.45), inset 0 1px 0 rgba(0,255,253,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLFormElement).style.boxShadow = "0 0 0 1px #001f1f, 0 0 20px rgba(0,255,253,0.25), inset 0 1px 0 rgba(0,255,253,0.08)";
          }}
        >
          {/* Username */}
          <div style={{ position: "relative", width: "85%", margin: "0 auto clamp(10px, 2vw, 14px)" }}>
            <span style={{
              position: "absolute", left: 0, top: 0, width: 10, height: 10,
              borderTop: "2px solid #00fffc", borderLeft: "2px solid #00fffc",
              borderTopLeftRadius: 10,
            }} />
            <span style={{
              position: "absolute", right: 0, top: 0, width: 10, height: 10,
              borderTop: "2px solid #00fffc", borderRight: "2px solid #00fffc",
              borderTopRightRadius: 10,
            }} />
            <span style={{
              position: "absolute", left: 0, bottom: 0, width: 10, height: 10,
              borderBottom: "2px solid #00fffc", borderLeft: "2px solid #00fffc",
              borderBottomLeftRadius: 10,
            }} />
            <span style={{
              position: "absolute", right: 0, bottom: 0, width: 10, height: 10,
              borderBottom: "2px solid #00fffc", borderRight: "2px solid #00fffc",
              borderBottomRightRadius: 10,
            }} />
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="USERNAME"
              required
              autoComplete="username"
              className="rg-input"
              style={{
                background: "rgba(0,20,20,0.8)",
                border: "1px solid #1a4a4a",
                borderRadius: 10,
                color: "#aaa",
                display: "block",
                fontFamily: "Cabin, helvetica, arial, sans-serif",
                fontSize: "0.85rem",
                letterSpacing: "0.15em",
                height: 42,
                padding: "0 14px",
                width: "100%",
                outline: "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative", width: "85%", margin: "0 auto 8px" }}>
            <span style={{
              position: "absolute", left: 0, top: 0, width: 10, height: 10,
              borderTop: "2px solid #00fffc", borderLeft: "2px solid #00fffc",
              borderTopLeftRadius: 10,
            }} />
            <span style={{
              position: "absolute", right: 0, top: 0, width: 10, height: 10,
              borderTop: "2px solid #00fffc", borderRight: "2px solid #00fffc",
              borderTopRightRadius: 10,
            }} />
            <span style={{
              position: "absolute", left: 0, bottom: 0, width: 10, height: 10,
              borderBottom: "2px solid #00fffc", borderLeft: "2px solid #00fffc",
              borderBottomLeftRadius: 10,
            }} />
            <span style={{
              position: "absolute", right: 0, bottom: 0, width: 10, height: 10,
              borderBottom: "2px solid #00fffc", borderRight: "2px solid #00fffc",
              borderBottomRightRadius: 10,
            }} />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="PASSWORD"
              required
              autoComplete="current-password"
              className="rg-input"
              style={{
                background: "rgba(0,20,20,0.8)",
                border: "1px solid #1a4a4a",
                borderRadius: 10,
                color: "#aaa",
                display: "block",
                fontFamily: "Cabin, helvetica, arial, sans-serif",
                fontSize: "0.85rem",
                letterSpacing: "0.15em",
                height: 42,
                padding: "0 40px 0 14px",
                width: "100%",
                outline: "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "#00a4a2", cursor: "pointer",
                transition: "color 0.3s",
              }}
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Remember me */}
          <div style={{ width: "100%", margin: "0 auto 8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: "0.75rem",
                color: "#00a4a2",
                letterSpacing: "0.1em",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#00fffc",
                  cursor: "pointer",
                }}
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2"
              style={{
                width: "100%", margin: "0 auto 8px",
                background: "rgba(255,50,50,0.1)",
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 5, padding: "6px 10px",
                color: "#ff8080", fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ position: "relative", width: "60%", margin: "10px auto 0" }}>
            {/* corner accents */}
            <span style={{ position:"absolute", left:0, top:0, width:12, height:12, borderTop:"2px solid #00fffc", borderLeft:"2px solid #00fffc", borderTopLeftRadius:10, zIndex:1 }} />
            <span style={{ position:"absolute", right:0, top:0, width:12, height:12, borderTop:"2px solid #00fffc", borderRight:"2px solid #00fffc", borderTopRightRadius:10, zIndex:1 }} />
            <span style={{ position:"absolute", left:0, bottom:0, width:12, height:12, borderBottom:"2px solid #00fffc", borderLeft:"2px solid #00fffc", borderBottomLeftRadius:10, zIndex:1 }} />
            <span style={{ position:"absolute", right:0, bottom:0, width:12, height:12, borderBottom:"2px solid #00fffc", borderRight:"2px solid #00fffc", borderBottomRightRadius:10, zIndex:1 }} />
            <button
              type="submit"
              disabled={loading}
              className="rg-btn"
              style={{
                background: loading
                  ? "rgba(0,30,30,0.9)"
                  : "linear-gradient(180deg, rgba(0,80,78,0.6) 0%, rgba(0,30,30,0.95) 100%)",
                border: "1px solid #00a4a2",
                borderRadius: 10,
                color: loading ? "#00a4a2" : "#00fffc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "Cabin, helvetica, arial, sans-serif",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.25em",
                height: 44,
                width: "100%",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.4s",
                outline: "none",
                textShadow: "0 0 10px rgba(0,255,252,0.8)",
                boxShadow: "inset 0 1px 0 rgba(0,255,252,0.07), 0 0 12px rgba(0,255,252,0.15)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = "linear-gradient(180deg, rgba(0,120,118,0.7) 0%, rgba(0,50,50,0.95) 100%)";
                  b.style.boxShadow = "inset 0 1px 0 rgba(0,255,252,0.15), 0 0 24px rgba(0,255,252,0.4)";
                  b.style.borderColor = "#00fffc";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = "linear-gradient(180deg, rgba(0,80,78,0.6) 0%, rgba(0,30,30,0.95) 100%)";
                  b.style.boxShadow = "inset 0 1px 0 rgba(0,255,252,0.07), 0 0 12px rgba(0,255,252,0.15)";
                  b.style.borderColor = "#00a4a2";
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 13, height: 13, borderRadius: "50%",
                    border: "2px solid #00a4a2", borderTopColor: "transparent",
                    animation: "rg-spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  AUTHENTICATING…
                </>
              ) : "◈  ACCESS SYSTEM"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&family=Cabin&display=swap');

        @keyframes rg-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rg-ring-entry {
          0%   { opacity: 0; }
          30%  { opacity: 0; }
          100% { opacity: 0.35; }
        }
        @keyframes rg-fade-in {
          0%   { opacity: 0; }
          75%  { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes rg-text-glow {
          0%   { color: #00a4a2; text-shadow: 0 0 10px #000, 0 0 30px #000; }
          100% { color: #00fffc; text-shadow: 0 0 20px rgba(0,255,253,.7), 0 0 10px rgba(0,255,253,.4); }
        }
        @keyframes rg-form-entry {
          0%   { opacity:0; transform: scaleX(0) scaleY(0); }
          20%  { opacity:0; transform: scaleX(0) scaleY(0); }
          55%  { opacity:1; transform: scaleX(0.02) scaleY(1); }
          100% { opacity:1; transform: scaleX(1) scaleY(1); }
        }
        @keyframes rg-float {
          from { transform: translateY(0px); }
          to   { transform: translateY(-14px); }
        }
        .rg-input:focus {
          border-color: #00fffc !important;
          background: rgba(0,30,30,0.95) !important;
          box-shadow: 0 0 0 1px rgba(0,255,252,0.2), 0 0 16px rgba(0,255,252,0.25), inset 0 0 8px rgba(0,255,252,0.06) !important;
          color: #e0ffff !important;
          animation: rg-input-glow 1.2s ease-out infinite alternate !important;
        }
        @keyframes rg-input-glow {
          0%   { box-shadow: 0 0 0 1px rgba(0,255,252,0.15), 0 0 10px rgba(0,255,252,0.2); }
          100% { box-shadow: 0 0 0 1px rgba(0,255,252,0.35), 0 0 24px rgba(0,255,252,0.5), inset 0 0 10px rgba(0,255,252,0.08); }
        }
        /* Small screens adjustments */
        @media (max-width: 380px) {
          .rg-form-box {
            padding: 16px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
