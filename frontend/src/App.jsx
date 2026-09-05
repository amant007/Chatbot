import { useState } from "react"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminLogin from "./pages/AdminLogin"
import Dashboard from "./pages/Dashboard"
import "./App.css"

function App() {
  const [page, setPage] = useState("login")

  if (page === "signup") {
    return <Signup setPage={setPage} />
  }

  if (page === "admin-login") {
    return <AdminLogin setPage={setPage} />
  }

  if (page === "dashboard") {
    return <Dashboard setPage={setPage} />
  }

  return <Login setPage={setPage} />
}

export default App