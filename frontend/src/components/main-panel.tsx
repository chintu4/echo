import { useState, useEffect, useRef, type ReactNode } from "react";
import url from "../../../backend/src/controllers/config";

interface Post {
    id: number;
    title: string;
    body: string;
}

function ThreeDotMenu({ postId, onDeleted }: { postId: number; onDeleted: () => void }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const handleDelete = async (e: any) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        if (!token) {
            if (confirm('You must sign in to delete a post. Go to login?')) window.location.href = '/login';
            return;
        }
        if (!confirm("Delete this post?")) return;
        try {
            const res = await fetch(`${url}/post/${postId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                onDeleted();
            } else {
                alert("Failed to delete post");
            }
        } catch (err) {
            alert("Failed to delete post");
        } finally {
            setOpen(false);
        }
    };

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    return (
        <div ref={wrapperRef} className="absolute top-3 right-3">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className="z-50 h-9 w-9 p-1 rounded-full flex items-center justify-center text-[#71767b] hover:text-white hover:bg-white/6 transition-colors focus:outline-none"
                aria-label="More options"
                title="More options"
            >
                {/* Three dots SVG icon */}
                <svg width="18" height="6" viewBox="0 0 18 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <circle cx="3" cy="3" r="2" fill="currentColor" />
                    <circle cx="9" cy="3" r="2" fill="currentColor" />
                    <circle cx="15" cy="3" r="2" fill="currentColor" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-full right-0 mt-2 bg-[#111214] border border-[#2f3336] rounded shadow-lg w-36 text-sm z-50">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white transition-colors"
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

export function MainPanel({ children }: { children?: ReactNode }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [tweet, setTweet] = useState("");
    const [loading, setLoading] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [edgeAnim, setEdgeAnim] = useState<null | 'top' | 'bottom'>(null);
    const lastEdgeRef = useRef<null | 'top' | 'bottom'>(null);
    const edgeTimeoutRef = useRef<number | null>(null);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${url}/post`);
            const data = await res.json();
            if (data.posts) {
                // Reverse to show newest first if the API doesn't sort
                setPosts(data.posts.reverse());
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    useEffect(() => {
        fetchPosts();

        // Open compose modal if navigated with hash
        if (window.location.hash === "#compose") {
            setComposeOpen(true);
            // clear hash so it doesn't reopen
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, []);

    useEffect(() => {
        // Scroll handler to detect top/bottom edges and trigger small bounce animation
        const THRESHOLD = 60; // px
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const winH = window.innerHeight;
                const docH = document.documentElement.scrollHeight;

                if (scrollTop <= THRESHOLD && lastEdgeRef.current !== 'top') {
                    triggerEdge('top');
                } else if (scrollTop + winH >= docH - THRESHOLD && lastEdgeRef.current !== 'bottom') {
                    triggerEdge('bottom');
                }
                ticking = false;
            });
        };

        const triggerEdge = (pos: 'top' | 'bottom') => {
            lastEdgeRef.current = pos;
            setEdgeAnim(pos);
            if (edgeTimeoutRef.current) window.clearTimeout(edgeTimeoutRef.current);
            // keep it from re-triggering for a short cooldown
            edgeTimeoutRef.current = window.setTimeout(() => {
                lastEdgeRef.current = null;
            }, 700);
            // clear animation state after the CSS animation finishes
            window.setTimeout(() => setEdgeAnim(null), 350);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (edgeTimeoutRef.current) window.clearTimeout(edgeTimeoutRef.current);
        };
    }, []);

    const handleTweet = async () => {
        if (!tweet.trim()) return;
        const token = localStorage.getItem('token');
        if (!token) {
            if (confirm('You must sign in to post. Go to login page?')) window.location.href = '/login';
            return;
        }
        setLoading(true);
        try {
            // Using "User" as title since backend requires it
            await fetch(`${url}/post`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: "User", body: tweet })
            });
            setTweet("");
            fetchPosts();
        } catch (error) {
            console.error("Error posting tweet:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md px-4 py-3 border-b border-[#2f3336]">
                <h1 className="text-xl font-bold">Feed</h1>
            </div>

            {/* Compose CTA (opens modal) */}
            <div className="px-4 py-4 border-b border-[#2f3336] flex gap-4 items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6b46c1] flex-shrink-0" />
                <div className="flex-1">
                    {localStorage.getItem('token') ? (
                        <button
                            onClick={() => setComposeOpen(true)}
                            className="w-full text-left bg-[#0b0c0d] border border-[#222425] rounded-full px-4 py-3 hover:bg-[#0f1113] transition-colors"
                        >
                            What's on your mind? — Share an Echo
                        </button>
                    ) : (
                        <button
                            onClick={() => { if (confirm('Sign in to create an Echo?')) window.location.href = '/login'; }}
                            className="w-full text-left bg-[#0b0c0d] border border-[#222425] rounded-full px-4 py-3 hover:bg-[#0f1113] transition-colors"
                        >
                            Sign in to share an Echo
                        </button>
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            {composeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="bg-[#0f1113] rounded-lg p-6 w-full max-w-xl">
                        <h3 className="text-lg font-bold mb-3">Create Echo</h3>
                        <textarea
                            value={tweet}
                            onChange={(e) => setTweet(e.target.value)}
                            placeholder="Share something interesting..."
                            className="bg-transparent text-lg placeholder-[#71767b] border border-[#222425] rounded p-3 w-full resize-none h-36 outline-none"
                        />
                        <div className="flex justify-between items-center mt-3">
                            <div className="text-sm text-[#71767b]">{tweet.length}/280</div>
                            <div className="flex gap-3">
                                <button onClick={() => { setComposeOpen(false); setTweet(""); }} className="bg-transparent border border-[#536471] text-white font-bold rounded-full px-4 py-1.5 hover:bg-[#eff3f4]/10 transition-colors">Cancel</button>
                                <button onClick={async () => { await handleTweet(); setComposeOpen(false); }} disabled={!tweet.trim()} className="bg-[#6b46c1] text-white font-bold rounded-full px-4 py-1.5 disabled:opacity-50 hover:bg-[#5931a3] transition-colors">Echo</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed */}
            <div className={`flex flex-col ${edgeAnim === 'top' ? 'edge-bounce-top feed-edge-fade-top' : ''} ${edgeAnim === 'bottom' ? 'edge-bounce-bottom feed-edge-fade-bottom' : ''}`}>
                {posts.map((post) => (
                    <div key={post.id || Math.random()} className="p-4 mb-4 bg-[#0b0c0d] rounded-2xl shadow-sm border border-[#1f1f20] transition-colors flex gap-4 text-left relative">
                        {/* Three-dot menu */}
                        <ThreeDotMenu postId={post.id} onDeleted={() => fetchPosts()} />

                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6b46c1] flex-shrink-0 flex items-center justify-center text-white font-bold">{post.title?.charAt(0) || 'U'}</div>
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{post.title}</span>
                                        <span className="text-[#71767b] text-sm ml-2">@echo_user{post.id}</span>
                                    </div>
                                    <div className="text-[#71767b] text-xs mt-1">1 hour ago</div>
                                </div>
                                <div className="text-[#71767b] text-sm">·</div>
                            </div>

                            <p className="text-[#e7e9ea] whitespace-pre-wrap mt-1">{post.body}</p>

                            {/* Actions (Mock) */}
                            <div className="flex gap-6 mt-3 text-[#71767b]">
                                <div className="flex items-center gap-2" title="Discuss">
                                    <button onClick={() => { if (!localStorage.getItem('token')) { if (confirm('Sign in to react?')) window.location.href = '/login'; return; } alert('Discuss not implemented'); }} className="p-1">💭</button>
                                    <span className="text-xs">24</span>
                                </div>
                                <div className="flex items-center gap-2" title="Amplify">
                                    <button onClick={() => { if (!localStorage.getItem('token')) { if (confirm('Sign in to react?')) window.location.href = '/login'; return; } alert('Amplify not implemented'); }} className="p-1">🔊</button>
                                    <span className="text-xs">5</span>
                                </div>
                                <div className="flex items-center gap-2" title="Star">
                                    <button onClick={() => { if (!localStorage.getItem('token')) { if (confirm('Sign in to react?')) window.location.href = '/login'; return; } alert('Star not implemented'); }} className="p-1">⭐</button>
                                    <span className="text-xs">182</span>
                                </div>
                                <div className="flex items-center gap-2" title="Insights">
                                    <button onClick={() => { if (!localStorage.getItem('token')) { if (confirm('Sign in to react?')) window.location.href = '/login'; return; } alert('Insights not implemented'); }} className="p-1">📈</button>
                                    <span className="text-xs">1.2k</span>
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && (
                    <div className="p-8 text-center text-[#71767b]">
                        No Echoes yet. Be the first to share!
                    </div>
                )}
            </div>
        </div>
    );
}

