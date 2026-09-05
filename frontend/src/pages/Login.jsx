import { useState } from "react"

function Login({ setPage }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email || !password) {
      alert("Please enter email and password")
      return
    }

    console.log("Login details:", {
      email,
      password,
    })

    // Temporary navigation
    setPage("dashboard")
  }

  return (
    <div className="auth-page">

      {/* Admin Button */}
      <button
        className="admin-button"
        onClick={() => setPage("admin-login")}
      >
        Admin
      </button>

      <div className="auth-container">

        {/* Left - AI Illustration */}
        <div className="auth-illustration">

          <div className="ai-placeholder">
            <div className="ai-circle">
              ✨
            </div>

            <h2>AI Assistant</h2>

            <p>
              Your intelligent companion for
              questions, learning and documents.
            </p>
          </div>

        </div>

        {/* Right - Login */}
        <div className="auth-box">

          <h1>Welcome Back</h1>

          <p>
            Login to continue to your AI assistant
          </p>

          <form onSubmit={handleSubmit}>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

            <button type="submit">
              Login
            </button>

          </form>

          <p className="auth-switch">
            Don't have an account?{" "}

            <span
              onClick={() => setPage("signup")}
            >
              Sign Up
            </span>
          </p>

        </div>

      </div>

    </div>
  )
}

export default Login