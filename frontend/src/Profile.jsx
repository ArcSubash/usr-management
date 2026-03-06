import { useState } from "react";
import { api } from "./api";
import "./Profile.css";

export default function Profile({ user, onLogout, onUpdateUser }) {
    const [name, setName] = useState(user.name || "");
    const email = user.email || ""; // Email is no longer a state variable
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");

    const [isEditingName, setIsEditingName] = useState(false);
    const [activeTab, setActiveTab] = useState("account"); // 'account' or 'security'

    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [securityError, setSecurityError] = useState("");
    const [securityStatus, setSecurityStatus] = useState("");
    const [securityLoading, setSecurityLoading] = useState(false);

    async function handleNameUpdate(e) {
        e.preventDefault();
        setError("");
        setStatus("");
        setLoading(true);

        try {
            const data = { name };
            const res = await api.put("/users/profile", data);
            setStatus(res.data.message);

            // update user in localStorage and parent state
            const updatedUser = res.data.user;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            if (onUpdateUser) onUpdateUser(updatedUser);
            setIsEditingName(false);

            // clear success message after 3 seconds
            setTimeout(() => setStatus(""), 3000);
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
                name: user.name, // Name must still be sent
                currentPassword,
                password
            };

            await api.put("/users/profile", data);
            setSecurityStatus("Password changed successfully!");

            // clear password fields on success
            setCurrentPassword("");
            setPassword("");

            setTimeout(() => setSecurityStatus(""), 3000);
        } catch (err) {
            setSecurityError(err?.response?.data?.message || "Failed to change password");
        } finally {
            setSecurityLoading(false);
        }
    }

    // Format role output nicely
    const displayRole = user.role?.charAt(0).toUpperCase() + user.role?.slice(1);

    // Format account creation date
    const formatJoinDate = (dateString) => {
        if (!dateString) return "Not Available";
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return "Invalid Date";
        }
    };

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h2 className="profile-title">👤 User Settings</h2>

                <div className="user-info">
                    <span className="user-greeting">
                        Hello, <b>{user?.name}</b> <span className="role-badge">{user?.role}</span>
                    </span>
                    <button onClick={onLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            <main className="profile-content">
                <div className="profile-layout">
                    {/* Sidebar */}
                    <nav className="profile-sidebar">
                        <button
                            className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveTab('account')}
                        >
                            My Account
                        </button>
                        <button
                            className={`sidebar-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            Password & Security
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
                                        {isEditingName ? (
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
                                                <button
                                                    onClick={() => setIsEditingName(true)}
                                                    style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                                                >
                                                    Edit
                                                </button>
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
                                            <span className="role-badge" style={{
                                                display: 'inline-block',
                                                marginTop: '0.2rem',
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                color: '#34d399',
                                                borderColor: 'rgba(16, 185, 129, 0.3)'
                                            }}>
                                                Active
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'security' && (
                            <section className="profile-panel fade-in">
                                <h3 className="panel-title">Change Password</h3>

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
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={securityLoading || !currentPassword || !password}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        {securityLoading ? "Updating..." : "Update Password"}
                                    </button>
                                </form>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
