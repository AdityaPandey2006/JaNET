import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerDepartment, setRegisterDepartment] = useState("");
  const [registerYear, setRegisterYear] = useState("");
  const [registerIntro, setRegisterIntro] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginMessage("Logging in...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(data.message || "Login failed");
        setLoginLoading(false);
        return;
      }

      localStorage.setItem("janetToken", data.token || "");
      localStorage.setItem("janetUser", JSON.stringify(data.user || {}));
      setLoginMessage("Login successful");
      navigate("/profile");
    } catch (error) {
      setLoginMessage(`Request failed: ${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setRegisterLoading(true);
    setRegisterMessage("Creating user...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: registerName,
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
          department: registerDepartment,
          year: registerYear ? Number(registerYear) : undefined,
          intro: registerIntro
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterMessage(data.message || "Registration failed");
        setRegisterLoading(false);
        return;
      }

      setRegisterMessage(data.message || "Registration successful");
      setEmail(registerEmail);
      setPassword(registerPassword);
      setRegisterName("");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterDepartment("");
      setRegisterYear("");
      setRegisterIntro("");
    } catch (error) {
      setRegisterMessage(`Request failed: ${error.message}`);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div>
      <h1>Login Page</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
        </div>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <div>
          <label htmlFor="password">Password</label>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <div>
          <button type="submit" disabled={loginLoading}>
            {loginLoading ? "Loading..." : "Login"}
          </button>
        </div>
      </form>

      <p>{loginMessage}</p>

      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="registerName">Name</label>
        </div>
        <input
          id="registerName"
          type="text"
          value={registerName}
          onChange={(event) => setRegisterName(event.target.value)}
          required
        />

        <div>
          <label htmlFor="registerUsername">Username</label>
        </div>
        <input
          id="registerUsername"
          type="text"
          value={registerUsername}
          onChange={(event) => setRegisterUsername(event.target.value)}
          required
        />

        <div>
          <label htmlFor="registerEmail">Email</label>
        </div>
        <input
          id="registerEmail"
          type="email"
          value={registerEmail}
          onChange={(event) => setRegisterEmail(event.target.value)}
          required
        />

        <div>
          <label htmlFor="registerPassword">Password</label>
        </div>
        <input
          id="registerPassword"
          type="password"
          value={registerPassword}
          onChange={(event) => setRegisterPassword(event.target.value)}
          required
        />

        <div>
          <label htmlFor="registerDepartment">Department</label>
        </div>
        <input
          id="registerDepartment"
          type="text"
          value={registerDepartment}
          onChange={(event) => setRegisterDepartment(event.target.value)}
        />

        <div>
          <label htmlFor="registerYear">Year</label>
        </div>
        <input
          id="registerYear"
          type="number"
          value={registerYear}
          onChange={(event) => setRegisterYear(event.target.value)}
        />

        <div>
          <label htmlFor="registerIntro">Intro</label>
        </div>
        <textarea
          id="registerIntro"
          value={registerIntro}
          onChange={(event) => setRegisterIntro(event.target.value)}
        />

        <div>
          <button type="submit" disabled={registerLoading}>
            {registerLoading ? "Loading..." : "Register"}
          </button>
        </div>
      </form>

      <p>{registerMessage}</p>

      <div>
        <button type="button" onClick={() => navigate("/autosuggest")}>
          Open Auto Search Demo
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
