import { useState } from "react";
import { api } from "./api";
import "./Profile.css";

export default function Profile({ user, onLogout, onUpdateUser }) {
    const [name, setName] = useState(user.name || "");
    const email = user.email || ""; // Email is no longer a state variable
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");

    const [isEditingName, setIsEditingName] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [modalError, setModalError] = useState("");
    const [modalStatus, setModalStatus] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

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
        setModalError("");
        setModalStatus("");
        setModalLoading(true);

        if (!currentPassword || !password) {
            setModalError("Both current and new passwords are required");
            setModalLoading(false);
            return;
        }

        try {
            const data = {
                name: user.name, // Name must still be sent
                currentPassword,
                password
            };

            await api.put("/users/profile", data);
            setModalStatus("Password changed successfully!");

            // clear password fields on success
            setCurrentPassword("");
            setPassword("");

            // close modal after success
            setTimeout(() => {
                setShowPasswordModal(false);
                setModalStatus("");
            }, 1500);

        } catch (err) {
            setModalError(err?.response?.data?.message || "Failed to change password");
        } finally {
            setModalLoading(false);
        }
    }

    // Format role output nicely
    const displayRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h2 className="profile-title">👤 My Profile</h2>

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
                <section className="profile-panel">
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
                            <span className="detail-label">Account Role</span>
                            <span className="detail-value">
                                <span className="role-badge" style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                                    {displayRole}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="profile-actions" style={{ marginTop: '2rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setShowPasswordModal(true);
                                setModalError("");
                                setModalStatus("");
                                setCurrentPassword("");
                                setPassword("");
                            }}
                        >
                            🔐 Change Password
                        </button>
                    </div>
                </section>
            </main>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Change Password</h3>

                        {modalError && <div className="profile-error">{modalError}</div>}
                        {modalStatus && <div className="profile-success">{modalStatus}</div>}

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

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowPasswordModal(false)}
                                    disabled={modalLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={modalLoading || !currentPassword || !password}
                                >
                                    {modalLoading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
