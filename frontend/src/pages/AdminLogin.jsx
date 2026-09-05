import { useState } from "react"

function AdminLogin({ setPage }) {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!userId || !password) {
      alert("Please enter User ID and password.")
      return
    }

    // Temporary frontend navigation.
    // Backend authentication will be connected later.
    setPage("admin-dashboard")
  }

  return (
    <div className="auth-page admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-icon">
          ✦
        </div>

        <h1>Admin Login</h1>

        <p className="auth-subtitle">
          Sign in to access the administration panel
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>User ID</label>

            <input
              type="text"
              placeholder="Enter admin User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-button">
            Login as Admin
          </button>

        </form>

        <button
          className="back-login-button"
          onClick={() => setPage("login")}
        >
          ← Back to normal Login
        </button>

      </div>
    </div>
  )
}

export default AdminLogin