import { useEffect, useRef, useState } from "react";
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

    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);
    const [bellRinging, setBellRinging] = useState(false);

    function addNotification(message, type = "info") {
        const notif = {
            id: Date.now(),
            message,
            type,
            time: new Date(),
            read: false,
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 20));
        setUnreadCount((prev) => prev + 1);
        // Trigger ring animation
        setBellRinging(true);
        setTimeout(() => setBellRinging(false), 900);
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function loadUsers() {
        setError("");
        try {
            const res = await api.get("/users");
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

    const isFormValid =
        newName.trim().length >= 2 &&
        !validateEmail(newEmail) &&
        newEmail.trim().length > 0 &&
        newPassword.length >= 6 &&
        /[a-zA-Z]/.test(newPassword) &&
        /[0-9]/.test(newPassword);

    async function createUser(e) {
        e.preventDefault();
        setError("");

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

            addNotification(`New user "${newName.trim()}" was created successfully.`, "success");

            setNewName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("user");
            setFieldErrors({});
            loadUsers();
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

            addNotification(
                `User "${editingUser.name}" was updated.${editDeactivated ? " (Deactivated)" : ""}`,
                editDeactivated ? "warning" : "info"
            );

            closeEditModal();
            loadUsers();
        } catch (err) {
            setEditError(err?.response?.data?.message || "Failed to update user");
        } finally {
            setEditLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    const formatDate = (dateString) => {
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch {
            return dateString;
        }
    };

    const formatNotifTime = (date) => {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const notifIconMap = {
        success: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        ),
        danger: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        ),
        warning: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ),
        info: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        ),
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2 className="dashboard-title">✨ Tamizhan Intern</h2>

                <div className="user-info">
                    <span className="user-greeting">
                        Hello, <b>{user?.name}</b> <span className="role-badge">{user?.role}</span>
                    </span>

                    {/* Notification Bell */}
                    <div ref={notifRef} style={{ position: "relative", display: "inline-flex" }}>
                        <button
                            onClick={() => {
                                setShowNotifications((v) => !v);
                                if (!showNotifications) setUnreadCount(0);
                            }}
                            title="Notifications"
                            className={`${bellRinging ? "bell-ringing" : "bell-idle"
                                } ${unreadCount > 0 ? "bell-active" : ""}`}
                            style={{
                                position: "relative",
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#94a3b8",
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#f8fafc"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#94a3b8"; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-5px",
                                    right: "-5px",
                                    background: "linear-gradient(135deg,#ef4444,#f97316)",
                                    color: "#fff",
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    minWidth: "17px",
                                    height: "17px",
                                    borderRadius: "9999px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 3px",
                                    border: "2px solid #0f172a",
                                }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div style={{
                                position: "absolute",
                                top: "calc(100% + 10px)",
                                right: 0,
                                width: "320px",
                                background: "#111827",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "16px",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                                zIndex: 9999,
                                overflow: "hidden",
                                animation: "dropdownSlide 0.22s ease",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.2rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f8fafc" }}>Notifications</span>
                                    {notifications.length > 0 && (
                                        <button
                                            style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "0.75rem", cursor: "pointer", padding: "0.2rem 0.4rem", borderRadius: "4px" }}
                                            onClick={() => { setNotifications([]); setUnreadCount(0); }}
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                <div style={{ maxHeight: "340px", overflowY: "auto", padding: "0.5rem 0" }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", padding: "2rem 1rem", color: "#475569", fontSize: "0.85rem" }}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                            </svg>
                                            <span>No notifications yet</span>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const dotColors = { success: "#22c55e", danger: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
                                            const dotBg = { success: "rgba(34,197,94,0.15)", danger: "rgba(239,68,68,0.15)", warning: "rgba(245,158,11,0.15)", info: "rgba(59,130,246,0.15)" };
                                            return (
                                                <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.8rem 1.2rem" }}>
                                                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: dotBg[n.type], color: dotColors[n.type], border: `1px solid ${dotColors[n.type]}40` }}>
                                                        {notifIconMap[n.type]}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
                                                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.45, wordBreak: "break-word" }}>{n.message}</p>
                                                        <span style={{ fontSize: "0.72rem", color: "#475569" }}>{formatNotifTime(n.time)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

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
                                className={`form-input ${fieldErrors.name ? "input-error" : newName && !validateName(newName) ? "input-valid" : ""}`}
                                placeholder="Full Name"
                                value={newName}
                                onChange={(e) => handleNameChange(e.target.value)}
                            />
                            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                        </div>
                        <div className="validated-field">
                            <input
                                className={`form-input ${fieldErrors.email ? "input-error" : newEmail && !validateEmail(newEmail) ? "input-valid" : ""}`}
                                placeholder="Email Address"
                                type="email"
                                value={newEmail}
                                onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>
                        <div className="validated-field">
                            <input
                                className={`form-input ${fieldErrors.password ? "input-error" : newPassword && !validatePassword(newPassword) ? "input-valid" : ""}`}
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

                        <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>

                        <button type="submit" className="btn-primary" disabled={createLoading || !isFormValid}>
                            {createLoading ? "Creating..." : "Create User Account"}
                        </button>
                    </form>
                </section>

                <section className="panel" style={{ overflow: "hidden" }}>
                    <div className="panel-title">
                        <span>Managed Users ({users.length})</span>
                        <button onClick={handleRefresh} className="btn-icon">
                            <svg
                                className={isRefreshing ? "spin-animation" : ""}
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
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
                                    users.map((u) => {
                                        const isSelf = u._id === user.id;
                                        return (
                                            <tr key={u._id}>
                                                <td style={{ fontWeight: 500, color: "#f8fafc" }}>
                                                    <span style={{ padding: "0.25rem 0" }}>{u.name}</span>
                                                </td>
                                                <td>{u.email}</td>
                                                <td>
                                                    {!isSelf ? (
                                                        <button
                                                            className="role-toggle-btn"
                                                            title={`Click to change to ${u.role === "admin" ? "user" : "admin"}`}
                                                            style={{
                                                                background: u.role === "admin" ? "rgba(139, 92, 246, 0.2)" : undefined,
                                                                color: u.role === "admin" ? "#c4b5fd" : undefined,
                                                                borderColor: u.role === "admin" ? "rgba(139, 92, 246, 0.3)" : undefined,
                                                            }}
                                                            onClick={() => {
                                                                const newR = u.role === "admin" ? "user" : "admin";
                                                                setConfirmPopup({
                                                                    title: "Change Role",
                                                                    message: `Change ${u.name}'s role from "${u.role}" to "${newR}"?`,
                                                                    description:
                                                                        newR === "admin"
                                                                            ? "This user will gain full admin privileges."
                                                                            : "This user will lose admin privileges.",
                                                                    confirmText: "Change Role",
                                                                    variant: "info",
                                                                    onConfirm: async () => {
                                                                        try {
                                                                            await api.put(`/users/${u._id}`, { name: u.name, role: newR });
                                                                            addNotification(
                                                                                `${u.name}'s role changed to "${newR}".`,
                                                                                "info"
                                                                            );
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
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", opacity: 0.6 }}>
                                                                <polyline points="6 9 12 15 18 9"></polyline>
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span
                                                            className="role-badge"
                                                            style={{
                                                                background: u.role === "admin" ? "rgba(139, 92, 246, 0.2)" : undefined,
                                                                color: u.role === "admin" ? "#c4b5fd" : undefined,
                                                                borderColor: u.role === "admin" ? "rgba(139, 92, 246, 0.3)" : undefined,
                                                            }}
                                                        >
                                                            {u.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{u.createdAt ? formatDate(u.createdAt) : "-"}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                                        {!isSelf && (
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
                                                                            description:
                                                                                "This action cannot be undone. All data associated with this user will be permanently removed.",
                                                                            confirmText: "Delete",
                                                                            variant: "danger",
                                                                            onConfirm: async () => {
                                                                                try {
                                                                                    await api.delete(`/users/${u._id}`);
                                                                                    addNotification(`User "${u.name}" was deleted.`, "danger");
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Admin Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content edit-modal-content">
                        <h3 className="modal-title" style={{ textAlign: "left", width: "100%" }}>Edit User</h3>

                        {editError && <div className="dash-error" style={{ width: "100%" }}>{editError}</div>}

                        <form onSubmit={handleEditUser} style={{ width: "100%" }}>
                            <div className="edit-form-grid">
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
                                    <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
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
                            </div>

                            <div className="input-group edit-deactivate-row">
                                <input
                                    type="checkbox"
                                    id="deactivateUser"
                                    checked={editDeactivated}
                                    onChange={(e) => setEditDeactivated(e.target.checked)}
                                    style={{ width: "18px", height: "18px", cursor: "pointer", flexShrink: 0 }}
                                />
                                <label
                                    htmlFor="deactivateUser"
                                    style={{ color: editDeactivated ? "#ef4444" : "#f8fafc", cursor: "pointer", fontWeight: "500" }}
                                >
                                    Deactivate User Account
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeEditModal} disabled={editLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ margin: 0 }} disabled={editLoading || !editName}>
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
                            {confirmPopup.variant === "danger" ? (
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
                        {confirmPopup.description && <p className="confirm-description">{confirmPopup.description}</p>}
                        <div className="confirm-actions">
                            <button className="btn-secondary" onClick={() => setConfirmPopup(null)}>
                                Cancel
                            </button>
                            <button
                                className={confirmPopup.variant === "danger" ? "btn-confirm-danger" : "btn-confirm-info"}
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
                        <div className="modal-actions" style={{ marginTop: "0", width: "100%", display: "flex" }}>
                            <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    setShowLogoutConfirm(false);
                                    onLogout();
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}