import React, { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceApp, { loadAppState } from "./WorkspaceApp";
import AuthScreen from "./components/AuthScreen";
import { loadCloudWorkspace, saveCloudWorkspace } from "./lib/cloudData";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

function FullscreenMessage({ title, subtitle }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#14140f", padding: 20, color: "#ffffff" }}>
      <div style={{ background: "#1f1f19", border: "1px solid #30302a", borderRadius: 28, padding: 28, width: 520, maxWidth: "100%" }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ color: "#c7c7c2", lineHeight: 1.7 }}>{subtitle}</div>
      </div>
    </div>
  );
}

export default function App() {
  const supabaseEnabled = isSupabaseConfigured;
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);
  const [workspaceState, setWorkspaceState] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const saveStatusTimerRef = useRef(null);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) setAuthError(error.message);
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseEnabled]);

  useEffect(() => {
    if (!supabaseEnabled || !session?.user || !supabase) {
      setWorkspaceState(null);
      return;
    }

    let cancelled = false;
    setWorkspaceLoading(true);
    setSaveStatus("idle");
    setAuthError("");

    loadCloudWorkspace(session.user.id)
      .then((state) => {
        if (cancelled) return;
        setWorkspaceState(state);
        setWorkspaceKey((prev) => prev + 1);
      })
      .catch((error) => {
        if (cancelled) return;
        setAuthError(error.message || "Gagal memuat data user.");
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, session?.user?.id]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) {
        window.clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  const userLabel = useMemo(() => {
    if (!session?.user) return "";
    return session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || "User";
  }, [session?.user]);

  async function handleCloudPersist(nextState) {
    if (!session?.user) return;
    try {
      setSaveStatus("saving");
      await saveCloudWorkspace(session.user.id, nextState);
      setSaveStatus("saved");
      window.clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = window.setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (error) {
      setSaveStatus("error");
      setAuthError(error.message || "Gagal menyimpan data ke cloud.");
    }
  }

  async function handleEmailLogin({ email, password }) {
    if (!supabase) return;
    setAuthActionLoading(true);
    setAuthError("");
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthActionLoading(false);
  }

  async function handleEmailSignup({ email, password }) {
    if (!supabase) return;
    setAuthActionLoading(true);
    setAuthError("");
    setAuthMessage("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage("Pendaftaran berhasil. Cek email untuk verifikasi jika konfirmasi email diaktifkan.");
    }
    setAuthActionLoading(false);
  }

  async function handleGoogleLogin() {
    if (!supabase) return;
    setAuthActionLoading(true);
    setAuthError("");
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
      setAuthActionLoading(false);
    }
  }

  async function handleResetPassword(email) {
    if (!supabase) return;
    setAuthError("");
    setAuthMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage("Link reset password berhasil dikirim. Cek inbox email Anda.");
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    setAuthError("");
    await supabase.auth.signOut();
    setWorkspaceState(null);
  }

  if (!supabaseEnabled) {
    return (
      <WorkspaceApp
        storageMode="local"
        initialState={loadAppState()}
        modeNotice="Supabase belum dikonfigurasi, jadi aplikasi berjalan dalam mode lokal di perangkat ini. Isi `.env` nanti jika ingin mengaktifkan login email/Google dan sinkronisasi cloud."
      />
    );
  }

  if (authLoading) {
    return <FullscreenMessage title="Menyiapkan sesi login" subtitle="Aplikasi sedang memeriksa sesi Supabase dan menyiapkan akses akun Anda." />;
  }

  if (!session) {
    return (
      <AuthScreen
        onEmailLogin={handleEmailLogin}
        onEmailSignup={handleEmailSignup}
        onGoogleLogin={handleGoogleLogin}
        onResetPassword={handleResetPassword}
        loading={authActionLoading}
        message={authMessage}
        error={authError}
      />
    );
  }

  if (workspaceLoading) {
    return <FullscreenMessage title="Memuat workspace" subtitle="Data usaha Anda sedang diambil dari cloud. Tunggu sebentar…" />;
  }

  if (!workspaceState) {
    return <FullscreenMessage title="Gagal memuat workspace" subtitle={authError || "Workspace tidak bisa dimuat dari cloud. Periksa konfigurasi Supabase dan policy RLS Anda."} />;
  }

  return (
    <WorkspaceApp
      key={`${session.user.id}-${workspaceKey}`}
      storageMode="cloud"
      initialState={workspaceState}
      onPersist={handleCloudPersist}
      syncStatus={saveStatus}
      userLabel={userLabel}
      onSignOut={handleSignOut}
      modeNotice="Mode akun aktif. Data Anda tersimpan di cloud Supabase dan dipisahkan otomatis per user yang login dengan email atau Google."
    />
  );
}
