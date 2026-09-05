import { useState } from "react"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminLogin from "./pages/AdminLogin"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/AdminDashboard"
import "./App.css"

function App() {
  const [page, setPage] = useState("login")

  // User Signup
  if (page === "signup") {
    return <Signup setPage={setPage} />
  }

  // Admin Login
  if (page === "admin-login") {
    return <AdminLogin setPage={setPage} />
  }

  // Admin Dashboard
  if (page === "admin-dashboard") {
    return <AdminDashboard setPage={setPage} />
  }

  // User Dashboard
  if (page === "dashboard") {
    return <Dashboard setPage={setPage} />
  }

  // Default: User Login
  return <Login setPage={setPage} />
}

export default App