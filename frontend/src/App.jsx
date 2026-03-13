import { useEffect, useState, useRef } from "react";
import Login from "./Login";
import Users from "./Users";
import Profile from "./Profile";
import Footer from "./components/Footer";
import { api } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'deactivated' | 'reactivated' }
  const toastTimerRef = useRef(null);

  const showToast = (message, type) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 6000);
  };

  const syncUser = async (token, currentUser) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.user) {
        // Save fresh token if role changed on the server
        if (data.newToken) {
          localStorage.setItem("token", data.newToken);
        }
        setUser(prev => {
          const changed = JSON.stringify(prev) !== JSON.stringify(data.user);
          if (changed) {
            // Detect deactivation / reactivation change
            if (prev && prev.deactivated !== data.user.deactivated) {
              if (data.user.deactivated) {
                showToast("🚫 Your account has been deactivated by an administrator.", "deactivated");
              } else {
                showToast("✅ Your account has been reactivated! You can now use all features.", "reactivated");
              }
            }
            // Detect role change
            if (prev && prev.role !== data.user.role) {
              if (data.user.role === "admin") {
                showToast("🛡️ Your account has been promoted to Admin. Redirecting to admin dashboard...", "reactivated");
              } else {
                showToast("👤 Your admin privileges have been removed.", "deactivated");
              }
            }
            localStorage.setItem("user", JSON.stringify(data.user));
            return data.user;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to sync user state:", err);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (saved && token) {
      setUser(JSON.parse(saved));
      syncUser(token);
    }
  }, []);

  // Real-time server sent events: listen for status updates instantly
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    const baseUrl = import.meta.env.VITE_API_URL || "https://usr-mng-bknd.onrender.com/api";
    // Construct stream URL (remove /api from baseUrl if it ends with it, as EventSource URL needs to match the route)
    const streamUrl = `${baseUrl.replace(/\/api$/, '')}/api/auth/stream?token=${token}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          syncUser(token);
          window.dispatchEvent(new Event("db-update"));
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [user?.id]);

  function handleLogin(u) {
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Real-time Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          maxWidth: '360px',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.35s ease',
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          border: `1px solid ${toast.type === 'deactivated' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            fontSize: '1.5rem',
            lineHeight: 1,
            flexShrink: 0,
          }}>
            {toast.type === 'deactivated' ? '🚫' : '✅'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '0.25rem',
              color: toast.type === 'deactivated' ? '#ef4444' : '#22c55e',
              fontFamily: 'Inter, sans-serif',
            }}>
              {toast.type === 'deactivated' ? 'Account Deactivated' : 'Account Reactivated'}
            </div>
            <div style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              fontFamily: 'Inter, sans-serif',
            }}>
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <div style={{ flex: 1 }}>
              {user.role === "admin" ? (
                <Users user={user} onLogout={handleLogout} />
              ) : (
                <Profile user={user} onLogout={handleLogout} onUpdateUser={setUser} />
              )}
            </div>
            <Footer />
          </>
        )}
      </main>
    </div>
  );
}