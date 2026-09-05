import { useState } from "react"

function AdminLogin({ setPage }) {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    setError("")

    if (!userId.trim() || !password) {
      setError("Please enter User ID and Password")
      return
    }

    // Demo frontend login.
    // Later replace this block with a Django API request.
    setPage("admin-dashboard")
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-icon">🛡️</div>
        <h1>Admin Login</h1>
        <p>Login to access the administration area</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-user-id">User ID</label>
          <input
            id="admin-user-id"
            type="text"
            placeholder="Enter admin user ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="username"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="form-error">{error}</div>}

          <button type="submit">Login as Admin</button>
        </form>

        <button className="back-button" onClick={() => setPage("login")}>
          ← Back to User Login
        </button>
      </div>
    </div>
  )
}

export default AdminLogin
