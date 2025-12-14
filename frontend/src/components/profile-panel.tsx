import { type ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import url from "../config";
export function ProfilePanel({ children }: { children?: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [website, setWebsite] = useState("");
    const [handle, setHandle] = useState("");
    const [joinedAt, setJoinedAt] = useState<string | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const navigate = useNavigate();

    const handleSave = async () => {
        // Check for token
        const token = localStorage.getItem("token");
        if (!token) {
            if (confirm("You must be logged in to edit your profile. Go to login page?")) {
                navigate('/login');
            }
            return;
        }

        try {
            // validate handle format if present: alphanumeric and underscores, 3-30 chars
            if (handle && !/^[a-zA-Z0-9_]{3,30}$/.test(handle)) {
                alert('Handle must be 3-30 characters and contain only letters, numbers, and underscores');
                return;
            }

            const res = await fetch(`${url}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: email || undefined, password: password || undefined, name: name || undefined, handle: handle || undefined, bio: bio || undefined, location: location || undefined, website: website || undefined })
            });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                // If server returns the updated user, apply it immediately; otherwise
                // fall back to refetching the profile.
                if (data.user) {
                    setName(data.user.name || 'User');
                    setEmail(data.user.email || '');
                    setHandle(data.user.handle || '');
                    setBio(data.user.bio || '');
                    setLocation(data.user.location || '');
                    setWebsite(data.user.website || '');
                } else {
                    await fetchProfile();
                }
                alert("Profile updated successfully");
                setOpen(false);
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
            const res = await fetch(`${url}/profile`, { headers });
            if (res.status === 401) {
                return false;
            }
            if (res.ok) {
                const data = await res.json();
                console.debug('Profile fetch response:', data);
                const user = data.user || {};
                console.debug('User handle:', user.handle);
                setName(user.name || 'User');
                setEmail(user.email || '');
                setHandle(user.handle || '');
                setBio(user.bio || '');
                setLocation(user.location || '');
                setWebsite(user.website || '');
                setJoinedAt(user.created_at || null);
                // set posts if present
                setPosts(data.posts || []);
                return true;
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        }
        return false;
    };

    // Open the edit modal and ensure profile is loaded
    const handleOpenProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            if (confirm('You must be logged in to edit your profile. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        const ok = await fetchProfile();
        if (!ok) {
            alert('Unable to load profile. Please log in again.');
            localStorage.removeItem('token');
            navigate('/login', { replace: true });
            return;
        }
        setOpen(true);
    };

    useEffect(() => {
        fetchProfile();

        const onPostCreated = (e: any) => {
            console.debug('postCreated event received, refreshing profile', e?.detail);
            // if a post is included and belongs to this user, optionally prepend it
            fetchProfile();
        };
        window.addEventListener('postCreated', onPostCreated as EventListener);
        return () => window.removeEventListener('postCreated', onPostCreated as EventListener);
    }, []);

    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md px-4 py-3 border-b border-[#2f3336] flex items-center gap-6">
                <div className="hover:bg-[#eff3f4]/10 rounded-full p-2 cursor-pointer transition-colors" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white"><path fill="currentColor" d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold leading-5">{name || 'User'}</h1>
                    <span className="text-[#71767b] text-sm">{posts.length} echoes</span>
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
                                <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Handle (e.g. user123)" className="bg-transparent border border-[#333639] rounded p-3 text-white placeholder-[#71767b] focus:outline-none" />
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
                    <div className="text-[#71767b] mb-2">{handle ? `@${handle}` : '@echo_user'}</div>
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

            <div className="p-4">
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-[#71767b]">No Echoes yet. Be the first to share!</div>
                ) : (
                    <div className="flex flex-col">
                        {posts.map((post) => (
                            <div key={post.id || Math.random()} className="p-4 mb-4 bg-[#0b0c0d] rounded-2xl shadow-sm border border-[#1f1f20] transition-colors flex gap-4 text-left relative">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6b46c1] flex-shrink-0 flex items-center justify-center text-white font-bold">{post.title?.charAt(0) || 'U'}</div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{post.title}</span>
                                                <span className="text-[#71767b] text-sm ml-2">{handle ? `@${handle}` : `@echo_user${post.id}`}</span>
                                            </div>
                                            <div className="text-[#71767b] text-xs mt-1">{post.created_at ? new Date(post.created_at).toLocaleString() : ''}</div>
                                        </div>
                                        <div className="text-[#71767b] text-sm">·</div>
                                    </div>

                                    <p className="text-[#e7e9ea] whitespace-pre-wrap mt-1">{post.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
