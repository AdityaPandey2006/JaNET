import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

const emptyProfile = {
  name: "",
  username: "",
  email: "",
  department: "",
  year: "",
  intro: ""
};

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [message, setMessage] = useState("Loading profile...");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("janetToken");

      if (!token) {
        setMessage("No token found. Please log in first.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Could not load profile");
          return;
        }

        setProfile({
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          department: data.department || "",
          year: data.year || "",
          intro: data.intro || ""
        });
        setMessage("Profile loaded");
      } catch (error) {
        setMessage(`Request failed: ${error.message}`);
      }
    }

    loadProfile();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("janetToken");
    localStorage.removeItem("janetUser");
    navigate("/login");
  }

  return (
    <div>
      <h1>Profile Page</h1>

      <div>
        <label htmlFor="name">Name</label>
      </div>
      <input id="name" type="text" value={profile.name} readOnly />

      <div>
        <label htmlFor="username">Username</label>
      </div>
      <input id="username" type="text" value={profile.username} readOnly />

      <div>
        <label htmlFor="email">Email</label>
      </div>
      <input id="email" type="text" value={profile.email} readOnly />

      <div>
        <label htmlFor="department">Department</label>
      </div>
      <input id="department" type="text" value={profile.department} readOnly />

      <div>
        <label htmlFor="year">Year</label>
      </div>
      <input id="year" type="text" value={profile.year} readOnly />

      <div>
        <label htmlFor="intro">Intro</label>
      </div>
      <textarea id="intro" value={profile.intro} readOnly />

      <div>
        <button type="button" onClick={() => navigate("/autosuggest")}>
          Auto Search Demo
        </button>
        <button type="button" onClick={() => navigate("/login")}>
          Back to Login
        </button>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <p>{message}</p>
    </div>
  );
}

export default ProfilePage;
