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
        <div className="bg-[#16181c] rounded-2xl p-4">
          <h2 className="font-bold text-xl mb-4">What's happening</h2>
          <div className="text-[#71767b]">Trending content would go here</div>
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
    // Don't infer basename from current location — visiting a deeper route
    // (like "/login") would incorrectly set basename to that segment and
    // prevent routes from matching. Default to root.
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
