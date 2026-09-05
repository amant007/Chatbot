import { useMemo, useState } from "react"

const initialUsers = [
  { id: 1, name: "Aman", email: "aman@example.com", role: "USER", status: "Active", joined: "05 Sep 2026" },
  { id: 2, name: "Rajnandini", email: "rajnandini@example.com", role: "USER", status: "Active", joined: "04 Sep 2026" },
  { id: 3, name: "Admin", email: "admin@example.com", role: "ADMIN", status: "Active", joined: "01 Sep 2026" },
  { id: 4, name: "Priya", email: "priya@example.com", role: "USER", status: "Inactive", joined: "28 Aug 2026" },
]

const initialConversations = [
  { id: 101, user: "Aman", title: "Chat about Python", status: "ACTIVE", messages: 12, date: "05 Sep 2026" },
  { id: 102, user: "Rajnandini", title: "Project Discussion", status: "ACTIVE", messages: 8, date: "05 Sep 2026" },
  { id: 103, user: "Priya", title: "Learning React", status: "ARCHIVED", messages: 16, date: "03 Sep 2026" },
  { id: 104, user: "Aman", title: "Document Questions", status: "ACTIVE", messages: 6, date: "02 Sep 2026" },
]

const initialDocuments = [
  { id: 201, filename: "project_report.pdf", user: "Aman", type: "PDF", size: "1.8 MB", status: "COMPLETED", date: "05 Sep 2026" },
  { id: 202, filename: "react_notes.docx", user: "Rajnandini", type: "DOCX", size: "850 KB", status: "PROCESSING", date: "05 Sep 2026" },
  { id: 203, filename: "assignment.pdf", user: "Priya", type: "PDF", size: "2.1 MB", status: "FAILED", date: "03 Sep 2026" },
]

const initialFeedback = [
  { id: 301, user: "Aman", rating: 5, type: "POSITIVE", text: "Very helpful answer.", date: "05 Sep 2026" },
  { id: 302, user: "Rajnandini", rating: 4, type: "POSITIVE", text: "Good explanation.", date: "05 Sep 2026" },
  { id: 303, user: "Priya", rating: 2, type: "NEGATIVE", text: "Answer was not relevant.", date: "03 Sep 2026" },
]

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "conversations", label: "Conversations", icon: "💬" },
  { key: "documents", label: "Documents", icon: "📄" },
  { key: "feedback", label: "Feedback", icon: "★" },
]

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
        <span>{detail}</span>
      </div>
    </div>
  )
}

function StatusBadge({ children }) {
  return (
    <span className={`status-badge status-${String(children).toLowerCase()}`}>
      {children}
    </span>
  )
}

function AdminDashboard({ setPage }) {
  const [section, setSection] = useState("dashboard")
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const stats = useMemo(() => ({
    users: users.length,
    conversations: initialConversations.length,
    messages: initialConversations.reduce(
      (sum, item) => sum + item.messages,
      0
    ),
    documents: initialDocuments.length,
    feedback: initialFeedback.length,
  }), [users])

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleToggleUser = (id) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "Active" ? "Inactive" : "Active",
            }
          : user
      )
    )
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setPage("login")
    }
  }

  const selectSection = (key) => {
    setSection(key)
    setSearch("")
    setSidebarOpen(false)
  }

  const renderDashboard = () => (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your chatbot application.</p>
        </div>

        <button
          className="refresh-btn"
          onClick={() => window.location.reload()}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          icon="👥"
          label="Total Users"
          value={stats.users}
          detail="Registered users"
        />

        <StatCard
          icon="💬"
          label="Conversations"
          value={stats.conversations}
          detail="All conversations"
        />

        <StatCard
          icon="✉️"
          label="Messages"
          value={stats.messages}
          detail="User + AI messages"
        />

        <StatCard
          icon="📄"
          label="Documents"
          value={stats.documents}
          detail="Uploaded documents"
        />

        <StatCard
          icon="★"
          label="Feedback"
          value={stats.feedback}
          detail="User responses"
        />
      </div>

      <div className="admin-panels-grid">
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Users</h2>
              <p>Latest accounts in the system</p>
            </div>

            <button onClick={() => selectSection("users")}>
              View all
            </button>
          </div>

          <div className="mini-user-list">
            {users.slice(0, 4).map((user) => (
              <div className="mini-user" key={user.id}>
                <div className="avatar">
                  {user.name.charAt(0)}
                </div>

                <div className="mini-user-info">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>

                <StatusBadge>{user.status}</StatusBadge>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Feedback</h2>
              <p>Latest user ratings</p>
            </div>

            <button onClick={() => selectSection("feedback")}>
              View all
            </button>
          </div>

          <div className="feedback-summary">
            {initialFeedback.map((item) => (
              <div className="feedback-row" key={item.id}>
                <span>{item.user}</span>

                <span className="stars">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </span>

                <StatusBadge>{item.type}</StatusBadge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )

  const renderUsers = () => (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Users</h1>
          <p>View and manage registered users.</p>
        </div>

        <div className="admin-count">
          {users.length} users
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="table-toolbar">
          <input
            className="table-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or role..."
          />
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <span
                      className={`role-badge role-${user.role.toLowerCase()}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <StatusBadge>{user.status}</StatusBadge>
                  </td>

                  <td>{user.joined}</td>

                  <td>
                    <button
                      className="table-action"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      {user.status === "Active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="table-empty">
              No users found.
            </div>
          )}
        </div>
      </div>
    </>
  )

  const renderConversations = () => (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Conversations</h1>
          <p>Monitor conversations created by users.</p>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Title</th>
                <th>Messages</th>
                <th>Status</th>
                <th>Last Activity</th>
              </tr>
            </thead>

            <tbody>
              {initialConversations.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    <strong>{item.user}</strong>
                  </td>
                  <td>{item.title}</td>
                  <td>{item.messages}</td>
                  <td>
                    <StatusBadge>{item.status}</StatusBadge>
                  </td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )

  const renderDocuments = () => (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Documents</h1>
          <p>Monitor uploaded documents and processing status.</p>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>User</th>
                <th>Type</th>
                <th>Size</th>
                <th>Status</th>
                <th>Uploaded</th>
              </tr>
            </thead>

            <tbody>
              {initialDocuments.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>📄 {item.filename}</strong>
                  </td>
                  <td>{item.user}</td>
                  <td>{item.type}</td>
                  <td>{item.size}</td>
                  <td>
                    <StatusBadge>{item.status}</StatusBadge>
                  </td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )

  const renderFeedback = () => (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Feedback</h1>
          <p>Review ratings and comments from users.</p>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Rating</th>
                <th>Type</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {initialFeedback.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.user}</strong>
                  </td>

                  <td>
                    <span className="stars">
                      {item.rating}/5
                    </span>
                  </td>

                  <td>
                    <StatusBadge>{item.type}</StatusBadge>
                  </td>

                  <td>{item.text}</td>

                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )

  return (
    <div className="admin-layout">
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <div className="admin-brand-mark">✦</div>

          <div>
            <strong>ChatBot</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="admin-nav">
          <p className="nav-label">MAIN MENU</p>

          {menuItems.map((item) => (
            <button
              key={item.key}
              className={section === item.key ? "active" : ""}
              onClick={() => selectSection(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="avatar admin-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>
          </div>

          <button
            className="admin-logout-sidebar"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div className="topbar-title">
            Admin Panel
          </div>

          <div className="topbar-right">
            <span className="admin-online-dot"></span>
            <span>Administrator</span>

            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          {section === "dashboard" && renderDashboard()}
          {section === "users" && renderUsers()}
          {section === "conversations" && renderConversations()}
          {section === "documents" && renderDocuments()}
          {section === "feedback" && renderFeedback()}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard