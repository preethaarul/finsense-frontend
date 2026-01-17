import ProfileMenu from "./ProfileMenu";
import "./Topbar.css";
import { FiMenu } from "react-icons/fi";

function Topbar({ toggleSidebar }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FiMenu size={24} />
        </button>
        <div className="brand-logo">
          <div className="logo-circle">F$</div>
          <span className="logo-text">FinSense</span>
        </div>
      </div>
      <ProfileMenu />
    </div>
  );
}

export default Topbar;