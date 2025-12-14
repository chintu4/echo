import { useState } from "react";
import { useNavigate } from "react-router-dom";
import url from "../../../backend/src/controllers/config";

export function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${url}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            if (res.status === 201) {
                alert("Account created. Please sign in.");
                navigate('/login');
                return;
            }
            const data = await res.json().catch(() => ({}));
            alert(data.message || "Failed to create account");
        } catch (err) {
            alert("Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-full max-w-sm p-8">
                <h1 className="text-3xl font-bold text-white mb-8">Create an Echo account</h1>
                <form className="flex flex-col gap-4" onSubmit={handleSignup}>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-black border border-[#333639] rounded p-4 text-white" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="bg-black border border-[#333639] rounded p-4 text-white" />
                    <div className="flex gap-3 mt-4">
                        <button type="submit" disabled={loading} className="bg-[#6b46c1] text-white font-bold rounded-full py-2 px-4">{loading ? 'Creating...' : 'Create account'}</button>
                        <button type="button" onClick={() => navigate('/login')} className="bg-transparent border border-[#536471] text-white font-bold rounded-full py-2 px-4">Back to sign in</button>
                    </div>

                    <div className="text-[#71767b] text-sm mt-2">
                        <a onClick={() => navigate('/')} className="text-[#6b46c1] hover:underline cursor-pointer">Back to feed</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
