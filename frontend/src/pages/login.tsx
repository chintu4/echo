import { useRef, type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    navigate("/");
                    return;
                }
            }
            alert("Invalid credentials");
        } catch (err) {
            alert("Failed to log in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-full max-w-sm p-8">
                <div className="flex justify-center mb-8">
                    <Link to="/" aria-label="Go to feed" className="flex items-center gap-2">
                        <svg viewBox="0 0 48 48" aria-hidden="true" className="h-12 w-12 text-white fill-current" role="img" aria-label="Echo logo">
                            <rect x="3" y="3" width="42" height="42" rx="8" fill="#6b46c1" />
                            <path d="M14 17 q8 -7 16 0 v6 q0 2 -2 2 h-4 l-4 2.8 v-2.8 h-6 q-2 0 -2 -2 z" fill="#fff" />
                            <path d="M25 23 q6 -5 12 0" stroke="#6b46c1" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.95" />
                        </svg>
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-white mb-8">Sign in to Echo</h1>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black border border-[#333639] rounded p-4 text-white placeholder-[#71767b] focus:border-[#6b46c1] focus:outline-none transition-colors"
                        placeholder="Email"
                        name="username"
                    />
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black border border-[#333639] rounded p-4 text-white placeholder-[#71767b] focus:border-[#6b46c1] focus:outline-none transition-colors"
                        type="password"
                        name="password"
                        placeholder="Password"
                    />
                    <button
                        type="submit"
                        className="bg-white text-black font-bold rounded-full py-3 hover:bg-[#eff3f4] transition-colors mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Log in'}
                    </button>
                    <button
                        type="button"
                        className="bg-black text-white border border-[#536471] font-bold rounded-full py-3 hover:bg-[#eff3f4]/10 transition-colors"
                    >
                        Forgot password?
                    </button>

                    <div className="text-[#71767b] text-sm mt-4">
                        Don't have an account? <Link to="/signup" className="text-[#6b46c1] cursor-pointer hover:underline">Create account</Link>
                    </div>

                    <div className="text-[#71767b] text-sm mt-2">
                        <Link to="/" className="text-[#6b46c1] hover:underline">Back to feed</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}


