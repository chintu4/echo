import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import url from "../config";

const Logo = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 text-white fill-current" role="img" aria-label="Echo logo">
        <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="#6b46c1" />
        <path d="M6.5 8.5 q4 -3.6 8 0 v3 q0 1 -1 1 h-2 l-2 1.4 v-1.4 h-3 q-1 0 -1 -1 z" fill="#fff" />
        <path d="M11 11.5 q3.3 -2.8 6.6 0" stroke="#6b46c1" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.95" />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7"><g><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z" fill="currentColor"></path></g></svg>
);

const ProfileIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7"><g><path d="M12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4z" fill="currentColor"></path></g></svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7"><g><path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-9v-2h9V5h-9V3h9z" fill="currentColor"></path></g></svg>
);

export function LeftPanel({ children }: { children?: ReactNode }) {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };
    const isLoggedIn = Boolean(localStorage.getItem('token'));

    return (
        <div className="flex flex-col px-2 h-screen overflow-visible">
            {/* Keep the left panel visible while the feed scrolls */}
            <div className="sticky top-4 self-start z-20 transform-gpu" style={{ willChange: 'transform' }}>
                <div className="py-4 xl:ml-3">
                    <Link to="/" className="inline-block p-3 rounded-full hover:bg-[#181818] transition-colors flex items-center gap-2">
                        <Logo />
                        <span className="hidden xl:inline text-xl font-bold text-[#6b46c1]">Echo</span>
                    </Link>
                </div>

                <nav className="flex flex-col gap-2 mt-2">
                <Link to="/" className="flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors xl:pr-8 w-max xl:w-full">
                    <HomeIcon />
                    <span className="hidden xl:inline text-xl font-medium">Feed</span>
                </Link>

                <Link to="/profile" className="flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors xl:pr-8 w-max xl:w-full">
                    <ProfileIcon />
                    <span className="hidden xl:inline text-xl font-medium">Profile</span>
                </Link>

                <div className="mt-auto pt-4">
                    {localStorage.getItem('token') ? (
                        <button onClick={async () => {
                            try {
                                await fetch(`${url}/logout`, { method: 'POST', credentials: 'include' });
                            } catch (e) {
                                // ignore
                            }
                            handleSignOut();
                        }} className="flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors xl:pr-8 w-max xl:w-full text-red-500">
                            <LogoutIcon />
                            <span className="hidden xl:inline text-xl font-medium">Sign out</span>
                        </button>
                    ) : (
                        <Link to="/login" className="flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors xl:pr-8 w-max xl:w-full text-green-400">
                            <LogoutIcon />
                            <span className="hidden xl:inline text-xl font-medium">Sign in</span>
                        </Link>
                    )}
                </div>
                </nav>

                {localStorage.getItem('token') ? (
                    <button onClick={() => { window.location.hash = 'compose'; }} className="hidden xl:inline-block mt-8">
                        <div className="bg-[#6b46c1] text-white rounded-full py-4 px-8 font-bold text-lg hover:bg-[#5931a3] transition-colors shadow-lg text-center">Echo</div>
                    </button>
                ) : (
                    <button onClick={() => { if (confirm('Login to send an Echo!!!')) navigate('/login'); }} className="hidden xl:inline-block mt-8">
                        <div className="bg-[#6b46c1] text-white rounded-full py-4 px-8 font-bold text-lg hover:bg-[#5931a3] transition-colors shadow-lg text-center">Echo</div>
                    </button>
                )}

                {localStorage.getItem('token') ? (
                    <button onClick={() => { window.location.hash = 'compose'; }} className="xl:hidden inline-block mt-4" aria-label="New Echo">
                        <div className="bg-[#6b46c1] text-white rounded-full p-3 h-12 w-12 flex items-center justify-center hover:bg-[#5931a3] transition-colors">
                            <svg viewBox="0 0 24 24" className="h-6 w-6"><path fill="currentColor" d="M12 5v14M5 12h14" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </button>
                ) : (
                    <button onClick={() => { if (confirm('Login to send an Echo!!!')) navigate('/login'); }} className="xl:hidden inline-block mt-4" aria-label="New Echo">
                        <div className="bg-[#6b46c1] text-white rounded-full p-3 h-12 w-12 flex items-center justify-center hover:bg-[#5931a3] transition-colors">
                            <svg viewBox="0 0 24 24" className="h-6 w-6"><path fill="currentColor" d="M12 5v14M5 12h14" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

