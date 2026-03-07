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
    const [createLoading, setCreateLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Edit User States
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState("user");
    const [editDeactivated, setEditDeactivated] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Confirmation popup state
    const [confirmPopup, setConfirmPopup] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

    // Validation helpers
    const validateName = (name) => {
        if (!name.trim()) return "Name is required";
        if (name.trim().length < 2) return "Name must be at least 2 characters";
        if (name.trim().length > 50) return "Name must be under 50 characters";
        return "";
    };

    const validateEmail = (email) => {
        if (!email.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address";
        // Stricter business-rule validation
        const [localPart, domainPart] = email.split("@");
        if (localPart.length < 3) return "Email username must be at least 3 characters";
        const domainName = domainPart.split(".")[0];
        if (domainName.length < 2) return "Email domain name is too short";
        return "";
    };

    const validatePassword = (password) => {
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters";
        if (!/[a-zA-Z]/.test(password)) return "Must contain at least one letter";
        if (!/[0-9]/.test(password)) return "Must contain at least one number";
        return "";
    };

    const handleNameChange = (val) => {
        setNewName(val);
        setFieldErrors((prev) => ({ ...prev, name: val ? validateName(val) : "" }));
    };

    const handleEmailChange = (val) => {
        setNewEmail(val);
        setFieldErrors((prev) => ({ ...prev, email: val ? validateEmail(val) : "" }));
    };

    const handlePasswordChange = (val) => {
        setNewPassword(val);
        setFieldErrors((prev) => ({ ...prev, password: val ? validatePassword(val) : "" }));
    };

    const isFormValid = newName.trim().length >= 2
        && !validateEmail(newEmail)
        && newEmail.trim().length > 0
        && newPassword.length >= 6
        && /[a-zA-Z]/.test(newPassword)
        && /[0-9]/.test(newPassword);

    async function createUser(e) {
        e.preventDefault();
        setError("");

        // Run all validations
        const errors = {
            name: validateName(newName),
            email: validateEmail(newEmail),
            password: validatePassword(newPassword),
        };
        setFieldErrors(errors);

        if (errors.name || errors.email || errors.password) return;

        setCreateLoading(true);
        try {
            await api.post("/users", {
                name: newName.trim(),
                email: newEmail.trim().toLowerCase(),
                password: newPassword,
                role: newRole,
            });

            setNewName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("user");
            setFieldErrors({});
            loadUsers(); // refresh list
        } catch (err) {
            setError(err?.response?.data?.message || "Create user failed");
        } finally {
            setCreateLoading(false);
        }
    }

    const openEditModal = (u) => {
        setEditingUser(u);
        setEditName(u.name);
        setEditPassword("");
        setEditRole(u.role);
        setEditDeactivated(u.deactivated || false);
        setEditError("");
    };

    const closeEditModal = () => {
        setEditingUser(null);
        setEditName("");
        setEditPassword("");
        setEditRole("user");
        setEditDeactivated(false);
        setEditError("");
    };

    async function handleEditUser(e) {
        e.preventDefault();
        setEditError("");
        setEditLoading(true);

        try {
            const data = { name: editName, role: editRole, deactivated: editDeactivated };
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
                <h2 className="dashboard-title">✨ Tamizhan Intern</h2>

                <div className="user-info">
                    <span className="user-greeting">
                        Hello, <b>{user?.name}</b> <span className="role-badge">{user?.role}</span>
                    </span>
                    <button onClick={() => setShowLogoutConfirm(true)} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <section className="panel">
                    <h3 className="panel-title">Add New User</h3>

                    <form onSubmit={createUser} className="create-form">
                        <div className="validated-field">
                            <input
                                className={`form-input ${fieldErrors.name ? 'input-error' : (newName && !validateName(newName) ? 'input-valid' : '')}`}
                                placeholder="Full Name"
                                value={newName}
                                onChange={(e) => handleNameChange(e.target.value)}
                            />
                            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                        </div>
                        <div className="validated-field">
                            <input
                                className={`form-input ${fieldErrors.email ? 'input-error' : (newEmail && !validateEmail(newEmail) ? 'input-valid' : '')}`}
                                placeholder="Email Address"
                                type="email"
                                value={newEmail}
                                onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>
                        <div className="validated-field">
                            <input
                                className={`form-input ${fieldErrors.password ? 'input-error' : (newPassword && !validatePassword(newPassword) ? 'input-valid' : '')}`}
                                placeholder="Secure Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                            />
                            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                            {newPassword && !fieldErrors.password && (
                                <span className="field-hint">✓ Strong password</span>
                            )}
                        </div>

                        <select
                            className="form-select"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={createLoading || !isFormValid}
                        >
                            {createLoading ? "Creating..." : "Create User Account"}
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
                                                {u._id !== user.id ? (
                                                    <button
                                                        className="role-toggle-btn"
                                                        title={`Click to change to ${u.role === 'admin' ? 'user' : 'admin'}`}
                                                        style={{
                                                            background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : undefined,
                                                            color: u.role === 'admin' ? '#c4b5fd' : undefined,
                                                            borderColor: u.role === 'admin' ? 'rgba(139, 92, 246, 0.3)' : undefined
                                                        }}
                                                        onClick={() => {
                                                            const newRole = u.role === 'admin' ? 'user' : 'admin';
                                                            setConfirmPopup({
                                                                title: "Change Role",
                                                                message: `Change ${u.name}'s role from "${u.role}" to "${newRole}"?`,
                                                                description: newRole === 'admin'
                                                                    ? "This user will gain full admin privileges."
                                                                    : "This user will lose admin privileges.",
                                                                confirmText: "Change Role",
                                                                variant: "info",
                                                                onConfirm: async () => {
                                                                    try {
                                                                        await api.put(`/users/${u._id}`, { name: u.name, role: newRole });
                                                                        loadUsers();
                                                                    } catch (err) {
                                                                        setError(err?.response?.data?.message || "Role update failed");
                                                                    }
                                                                    setConfirmPopup(null);
                                                                },
                                                            });
                                                        }}
                                                    >
                                                        {u.role}
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', opacity: 0.6 }}>
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <span className="role-badge" style={{
                                                        background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : undefined,
                                                        color: u.role === 'admin' ? '#c4b5fd' : undefined,
                                                        borderColor: u.role === 'admin' ? 'rgba(139, 92, 246, 0.3)' : undefined
                                                    }}>
                                                        {u.role}
                                                    </span>
                                                )}
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
                                                            onClick={() => {
                                                                setConfirmPopup({
                                                                    title: "Delete User",
                                                                    message: `Are you sure you want to permanently delete ${u.name}?`,
                                                                    description: "This action cannot be undone. All data associated with this user will be permanently removed.",
                                                                    confirmText: "Delete",
                                                                    variant: "danger",
                                                                    onConfirm: async () => {
                                                                        try {
                                                                            await api.delete(`/users/${u._id}`);
                                                                            loadUsers();
                                                                        } catch (err) {
                                                                            setError(err?.response?.data?.message || "Delete failed");
                                                                        }
                                                                        setConfirmPopup(null);
                                                                    },
                                                                });
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
                                <label className="input-label">Role</label>
                                <select
                                    className="form-select"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
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

                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.8rem' }}>
                                <input
                                    type="checkbox"
                                    id="deactivateUser"
                                    checked={editDeactivated}
                                    onChange={(e) => setEditDeactivated(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="deactivateUser" style={{ color: editDeactivated ? '#ef4444' : '#f8fafc', cursor: 'pointer', fontWeight: '500' }}>
                                    Deactivate User Account
                                </label>
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

            {/* Custom Confirmation Popup */}
            {confirmPopup && (
                <div className="modal-overlay" onClick={() => setConfirmPopup(null)}>
                    <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
                        <div className={`confirm-icon ${confirmPopup.variant}`}>
                            {confirmPopup.variant === 'danger' ? (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            ) : (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <polyline points="17 11 19 13 23 9"></polyline>
                                </svg>
                            )}
                        </div>
                        <h3 className="confirm-title">{confirmPopup.title}</h3>
                        <p className="confirm-message">{confirmPopup.message}</p>
                        {confirmPopup.description && (
                            <p className="confirm-description">{confirmPopup.description}</p>
                        )}
                        <div className="confirm-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setConfirmPopup(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className={confirmPopup.variant === 'danger' ? 'btn-confirm-danger' : 'btn-confirm-info'}
                                onClick={confirmPopup.onConfirm}
                            >
                                {confirmPopup.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay">
                    <div className="logout-modal-content">
                        <div className="modal-icon warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </div>
                        <h3 className="modal-title">Sign Out</h3>
                        <p className="modal-text">Are you sure you want to log out of your account?</p>
                        <div className="modal-actions" style={{ marginTop: '0', width: '100%', display: 'flex' }}>
                            <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={() => {
                                setShowLogoutConfirm(false);
                                onLogout();
                            }}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}