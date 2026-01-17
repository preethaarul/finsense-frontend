import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Topbar from "./Topbar";
import { Outlet, useLocation } from "react-router-dom";
import "./layout.css";

function Layout() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false); // Close sidebar when switching to desktop
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="layout">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <Topbar 
        title={pageTitles[location.pathname]} 
        toggleSidebar={toggleSidebar}
      />
      
      <main className={`content ${isMobileOpen ? 'sidebar-open' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

const pageTitles = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/add": "Add Transaction",
  "/profile": "Profile",
  "/budget": "Budget",
};

export default Layout;