import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { logout } from "../utils/auth";
import "./Profile.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");

  /* ---------- FETCH PROFILE ---------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API_BASE}/profile`);

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setStatus("Failed to load profile");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        setStatus("Network error loading profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ---------- CHANGE PASSWORD ---------- */
  const handleChangePassword = async () => {
    setStatus("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setStatus("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await authFetch(
        `${API_BASE}/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setStatus("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setStatus(""), 5000);
      } else {
        setStatus(data.detail || "Failed to update password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      setStatus("Network error. Please try again.");
    }
  };

  /* ---------- DELETE ACCOUNT ---------- */
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "This will permanently delete your account and all financial data. This action cannot be undone.\n\nAre you sure?"
    );

    if (!confirmDelete) return;

    try {
      await authFetch(`${API_BASE}/profile`, {
        method: "DELETE",
      });

      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      alert("Failed to delete account. Please try again.");
    }
  };

  /* ---------- FORMAT DATE ---------- */
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  /* ---------- PASSWORD STRENGTH ---------- */
  const getPasswordStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "weak";
    if (password.length < 10) return "medium";
    return "strong";
  };

  if (loading) {
    return (
      <div className="profile-container">
        <h1>Profile</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <h1>Profile</h1>
        <div className="profile-card">
          <p className="status error">Failed to load profile</p>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1>Profile</h1>

      {/* ---------- ACCOUNT INFO ---------- */}
      <div className="profile-card">
        <h3>Account Information</h3>

        <div className="profile-row">
          <span>Name</span>
          <span>{profile.name || "—"}</span>
        </div>

        <div className="profile-row">
          <span>Email</span>
          <span>{profile.email || "—"}</span>
        </div>

        <div className="profile-row">
          <span>Date Joined</span>
          <span>{formatDate(profile.created_at)}</span>
        </div>
      </div>

      {/* ---------- SECURITY ---------- */}
      <div className="profile-card">
        <h3>Security</h3>

        <div className="password-inputs">
          <div className="input-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {newPassword && (
              <div className={`password-strength ${getPasswordStrength(newPassword)}`}>
                Strength: {getPasswordStrength(newPassword)}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button className="update-password-btn" onClick={handleChangePassword}>
          Update Password
        </button>

        {status && (
          <p className={`status ${status.includes("success") ? "success" : "error"}`}>
            {status}
          </p>
        )}

        <hr />

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* ---------- DANGER ZONE ---------- */}
      <div className="profile-card danger-zone">
        <button
          className="delete-account-btn"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </button>
        <p>This action permanently deletes your account and all data.</p>
      </div>
    </div>
  );
}

export default Profile;
