import React, { useState } from "react";
import { Mail, KeyRound, Chrome, ArrowRight, ShieldCheck } from "lucide-react";

export default function AuthScreen({ onEmailLogin, onEmailSignup, onGoogleLogin, onResetPassword, loading, message, error }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) return;
    if (mode === "signup") {
      await onEmailSignup({ email, password });
      return;
    }
    await onEmailLogin({ email, password });
  }

  async function handleResetPassword() {
    if (!email || !onResetPassword) return;
    setResetLoading(true);
    try {
      await onResetPassword(email);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#14140f", color: "#ffffff", padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 980, maxWidth: "100%", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #1e1e18 0%, #14140f 100%)", border: "1px solid #30302a", borderRadius: 28, padding: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 9999, background: "#30302a", color: "#beff50", fontSize: 12.5, fontWeight: 600, marginBottom: 18 }}>
            <ShieldCheck size={14} /> Login email atau Google
          </div>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.1 }}>DapurHitung versi akun user</h1>
          <p style={{ color: "#c7c7c2", fontSize: 15, lineHeight: 1.7, marginTop: 14, maxWidth: 520 }}>
            Setiap user bisa masuk dengan email atau Google, lalu melihat data usahanya sendiri dari Android, iPhone, atau laptop.
          </p>
          <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
            {[
              "Data tersimpan di cloud per akun",
              "Bisa login dari banyak device",
              "Tetap bisa dipasang sebagai PWA di home screen",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#f0f0eb" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "#beff50", display: "inline-block" }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#ffffff", color: "#14140f", borderRadius: 28, padding: 28, border: "1px solid #d2d2c8" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 9999,
                padding: "11px 14px",
                background: mode === "login" ? "#14140f" : "#f5f5eb",
                color: mode === "login" ? "#ffffff" : "#14140f",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 9999,
                padding: "11px 14px",
                background: mode === "signup" ? "#14140f" : "#f5f5eb",
                color: mode === "signup" ? "#ffffff" : "#14140f",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: "#6e6e64", fontWeight: 600 }}>Email</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d2d2c8", borderRadius: 12, padding: "0 12px" }}>
                <Mail size={16} color="#6e6e64" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  style={{ border: "none", outline: "none", width: "100%", padding: "14px 0", fontSize: 14, background: "transparent" }}
                />
              </div>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: "#6e6e64", fontWeight: 600 }}>Password</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d2d2c8", borderRadius: 12, padding: "0 12px" }}>
                <KeyRound size={16} color="#6e6e64" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  style={{ border: "none", outline: "none", width: "100%", padding: "14px 0", fontSize: 14, background: "transparent" }}
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "13px 16px",
                background: "#beff50",
                color: "#14140f",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {mode === "signup" ? "Daftar dengan Email" : "Login dengan Email"}
              <ArrowRight size={16} />
            </button>
          </form>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 12,
              border: "1px solid #d2d2c8",
              borderRadius: 9999,
              padding: "13px 16px",
              background: "#ffffff",
              color: "#14140f",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Chrome size={16} />
            Lanjut dengan Google
          </button>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetLoading || !email}
            style={{ marginTop: 12, border: "none", background: "transparent", color: "#14140f", padding: 0, fontSize: 13.5, cursor: !email ? "not-allowed" : "pointer", textAlign: "left" }}
          >
            {resetLoading ? "Mengirim email reset..." : "Lupa password? Kirim email reset"}
          </button>

          {message && <div style={{ marginTop: 14, background: "#f5f5eb", color: "#14140f", borderRadius: 12, padding: 12, fontSize: 13.5 }}>{message}</div>}
          {error && <div style={{ marginTop: 14, background: "#fef3f2", color: "#b42318", borderRadius: 12, padding: 12, fontSize: 13.5 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
