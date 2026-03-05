import { useEffect, useState } from "react";
import { api } from "./api";

export default function Users({ user, onLogout }) {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");

    async function loadUsers() {
        setError("");
        try {
            const res = await api.get("/users"); // protected route
            setUsers(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch users");
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "Arial" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2>Dashboard</h2>
                <button onClick={onLogout} style={{ padding: "8px 12px" }}>
                    Logout
                </button>
            </div>

            <p>
                Logged in as: <b>{user?.name}</b> ({user?.role})
            </p>

            <button onClick={loadUsers} style={{ padding: "8px 12px" }}>
                Refresh Users
            </button>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div style={{ marginTop: 16 }}>
                <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                                <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}