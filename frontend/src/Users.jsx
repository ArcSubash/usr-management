import { useEffect, useState } from "react";
import { api } from "./api";
import "./Users.css";

export default function Users({ user, onLogout }) {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");

    // Create User States
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("user");

    // Edit User States
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    async function loadUsers() {
        setError("");
        try {
            const res = await api.get("/users"); // protected route
            setUsers(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch users");
        }
    }

    async function handleRefresh() {
        setIsRefreshing(true);
        await loadUsers();
        setTimeout(() => setIsRefreshing(false), 600);
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

    const openEditModal = (u) => {
        setEditingUser(u);
        setEditName(u.name);
        setEditPassword("");
        setEditError("");
    };

    const closeEditModal = () => {
        setEditingUser(null);
        setEditName("");
        setEditPassword("");
        setEditError("");
    };

    async function handleEditUser(e) {
        e.preventDefault();
        setEditError("");
        setEditLoading(true);

        try {
            const data = { name: editName };
            if (editPassword) data.password = editPassword;

            await api.put(`/users/${editingUser._id}`, data);

            closeEditModal();
            loadUsers();
        } catch (err) {
            setEditError(err?.response?.data?.message || "Failed to update user");
        } finally {
            setEditLoading(false);
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
                        <button onClick={handleRefresh} className="btn-icon">
                            <svg
                                className={isRefreshing ? "spin-animation" : ""}
                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
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
                                            <td style={{ textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                                {u._id !== user.id && (
                                                    <>
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: "0.4rem 0.8rem", color: "#3B82F6", borderColor: "rgba(59, 130, 246, 0.3)" }}
                                                            onClick={() => openEditModal(u)}
                                                        >
                                                            Edit
                                                        </button>
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
                                                    </>
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

            {/* Admin Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Edit User</h3>

                        {editError && <div className="dash-error">{editError}</div>}

                        <form onSubmit={handleEditUser}>
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={editingUser.email}
                                    disabled
                                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input
                                    className="form-input"
                                    placeholder="User's Name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">New Password (optional)</label>
                                <input
                                    className="form-input"
                                    placeholder="Leave blank to keep unchanged"
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeEditModal}
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ margin: 0 }}
                                    disabled={editLoading || !editName}
                                >
                                    {editLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}