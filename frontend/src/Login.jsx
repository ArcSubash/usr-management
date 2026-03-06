import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api";
import "./Login.css";

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);

    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateEmail = (val) => {
        if (!val) return "";
        if (!emailRegex.test(val)) return "Please enter a valid email address";
        // Stricter business-rule validation
        const [localPart, domainPart] = val.split("@");
        if (localPart.length < 3) return "Email username must be at least 3 characters";
        const domainName = domainPart.split(".")[0];
        if (domainName.length < 2) return "Email domain name is too short";
        return "";
    };

    const handleEmailChange = (val) => {
        setEmail(val);
        if (isRegistering) {
            setEmailError(validateEmail(val));
        }
    };

    // Password validation
    const validatePassword = (val) => {
        if (!val) return "";
        if (val.length < 6) return "Password must be at least 6 characters";
        if (!/[a-zA-Z]/.test(val)) return "Must contain at least one letter";
        if (!/[0-9]/.test(val)) return "Must contain at least one number";
        return "";
    };

    const handlePasswordChange = (val) => {
        setPassword(val);
        if (isRegistering) {
            setPasswordError(validatePassword(val));
        }
    };

    // Mouse-tracking state
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [handleMouseMove]);

    // Compute orb transforms from mouse position
    const orbStyle = (factor, baseX, baseY) => {
        const tx = (mousePos.x - 0.5) * factor;
        const ty = (mousePos.y - 0.5) * factor;
        return {
            transform: `translate(${baseX + tx}px, ${baseY + ty}px)`,
        };
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        // Frontend validation before submission (registration mode)
        if (isRegistering) {
            const emailErr = validateEmail(email);
            const passErr = validatePassword(password);
            if (emailErr || passErr) {
                setEmailError(emailErr);
                setPasswordError(passErr);
                return;
            }
        }

        setLoading(true);

        try {
            if (isRegistering) {
                if (!isOtpSent) {
                    // Step 1: Request OTP
                    await api.post("/auth/send-otp", { email });
                    setSuccessMessage("Verification code sent to your email!");
                    setIsOtpSent(true);
                } else {
                    // Step 2: Verify OTP and Register
                    await api.post("/auth/register", { name, email, password, otp });
                    setSuccessMessage("Account created successfully! Please log in.");
                    setIsRegistering(false);
                    setIsOtpSent(false);
                    setOtp("");
                    // We keep the email and password so the user can just click login.
                }
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
        setEmailError("");
        setPasswordError("");
        setSuccessMessage("");
        if (!isRegistering) {
            // When switching to register, clear demo credentials
            setEmail("");
            setPassword("");
        } else {
            // Switching back to login, reset registration flow
            setIsOtpSent(false);
            setOtp("");
        }
    };

    return (
        <div className="login-container" ref={containerRef}>
            {/* Radial glow that follows the mouse */}
            <div
                className="mouse-glow"
                style={{
                    left: `${mousePos.x * 100}%`,
                    top: `${mousePos.y * 100}%`,
                }}
            />

            {/* Floating orbs that react to mouse with parallax depth */}
            <div className="orb orb-1" style={orbStyle(120, 0, 0)} />
            <div className="orb orb-2" style={orbStyle(80, 0, 0)} />
            <div className="orb orb-3" style={orbStyle(200, 0, 0)} />
            <div className="orb orb-4" style={orbStyle(60, 0, 0)} />
            <div className="orb orb-5" style={orbStyle(150, 0, 0)} />

            {/* Grid overlay */}
            <div className="grid-overlay" />

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
                            className={`login-input ${isRegistering && emailError ? 'login-input-error' : (isRegistering && email && !validateEmail(email) ? 'login-input-valid' : '')}`}
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder={isRegistering ? "you@example.com" : "admin@test.com"}
                            required
                        />
                        {isRegistering && emailError && (
                            <span className="login-field-error">{emailError}</span>
                        )}
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            className={`login-input ${isRegistering && passwordError ? 'login-input-error' : (isRegistering && password && !validatePassword(password) ? 'login-input-valid' : '')}`}
                            type="password"
                            value={password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {isRegistering && passwordError && (
                            <span className="login-field-error">{passwordError}</span>
                        )}
                    </div>

                    {isOtpSent && isRegistering && (
                        <div className="input-group">
                            <label className="input-label">Verification OTP</label>
                            <input
                                className="login-input check-otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                maxLength={6}
                                required
                                style={{ letterSpacing: "0.2em", textAlign: "center", fontSize: "1.2rem" }}
                            />
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-button"
                    >
                        {loading
                            ? (isRegistering ? (isOtpSent ? "Verifying..." : "Sending OTP...") : "Logging in...")
                            : (isRegistering ? (isOtpSent ? "Verify & Create Account" : "Sign Up") : "Login")}
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