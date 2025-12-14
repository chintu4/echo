import { type ReactNode, useState, useEffect } from "react";

export function ProfilePanel({ children }: { children?: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [website, setWebsite] = useState("");
    const [joinedAt, setJoinedAt] = useState<string | null>(null);
    const postsCountLabel = '0 echoes';

    const handleSave = async () => {
        // Check for token
        const token = localStorage.getItem("token");
        if (!token) {
            if (confirm("You must be logged in to edit your profile. Go to login page?")) {
                window.location.href = "/login";
            }
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: email || undefined, password: password || undefined, name: name || undefined, bio: bio || undefined, location: location || undefined, website: website || undefined })
            });
            if (res.ok) {
                alert("Profile updated successfully");
                setOpen(false);
                fetchProfile();
            } else if (res.status === 401) {
                alert("Unauthorized. Please log in again.");
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || "Failed to update profile");
            }
        } catch (err) {
            alert("Failed to update profile");
        }
    };

    // Fetch profile (returns true on success, false on 401/failed)
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch('http://localhost:5000/profile', { headers });
            if (res.status === 401) {
                return false;
            }
            if (res.ok) {
                const data = await res.json();
                const user = data.user || {};
                setName(user.name || 'User');
                setEmail(user.email || '');
                setBio(user.bio || '');
                setLocation(user.location || '');
                setWebsite(user.website || '');
                setJoinedAt(user.created_at || null);
                return true;
            }
        } catch (err) {
            // ignore
        }
        return false;
    };

    // Open the edit modal and ensure profile is loaded
    const handleOpenProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            if (confirm('You must be logged in to edit your profile. Go to login page?')) {
                window.location.href = '/login';
            }
            return;
        }

        const ok = await fetchProfile();
        if (!ok) {
            alert('Unable to load profile. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }
        setOpen(true);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md px-4 py-3 border-b border-[#2f3336] flex items-center gap-6">
                <div className="hover:bg-[#eff3f4]/10 rounded-full p-2 cursor-pointer transition-colors">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white"><path fill="currentColor" d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold leading-5">{name || 'User'}</h1>
                    <span className="text-[#71767b] text-sm">{postsCountLabel || '0 echoes'}</span>
                </div>
            </div>

            {/* Banner */}
            <div className="h-48 bg-[#333639]"></div>

            {/* Profile Info */}
            <div className="px-4 relative mb-4">
                <div className="absolute -top-16 left-4 border-4 border-black rounded-full">
                    <div className="h-32 w-32 rounded-full bg-slate-500"></div>
                </div>
                <div className="flex justify-end py-4">
                    <button onClick={async () => await handleOpenProfile()} className="border border-[#536471] text-white font-bold rounded-full px-4 py-1.5 hover:bg-[#eff3f4]/10 transition-colors">
                        Edit profile
                    </button>
                </div>

                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="bg-[#0f1113] rounded p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Edit profile</h3>
                            <div className="flex flex-col gap-3">
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none" />
                                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none" />
                                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none resize-none" rows={3} />
                                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none" />
                                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website (https://...)" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none" />
                                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (optional)" type="password" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none" />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => { setOpen(false); }} className="bg-transparent border border-[#536471] text-white font-bold rounded-full px-4 py-1.5 hover:bg-[#eff3f4]/10 transition-colors">Cancel</button>
                                <button onClick={handleSave} className="bg-[#6b46c1] text-white font-bold rounded-full px-4 py-1.5 hover:bg-[#5931a3] transition-colors">Save</button>
                            </div>

                            <div className="text-sm text-[#71767b] mt-3">Note: you must be logged in to update profile. If not logged in, you'll be prompted to sign in.</div>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-bold font-white">{name || 'User'}</h2>
                    <div className="text-[#71767b] mb-2">@echo_user</div>
                    {bio && <div className="text-[#e7e9ea] mb-3">{bio}</div>}
                    <div className="flex gap-4 text-[#71767b] text-sm mb-4">
                        {location && <span>📍 {location}</span>}
                        {website && <span>🔗 <a href={website} className="text-[#6b46c1] hover:underline">{website}</a></span>}
                    </div>
                    <div className="flex gap-4 text-[#71767b] text-sm mb-4">
                        <span><span className="font-bold text-white">142</span> Following</span>
                        <span><span className="font-bold text-white">0</span> Followers</span>
                    </div>
                    {joinedAt && <div className="text-[#71767b] text-xs">Joined: {new Date(joinedAt).toLocaleDateString()}</div>}
                </div>
            </div>

            {/* Cloud Tabs */}
            <div className="flex border-b border-[#2f3336]">
                {['Echoes', 'Replies', 'Highlights', 'Media', 'Stars'].map((tab, i) => (
                    <div key={tab} className="flex-1 hover:bg-[#eff3f4]/10 transition-colors cursor-pointer py-4 flex justify-center relative">
                        <span className={`font-bold ${i === 0 ? 'text-white' : 'text-[#71767b]'}`}>{tab}</span>
                        {i === 0 && <div className="absolute bottom-0 h-1 w-14 bg-[#6b46c1] rounded-full"></div>}
                    </div>
                ))}
            </div>

            <div className="p-8 text-center text-[#71767b]">
                No posts yet.
            </div>
        </div>
    );
}
