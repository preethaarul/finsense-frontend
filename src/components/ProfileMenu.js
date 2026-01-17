import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

 const storedName = localStorage.getItem("userName");
const userName =
  storedName && storedName !== "undefined" ? storedName : "User";


  return (
    <div style={{ position: "relative" }}>
      {/* PROFILE BUTTON */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          padding: "6px 10px",
          borderRadius: "10px",
          transition: "background 0.2s ease",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 500 }}>
          {userName}
        </span>

        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#4f46e5",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
          }}
        >
          {userName?.charAt(0)?.toUpperCase()}
        </div>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "48px",
            background: "#ffffff",
            borderRadius: "12px",
            width: "160px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          <div
            onClick={() => {
              navigate("/profile");
              setOpen(false);
            }}
            style={menuItemStyle}
          >
            Profile
          </div>

          <div
            onClick={logout}
            style={{ ...menuItemStyle, color: "#dc2626" }}
          >
            Logout
          </div>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  padding: "12px 16px",
  fontSize: "14px",
  cursor: "pointer",
  transition: "background 0.2s ease",
};

export default ProfileMenu;