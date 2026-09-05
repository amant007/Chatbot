import { useState } from "react"

function AdminLogin({ setPage }) {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!userId || !password) {
      alert("Please enter User ID and Password")
      return
    }

    console.log("Admin login details:", {
      userId,
      password,
    })

    // Temporary navigation
    alert("Admin login submitted!")
  }

  return (
    <div className="admin-login-page">

      <div className="admin-login-box">

        <h1>Admin Login</h1>

        <p>
          Login to access the admin area
        </p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(event) =>
              setUserId(event.target.value)
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
            Admin Login
          </button>

        </form>

        <button
          className="back-button"
          onClick={() => setPage("login")}
        >
          ← Back
        </button>

      </div>

    </div>
  )
}

export default AdminLogin