import { useState } from "react"

function Signup({ setPage }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!name || !email || !password) {
      alert("Please fill in all fields")
      return
    }

    console.log("Signup details:", {
      name,
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

        {/* Right - Signup */}
        <div className="auth-box">

          <h1>Create Account</h1>

          <p>
            Sign up to start using your AI assistant
          </p>

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />

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
              Sign Up
            </button>

          </form>

          <p className="auth-switch">
            Already have an account?{" "}

            <span
              onClick={() => setPage("login")}
            >
              Login
            </span>
          </p>

        </div>

      </div>

    </div>
  )
}

export default Signup