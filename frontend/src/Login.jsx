import { useState } from "react";
import { api } from "./api";
import "./Login.css";

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("admin@test.com");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            if (isRegistering) {
                // Handle Registration
                await api.post("/auth/register", { name, email, password });
                setSuccessMessage("Account created successfully! Please log in.");
                setIsRegistering(false);
                // We keep the email and password so the user can just click login.
            } else {
                // Handle Login
                const res = await api.post("/auth/login", { email, password });
                // save token
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));
                onLogin(res.data.user);
            }
        } catch (err) {
            setError(err?.response?.data?.message || (isRegistering ? "Registration failed" : "Login failed"));
        } finally {
            setLoading(false);
        }
    }

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError("");
        setSuccessMessage("");
        if (!isRegistering) {
            // When switching to register, clear demo credentials
            setEmail("");
            setPassword("");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">{isRegistering ? "Create Account" : "Welcome Back"}</h2>

                {successMessage && <div className="success-message">{successMessage}</div>}

                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <div className="input-group">
                            <label className="input-label">Name</label>
                            <input
                                className="login-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                required={isRegistering}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            className="login-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={isRegistering ? "you@example.com" : "admin@test.com"}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            className="login-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-button"
                    >
                        {loading
                            ? (isRegistering ? "Creating..." : "Logging in...")
                            : (isRegistering ? "Sign Up" : "Login")}
                    </button>

                    <div className="toggle-mode">
                        {isRegistering ? "Already have an account?" : "Don't have an account?"}
                        <button type="button" onClick={toggleMode} className="toggle-button">
                            {isRegistering ? "Log in" : "Sign up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}