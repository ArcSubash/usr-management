import { useEffect, useState, useRef } from "react";
import Login from "./Login";
import Users from "./Users";
import Profile from "./Profile";

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

    const eventSource = new EventSource(`http://localhost:5000/api/auth/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          syncUser(token);
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
    <>
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
          backgroundColor: toast.type === 'deactivated'
            ? 'rgba(20, 8, 8, 0.97)'
            : 'rgba(8, 20, 12, 0.97)',
          border: `1px solid ${toast.type === 'deactivated' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
          backdropFilter: 'blur(12px)',
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
              color: '#94a3b8',
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

      {!user
        ? <Login onLogin={handleLogin} />
        : user.role === "admin"
          ? <Users user={user} onLogout={handleLogout} />
          : <Profile user={user} onLogout={handleLogout} onUpdateUser={setUser} />
      }
    </>
  );
}