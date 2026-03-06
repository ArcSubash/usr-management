import { useEffect, useState } from "react";
import Login from "./Login";
import Users from "./Users";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // auto-login if token exists
    const saved = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && token) setUser(JSON.parse(saved));
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

  return <Users user={user} onLogout={handleLogout} />;
}