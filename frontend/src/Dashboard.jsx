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
                </section>
            </main>
        </div>
    );
}
