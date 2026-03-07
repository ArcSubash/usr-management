import "./Users.css";

export default function Dashboard({ user }) {
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2 className="dashboard-title">✨ Tamizhan Intern</h2>

                <div className="user-info">
                    <span className="user-greeting">
                        Hello, <b>{user?.name}</b> <span className="role-badge">{user?.role}</span>
                    </span>
                </div>
            </header>

            <main className="dashboard-content" style={{ display: 'block', maxWidth: '800px', margin: '2rem auto' }}>
                <section className="panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
                    <h2 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '2rem' }}>Welcome Back, {user?.name}!</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        This is your primary dashboard. You can access your User Settings, view notifications, and manage your account by clicking the <b>Settings</b> link in the top menu bar.
                    </p>

                    {user?.deactivated && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem 1.5rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            textAlign: 'left'
                        }}>
                            <div>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Account Deactivated</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5' }}>
                                    Your account has been deactivated by an administrator. You can no longer update your profile settings. Contact support for more information.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
