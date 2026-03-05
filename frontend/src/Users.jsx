import { useEffect, useState } from "react";
import { api } from "./api";


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
                <h3 style={{ marginTop: 20 }}>Create User</h3>

                <form onSubmit={createUser} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
                    <input
                        placeholder="Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={{ padding: 10 }}
                    />
                    <input
                        placeholder="Email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={{ padding: 10 }}
                    />
                    <input
                        placeholder="Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ padding: 10 }}
                    />

                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ padding: 10 }}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                    </select>

                    <button type="submit" style={{ padding: 10, cursor: "pointer" }}>
                        Create
                    </button>
                </form>
                <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Action</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>

                                <td>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Delete this user?")) return;

                                            await api.delete(`/users/${u._id}`);
                                            loadUsers(); // refresh list
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}