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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<Layout />}>
          <Route path="/" element={<MainPanel />} />
          <Route path="/profile" element={<ProfilePanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
