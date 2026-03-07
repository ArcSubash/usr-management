import { useEffect, useState } from "react";
import Login from "./Login";
import Users from "./Users";
import Profile from "./Profile";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // auto-login if token exists
    const saved = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (saved && token) {
      setUser(JSON.parse(saved));
      // Fetch latest user info to sync deactivated status
      fetch("http://localhost:5000/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        })
        .catch(err => console.error("Failed to sync user state:", err));
    }
  }, []);

  function handleLogin(u) {
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  if (user.role === "admin") {
    return <Users user={user} onLogout={handleLogout} />;
  } else {
    return <Profile user={user} onLogout={handleLogout} onUpdateUser={setUser} />;
  }
}