import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { LoginPage as Login } from "./pages/login";
import { SignupPage as Signup } from "./pages/signup";
import { MainPanel } from "./components/main-panel";
import { LeftPanel } from "./components/left-panel";
import { ProfilePanel } from "./components/profile-panel";
import "./index.css";

function Layout() {
  return (
    <div className="flex justify-center min-h-screen max-w-[1265px] mx-auto">
      {/* Left Sidebar */}
      <div className="w-[88px] xl:w-[275px]">
        <LeftPanel />
      </div>

      {/* Main Feed / Content */}
      <div className="flex-1 max-w-[600px] border-r border-[#2f3336] min-h-screen border-l border-[#2f3336]">
        <Outlet />
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-[350px] pl-8 py-4">
        <div className="sticky top-4 self-start z-20 transform-gpu" style={{ willChange: 'transform' }}>
          <div className="bg-[#16181c] rounded-2xl p-4">
            <h2 className="font-bold text-xl mb-4">What's happening</h2>
            <div className="text-[#71767b]">Trending content would go here</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend/src/App.tsx (replace existing export)
export function App() {
  const getBasename = () => {
    // prefer a <base href="..."> if present (useful for Pages)
    const baseTag = document.querySelector("base")?.getAttribute("href");
    if (baseTag && baseTag !== "/") return baseTag.replace(/\/$/, "");
    // When hosted on GitHub Pages the app may live under a repo subpath
    // (e.g. https://<user>.github.io/echo/). If no <base> is provided, and
    // we're running on github.io, infer the repo segment as the basename.
    // This avoids broken links like `/login` pointing to the site root.
    const host = window.location.hostname || '';
    if (host.endsWith('github.io')) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return `/${parts[0]}`;
    }
    // Default to root for typical local dev or unknown hosts.
    return "/";
  };

  return (
    <BrowserRouter basename={getBasename()}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Layout is anchored at the root and uses nested relative routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPanel />} />
          <Route path="profile" element={<ProfilePanel />} />
        </Route>

        {/* Top-level fallback for any unmatched route (SPA friendly) */}
        <Route path="*" element={<MainPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
