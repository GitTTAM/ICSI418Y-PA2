import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9000";

const emptySignup = {
  f_name: "",
  l_name: "",
  username: "",
  password: ""
};

const emptyLogin = {
  username: "",
  password: ""
};

const loginWelcomeLines = [
  "The gates are open.",
  "Your legend continues.",
  "Access granted with style.",
  "The scroll recognizes you."
];

async function postJson(path, body) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("Could not connect to the server.");
  }

  const data = await response.json().catch(() => ({
    message: "Server sent an unreadable response."
  }));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function hasEmptyField(values) {
  return Object.values(values).some((value) => value.trim() === "");
}

function messageClassName(message) {
  return ["form-message", message.type, message.stamp ? "stamp" : ""]
    .filter(Boolean)
    .join(" ");
}

function App() {
  const [activeForm, setActiveForm] = useState("signup");
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [signupMessage, setSignupMessage] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  const [usernameHint, setUsernameHint] = useState(null);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [shakingForm, setShakingForm] = useState(null);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    const username = signupForm.username.trim();

    if (!username) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/username/${encodeURIComponent(username)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Username check failed.");
        }

        setUsernameHint({
          type: data.available ? "available" : "taken",
          text: data.available ? "Username looks available." : "Username already exists."
        });
      } catch {
        setUsernameHint({
          type: "neutral",
          text: "Username will be checked when you submit."
        });
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [signupForm.username]);

  function triggerShake(formName) {
    setShakingForm(null);
    window.setTimeout(() => setShakingForm(formName), 0);
    window.setTimeout(() => setShakingForm(null), 450);
  }

  function updateSignupField(event) {
    const { name, value } = event.target;
    setSignupMessage(null);

    if (name === "username") {
      setUsernameHint(
        value.trim()
          ? {
              type: "checking",
              text: "Checking username..."
            }
          : null
      );
    }

    setSignupForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  function updateLoginField(event) {
    const { name, value } = event.target;
    setLoginMessage(null);
    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  async function submitSignup(event) {
    event.preventDefault();
    setSignupMessage(null);

    if (hasEmptyField(signupForm)) {
      triggerShake("signup");
      setSignupMessage({
        type: "error",
        text: "Please fill in all signup fields."
      });
      return;
    }

    setIsSignupLoading(true);

    try {
      const data = await postJson("/signup", signupForm);
      setSignupMessage({
        type: "success",
        text: "ACCOUNT CREATED",
        detail: data.message,
        stamp: true
      });
      setSignupForm(emptySignup);
      setUsernameHint(null);
    } catch (error) {
      triggerShake("signup");
      setSignupMessage({
        type: "error",
        text: error.message
      });
    } finally {
      setIsSignupLoading(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoginMessage(null);

    if (hasEmptyField(loginForm)) {
      triggerShake("login");
      setLoginMessage({
        type: "error",
        text: "Please enter both username and password."
      });
      return;
    }

    setIsLoginLoading(true);

    try {
      const data = await postJson("/login", loginForm);
      const randomWelcome =
        loginWelcomeLines[Math.floor(Math.random() * loginWelcomeLines.length)];
      setLoginMessage({
        type: "success",
        text: `${data.message} ${randomWelcome}`
      });
      setLoginForm(emptyLogin);
    } catch (error) {
      triggerShake("login");
      setLoginMessage({
        type: "error",
        text: error.message
      });
    } finally {
      setIsLoginLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="auth-panel" aria-labelledby="page-title">
        <div className="panel-heading">
          <p className="course-label">ICSI 418Y PA2</p>
          <h1 id="page-title">Login and Signup</h1>
        </div>

        <div className="tabs" role="tablist" aria-label="Authentication forms">
          <button
            className={activeForm === "signup" ? "tab is-active" : "tab"}
            type="button"
            role="tab"
            aria-selected={activeForm === "signup"}
            onClick={() => setActiveForm("signup")}
          >
            Signup
          </button>
          <button
            className={activeForm === "login" ? "tab is-active" : "tab"}
            type="button"
            role="tab"
            aria-selected={activeForm === "login"}
            onClick={() => setActiveForm("login")}
          >
            Login
          </button>
        </div>

        {activeForm === "signup" ? (
          <form
            className={`auth-form ${shakingForm === "signup" ? "is-shaking" : ""}`}
            onSubmit={submitSignup}
          >
            <label>
              <span>
                First Name <span className="required-text">(required)</span>
              </span>
              <input
                className={signupMessage?.type === "error" && signupForm.f_name.trim() === "" ? "input-warning" : ""}
                name="f_name"
                type="text"
                value={signupForm.f_name}
                onChange={updateSignupField}
                autoComplete="given-name"
              />
            </label>

            <label>
              <span>
                Last Name <span className="required-text">(required)</span>
              </span>
              <input
                className={signupMessage?.type === "error" && signupForm.l_name.trim() === "" ? "input-warning" : ""}
                name="l_name"
                type="text"
                value={signupForm.l_name}
                onChange={updateSignupField}
                autoComplete="family-name"
              />
            </label>

            <label>
              <span>
                Username <span className="required-text">(required)</span>
              </span>
              <input
                className={signupMessage?.type === "error" && signupForm.username.trim() === "" ? "input-warning" : ""}
                name="username"
                type="text"
                value={signupForm.username}
                onChange={updateSignupField}
                autoComplete="username"
                placeholder="choose a legendary username"
              />
              {usernameHint ? (
                <span className={`username-hint ${usernameHint.type}`}>
                  {usernameHint.text}
                </span>
              ) : null}
            </label>

            <label>
              <span>
                Password <span className="required-text">(required)</span>
              </span>
              <div className="password-control">
                <input
                  className={signupMessage?.type === "error" && signupForm.password.trim() === "" ? "input-warning" : ""}
                  name="password"
                  type={showSignupPassword ? "text" : "password"}
                  value={signupForm.password}
                  onChange={updateSignupField}
                  autoComplete="new-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowSignupPassword((current) => !current)}
                >
                  {showSignupPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button className="primary-button" type="submit" disabled={isSignupLoading}>
              {isSignupLoading ? "Creating..." : "Create Account"}
            </button>

            {signupMessage ? (
              <p className={messageClassName(signupMessage)} aria-live="polite">
                <span>{signupMessage.text}</span>
                {signupMessage.detail ? <small>{signupMessage.detail}</small> : null}
              </p>
            ) : null}
          </form>
        ) : (
          <form
            className={`auth-form ${shakingForm === "login" ? "is-shaking" : ""}`}
            onSubmit={submitLogin}
          >
            <label>
              <span>
                Username <span className="required-text">(required)</span>
              </span>
              <input
                className={loginMessage?.type === "error" && loginForm.username.trim() === "" ? "input-warning" : ""}
                name="username"
                type="text"
                value={loginForm.username}
                onChange={updateLoginField}
                autoComplete="username"
              />
            </label>

            <label>
              <span>
                Password <span className="required-text">(required)</span>
              </span>
              <div className="password-control">
                <input
                  className={loginMessage?.type === "error" && loginForm.password.trim() === "" ? "input-warning" : ""}
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={updateLoginField}
                  autoComplete="current-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowLoginPassword((current) => !current)}
                >
                  {showLoginPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button className="primary-button" type="submit" disabled={isLoginLoading}>
              {isLoginLoading ? "Checking..." : "Log In"}
            </button>

            {loginMessage ? (
              <p className={messageClassName(loginMessage)} aria-live="polite">
                <span>{loginMessage.text}</span>
              </p>
            ) : null}
          </form>
        )}
      </section>
    </main>
  );
}

export default App;
