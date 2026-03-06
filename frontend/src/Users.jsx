import { useEffect, useState } from "react";
import { api } from "./api";
import "./Users.css";

export default function Users({ user, onLogout }) {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("user");

    async function loadUsers() {
        setError("");
        try {
            const res = await api.get("/users"); // protected route
            setUsers(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch users");
        }
    }

    async function createUser(e) {
        e.preventDefault();
        setError("");
        try {
            await api.post("/users", {
                name: newName,
                email: newEmail,
                password: newPassword,
                role: newRole,
            });

            setNewName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("user");
            loadUsers(); // refresh list
        } catch (err) {
            setError(err?.response?.data?.message || "Create user failed");
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUsers();
    }, []);

    // Format date string nicely
    const formatDate = (dateString) => {
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2 className="dashboard-title">⚡ App Dash</h2>

                <div className="user-info">
                    <span className="user-greeting">
                        Hello, <b>{user?.name}</b> <span className="role-badge">{user?.role}</span>
                    </span>
                    <button onClick={onLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <section className="panel">
                    <h3 className="panel-title">Add New User</h3>

                    <form onSubmit={createUser} className="create-form">
                        <input
                            className="form-input"
                            placeholder="Full Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Email Address"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Secure Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />

                        <select
                            className="form-select"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>

                        <button type="submit" className="btn-primary">
                            Create User Account
                        </button>
                    </form>
                </section>

                <section className="panel" style={{ overflow: 'hidden' }}>
                    <div className="panel-title">
                        <span>Managed Users ({users.length})</span>
                        <button onClick={loadUsers} className="btn-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {error && <div className="dash-error">{error}</div>}

                    <div className="table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Registered</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                                            No users found. Loading...
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u._id}>
                                            <td style={{ fontWeight: 500, color: "#f8fafc" }}>{u.name}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className="role-badge" style={{
                                                    background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : undefined,
                                                    color: u.role === 'admin' ? '#c4b5fd' : undefined,
                                                    borderColor: u.role === 'admin' ? 'rgba(139, 92, 246, 0.3)' : undefined
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>{u.createdAt ? formatDate(u.createdAt) : '-'}</td>
                                            <td style={{ textAlign: "right" }}>
                                                {u._id !== user.id && (
                                                    <button
                                                        className="btn-danger"
                                                        onClick={async () => {
                                                            if (!confirm(`Are you sure you want to permanently delete ${u.name}?`)) return;

                                                            try {
                                                                await api.delete(`/users/${u._id}`);
                                                                loadUsers();
                                                            } catch (err) {
                                                                setError(err?.response?.data?.message || "Delete failed");
                                                            }
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}