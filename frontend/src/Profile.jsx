import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api";
import "./Profile.css";

export default function Profile({ user, onLogout, onUpdateUser }) {
    const [name, setName] = useState(user.name || "");
    const email = user.email || "";

    // Sync local name state when user prop updates
    useEffect(() => {
        setName(user?.name || "");
    }, [user?.name]);

    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");

    const [isEditingName, setIsEditingName] = useState(false);
    const [activeTab, setActiveTab] = useState("account");

    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [securityError, setSecurityError] = useState("");
    const [securityStatus, setSecurityStatus] = useState("");
    const [securityLoading, setSecurityLoading] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [view, setView] = useState("dashboard");
    const notifRef = useRef(null);

    // Help state
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpMessage, setHelpMessage] = useState("");
    const [helpStatus, setHelpStatus] = useState("");
    const [helpError, setHelpError] = useState("");
    const [helpLoading, setHelpLoading] = useState(false);
    const [myTickets, setMyTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);

    // Close popup on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifPopup(false);
            }
        }
        if (showNotifPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotifPopup]);

    // Activity state
    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityPagination, setActivityPagination] = useState({ page: 1, totalPages: 1 });

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        setNotifLoading(true);
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setNotifLoading(false);
        }
    }, []);

    // Fetch activities
    const fetchActivities = useCallback(async (page = 1) => {
        setActivityLoading(true);
        try {
            const res = await api.get(`/activities?page=${page}&limit=15`);
            setActivities(res.data.activities);
            setActivityPagination(res.data.pagination);
        } catch (err) {
            console.error("Failed to fetch activities", err);
        } finally {
            setActivityLoading(false);
        }
    }, []);

    useEffect(() => {
        const refreshData = () => {
            fetchNotifications();
            fetchActivities();
        };

        refreshData(); // Initial internal load

        window.addEventListener("db-update", refreshData);
        return () => window.removeEventListener("db-update", refreshData);
    }, [fetchNotifications, fetchActivities]);

    // Mark a notification as read
    async function markAsRead(id) {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    }

    // Mark all as read
    async function markAllAsRead() {
        try {
            await api.put("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    }

    // Delete a notification
    async function deleteNotification(id) {
        try {
            await api.delete(`/notifications/${id}`);
            const deleted = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (deleted && !deleted.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    }

    // Clear all notifications
    async function clearAllNotifications() {
        try {
            await api.delete("/notifications");
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to clear notifications", err);
        }
    }

    // Fetch user's support tickets
    const fetchMyTickets = useCallback(async (showSpinner = true) => {
        if (showSpinner) setTicketsLoading(true);
        try {
            const res = await api.get("/support/my-tickets");
            setMyTickets(res.data);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            if (showSpinner) setTicketsLoading(false);
        }
    }, []);

    // Real-time updates via SSE listener in App.jsx
    useEffect(() => {
        const refreshEverything = () => {
            fetchNotifications();
            fetchActivities();
            if (showHelpModal) {
                fetchMyTickets(false);
            }
        };

        window.addEventListener("db-update", refreshEverything);
        return () => window.removeEventListener("db-update", refreshEverything);
    }, [fetchNotifications, fetchActivities, fetchMyTickets, showHelpModal]);

    useEffect(() => {
        if (showHelpModal) {
            fetchMyTickets(true);
        }
    }, [showHelpModal, fetchMyTickets]);

    // Submit Help Message
    async function submitHelpMessage(e) {
        e.preventDefault();
        setHelpError("");
        setHelpStatus("");
        setHelpLoading(true);

        try {
            await api.post("/support", { message: helpMessage });
            setHelpStatus("Your message has been sent successfully!");
            setHelpMessage("");
            fetchMyTickets(false); // Refresh tickets quickly after sending
            setTimeout(() => {
                setHelpStatus("");
            }, 3000);
        } catch (err) {
            setHelpError(err?.response?.data?.message || "Failed to send message");
        } finally {
            setHelpLoading(false);
        }
    }

    async function handleNameUpdate(e) {
        e.preventDefault();
        setError("");
        setStatus("");
        setLoading(true);

        try {
            const data = { name };
            const res = await api.put("/users/profile", data);
            setStatus(res.data.message);

            const updatedUser = res.data.user;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            if (onUpdateUser) onUpdateUser(updatedUser);
            setIsEditingName(false);

            setTimeout(() => setStatus(""), 3000);
            fetchNotifications();
            fetchActivities();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        setSecurityError("");
        setSecurityStatus("");
        setSecurityLoading(true);

        if (!currentPassword || !password) {
            setSecurityError("Both current and new passwords are required");
            setSecurityLoading(false);
            return;
        }

        try {
            const data = {
                name: user.name,
                currentPassword,
                password
            };

            await api.put("/users/profile", data);
            setSecurityStatus("Password changed successfully!");

            setCurrentPassword("");
            setPassword("");

            setTimeout(() => setSecurityStatus(""), 3000);
            fetchNotifications();
            fetchActivities();
        } catch (err) {
            setSecurityError(err?.response?.data?.message || "Failed to change password");
        } finally {
            setSecurityLoading(false);
        }
    }

    const displayRole = user.role?.charAt(0).toUpperCase() + user.role?.slice(1);

    const formatJoinDate = (dateString) => {
        if (!dateString) return "Not Available";
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return "Invalid Date";
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getActivityIcon = (action) => {
        switch (action) {
            case "login": return "🔑";
            case "profile_update": return "✏️";
            case "password_change": return "🔒";
            case "name_change": return "✏️";
            case "account_created": return "🎉";
            case "logout": return "🚪";
            default: return "📋";
        }
    };

    const getActivityColor = (action) => {
        switch (action) {
            case "login": return "#ffffff";
            case "profile_update": return "#cccccc";
            case "password_change": return "#888888";
            case "name_change": return "#cccccc";
            case "account_created": return "#ffffff";
            case "logout": return "#444444";
            default: return "#666666";
        }
    };

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h2 className="profile-title">தamizhan Skills</h2>

                <div className="user-info" style={{ position: "relative" }}>
                    <span className="user-greeting">
                        Hello, <b>{user?.name}</b> <span className="role-badge">{user?.role}</span>
                    </span>

                    {/* Notification Container */}
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <div ref={notifRef} style={{ display: 'flex', position: 'relative' }}>
                            {/* Notification bell in header */}
                            <button
                                className={`notif-bell-btn ${unreadCount > 0 ? "bell-active" : "bell-idle"}`}
                                onClick={() => setShowNotifPopup(!showNotifPopup)}
                                id="notification-bell"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </button>

                            {/* Notification Popup overlay */}
                            {showNotifPopup && (
                                <div className="notif-popup fade-in">
                                    <div className="notif-header">
                                        <h3 className="notif-popup-title">Notification Center</h3>
                                        <div className="notif-actions">
                                            {unreadCount > 0 && (
                                                <button className="notif-action-btn" onClick={markAllAsRead}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    Mark all read
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button className="notif-action-btn danger" onClick={clearAllNotifications}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="notif-popup-content">
                                        {notifLoading ? (
                                            <div className="notif-loading">
                                                <div className="loading-spinner" />
                                                <span>Loading notifications...</span>
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="notif-empty">
                                                <div className="notif-empty-icon">🔔</div>
                                                <h4>All caught up!</h4>
                                                <p>No notifications at the moment.</p>
                                            </div>
                                        ) : (
                                            <div className="notif-list">
                                                {notifications.map((notif) => (
                                                    <div
                                                        key={notif._id}
                                                        className={`notif-item ${!notif.read ? 'unread' : ''}`}
                                                        onClick={() => !notif.read && markAsRead(notif._id)}
                                                    >
                                                        <div className="notif-icon-wrapper">
                                                            <span className="notif-icon">{notif.icon || '🔔'}</span>
                                                        </div>
                                                        <div className="notif-content">
                                                            <div className="notif-title-row">
                                                                <span className="notif-title">{notif.title}</span>
                                                                {!notif.read && <span className="notif-dot" />}
                                                            </div>
                                                            <p className="notif-message">{notif.message}</p>
                                                            <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
                                                        </div>
                                                        <button
                                                            className="notif-delete-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notif._id);
                                                            }}
                                                            title="Delete notification"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings Gear */}
                        <button
                            className={`notif-bell-btn ${view === 'settings' ? 'active-gear' : ''}`}
                            style={{ background: view === 'settings' ? 'rgba(59, 130, 246, 0.15)' : '', color: view === 'settings' ? '#60a5fa' : '' }}
                            onClick={() => setView(view === 'settings' ? 'dashboard' : 'settings')}
                            title="User Settings"
                        >
                            {view === 'settings' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                            )}
                        </button>

                        <button onClick={() => setShowLogoutConfirm(true)} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {view === 'dashboard' ? (
                <main className="profile-content fade-in" style={{ display: 'block', maxWidth: '800px', margin: '2rem auto' }}>
                    <section className="profile-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
                        <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Welcome Back, {user?.name}!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            This is your primary dashboard. You can access your User Settings, view notifications, and manage your account by clicking the <b>Gear Icon</b> in the top right.
                        </p>
                    </section>

                    <section className="profile-panel" style={{ textAlign: 'left', padding: '3rem 2rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontSize: '1.8rem', textAlign: 'center', fontWeight: '600' }}>
                            About Tamizhan Skills
                        </h3>
                        <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>🎓</span>
                            Tamizhan Skills – RISE Program
                        </h3>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Tamizhan Skills</strong> is a Tamil Nadu-based ed-tech initiative that provides affordable skill training, internships, and career guidance for students.
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '1rem' }}>
                                The <strong style={{ color: 'var(--text-primary)' }}>RISE (Real-time Internship & Skill Enhancement)</strong> program is a free virtual internship designed to help students gain hands-on experience through real projects, mentorship, and industry-relevant skills.
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', margin: 0 }}>
                                It aims to bridge the gap between academic learning and practical industry exposure, helping students build portfolios and improve employability.
                            </p>
                        </div>
                    </section>
                </main>
            ) : (
                <main className="profile-content fade-in">
                    <div className="profile-layout">
                        {/* Sidebar */}
                        <nav className="profile-sidebar">
                            <h3 className="sidebar-heading">⚙️ Settings</h3>
                            <button
                                className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`}
                                onClick={() => setActiveTab('account')}
                            >
                                <span className="sidebar-icon">👤</span>
                                My Account
                            </button>
                            <button
                                className={`sidebar-item ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <span className="sidebar-icon">🔐</span>
                                Password & Security
                            </button>

                            <button
                                className={`sidebar-item ${activeTab === 'activity' ? 'active' : ''}`}
                                onClick={() => setActiveTab('activity')}
                            >
                                <span className="sidebar-icon">📋</span>
                                Activity History
                            </button>
                        </nav>

                        {/* Main Content Area */}
                        <div className="profile-main-content">
                            {activeTab === 'account' && (
                                <section className="profile-panel fade-in">
                                    <h3 className="panel-title">Personal Information</h3>

                                    {error && <div className="profile-error">{error}</div>}
                                    {status && <div className="profile-success">{status}</div>}

                                    <div className="profile-details">
                                        <div className="detail-group">
                                            <span className="detail-label">Full Name</span>
                                            {isEditingName && !user.deactivated ? (
                                                <form onSubmit={handleNameUpdate} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <input
                                                        className="form-input"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required
                                                        autoFocus
                                                        style={{ padding: '0.5rem 0.8rem' }}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="btn-primary"
                                                        disabled={loading || !name}
                                                        style={{ padding: '0.5rem 1rem' }}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-secondary"
                                                        onClick={() => {
                                                            setIsEditingName(false);
                                                            setName(user.name);
                                                            setError("");
                                                        }}
                                                        style={{ padding: '0.5rem 1rem' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </form>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="detail-value">{user?.name}</span>
                                                    {!user.deactivated && (
                                                        <button
                                                            onClick={() => setIsEditingName(true)}
                                                            style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="detail-group">
                                            <span className="detail-label">Email Address</span>
                                            <span className="detail-value" style={{ color: '#94a3b8' }}>{email}</span>
                                        </div>

                                        <div className="detail-group">
                                            <span className="detail-label">Account Created</span>
                                            <span className="detail-value" style={{ color: '#94a3b8' }}>{formatJoinDate(user?.createdAt)}</span>
                                        </div>

                                        <div className="detail-group">
                                            <span className="detail-label">Account Role</span>
                                            <span className="detail-value">
                                                <span className="role-badge" style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                                                    {displayRole}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="detail-group">
                                            <span className="detail-label">Account Status</span>
                                            <span className="detail-value">
                                                {user?.deactivated ? (
                                                    <span className="role-badge" style={{
                                                        display: 'inline-block',
                                                        marginTop: '0.2rem',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        borderColor: 'rgba(239, 68, 68, 0.3)'
                                                    }}>
                                                        Inactive
                                                    </span>
                                                ) : (
                                                    <span className="role-badge" style={{
                                                        display: 'inline-block',
                                                        marginTop: '0.2rem',
                                                        background: 'rgba(34, 197, 94, 0.15)',
                                                        color: '#22c55e',
                                                        borderColor: 'rgba(34, 197, 94, 0.3)'
                                                    }}>
                                                        Active
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'security' && (
                                <section className="profile-panel fade-in">
                                    <h3 className="panel-title">Change Password</h3>

                                    {user?.deactivated && (
                                        <div style={{
                                            marginBottom: '1rem',
                                            padding: '1rem',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '8px',
                                            color: '#ef4444',
                                            fontSize: '0.9rem'
                                        }}>
                                            Your account has been deactivated. You cannot change your password.
                                        </div>
                                    )}

                                    {securityError && <div className="profile-error">{securityError}</div>}
                                    {securityStatus && <div className="profile-success">{securityStatus}</div>}

                                    <form onSubmit={handlePasswordChange} className="profile-form">
                                        <div className="input-group">
                                            <label className="input-label">Current Password</label>
                                            <input
                                                className="form-input"
                                                placeholder="Enter your current password"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                                disabled={user?.deactivated}
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label className="input-label">New Password</label>
                                            <input
                                                className="form-input"
                                                placeholder="Enter new password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={user?.deactivated}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={securityLoading || !currentPassword || !password || user?.deactivated}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            {securityLoading ? "Updating..." : "Update Password"}
                                        </button>
                                    </form>
                                </section>
                            )}
                            {activeTab === 'activity' && (
                                <section className="profile-panel fade-in">
                                    <h3 className="panel-title">Activity History</h3>

                                    {activityLoading ? (
                                        <div className="notif-loading">
                                            <div className="loading-spinner" />
                                            <span>Loading activity...</span>
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="notif-empty">
                                            <div className="notif-empty-icon">📋</div>
                                            <h4>No activity yet</h4>
                                            <p>Your activity history will appear here.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="activity-timeline">
                                                {activities.map((activity, index) => (
                                                    <div key={activity._id} className="activity-item">
                                                        <div className="activity-line-wrapper">
                                                            <div
                                                                className="activity-dot"
                                                                style={{ backgroundColor: getActivityColor(activity.action) }}
                                                            />
                                                            {index < activities.length - 1 && (
                                                                <div className="activity-line" />
                                                            )}
                                                        </div>
                                                        <div className="activity-content">
                                                            <div className="activity-header">
                                                                <span className="activity-icon">{getActivityIcon(activity.action)}</span>
                                                                <span className="activity-action">{activity.description}</span>
                                                            </div>
                                                            <span className="activity-time">{formatTimeAgo(activity.createdAt)}</span>
                                                            {activity.ipAddress && (
                                                                <span className="activity-meta">
                                                                    IP: {activity.ipAddress}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pagination */}
                                            {activityPagination.totalPages > 1 && (
                                                <div className="activity-pagination">
                                                    <button
                                                        className="pagination-btn"
                                                        disabled={activityPagination.page <= 1}
                                                        onClick={() => fetchActivities(activityPagination.page - 1)}
                                                    >
                                                        ← Previous
                                                    </button>
                                                    <span className="pagination-info">
                                                        Page {activityPagination.page} of {activityPagination.totalPages}
                                                    </span>
                                                    <button
                                                        className="pagination-btn"
                                                        disabled={activityPagination.page >= activityPagination.totalPages}
                                                        onClick={() => fetchActivities(activityPagination.page + 1)}
                                                    >
                                                        Next →
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>
                </main>
            )
            }

            {/* Logout Confirmation Modal */}
            {
                showLogoutConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content fade-in">
                            <div className="modal-icon warning">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </div>
                            <h3 className="modal-title">Sign Out</h3>
                            <p className="modal-text">Are you sure you want to log out of your account?</p>
                            <div className="modal-actions">
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
                )
            }

            {/* Floating Need Help Button */}
            <button
                className="floating-help-btn fade-in"
                onClick={() => setShowHelpModal(true)}
                title="Need Help?"
            >
                <span className="help-icon">💡</span>
                <span className="help-text">Need Help?</span>
            </button>

            {/* Need Help Modal */}
            {
                showHelpModal && (
                    <div className="modal-overlay" style={{ padding: '1rem' }}>
                        <div className="modal-content fade-in" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', alignItems: 'stretch', textAlign: 'left', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
                                <h3 className="modal-title" style={{ margin: 0 }}>Contact Support</h3>
                                <button className="btn-icon" onClick={() => setShowHelpModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', right: 0 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <p className="modal-text" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
                                Describe your issue or query. Our team will get back to you via your registered email ({email}).
                            </p>

                            {helpError && <div className="profile-error" style={{ width: '100%' }}>{helpError}</div>}
                            {helpStatus && <div className="profile-success" style={{ width: '100%' }}>{helpStatus}</div>}

                            <form onSubmit={submitHelpMessage} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                <textarea
                                    className="form-input"
                                    placeholder="Type your message here to create a new query..."
                                    value={helpMessage}
                                    onChange={(e) => setHelpMessage(e.target.value)}
                                    rows="4"
                                    required
                                    style={{ resize: "vertical", minHeight: "100px", marginBottom: "1rem", width: "100%", boxSizing: "border-box" }}
                                ></textarea>
                                <div className="modal-actions" style={{ marginTop: 0, width: "100%", justifyContent: "flex-end" }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowHelpModal(false);
                                            setHelpMessage("");
                                            setHelpError("");
                                            setHelpStatus("");
                                        }}
                                        disabled={helpLoading}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={helpLoading || !helpMessage.trim()}
                                    >
                                        {helpLoading ? "Sending..." : "Submit Query"}
                                    </button>
                                </div>
                            </form>

                            {/* Ticket History */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Your Past Queries</h4>

                                {ticketsLoading ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>Loading queries...</div>
                                ) : myTickets.length === 0 ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        You haven't submitted any queries yet.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {myTickets.map(ticket => (
                                            <div key={ticket._id} style={{
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${ticket.status === 'open' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                        {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        background: ticket.status === 'open' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                                        color: ticket.status === 'open' ? '#ef4444' : '#22c55e',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                                                    {ticket.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
