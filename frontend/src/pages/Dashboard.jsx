import { useState } from "react"

function Dashboard({ setPage }) {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "Chat about Python",
      status: "ACTIVE",
      messages: [],
    },
    {
      id: 2,
      title: "Project Discussion",
      status: "ACTIVE",
      messages: [],
    },
    {
      id: 3,
      title: "Learning React",
      status: "ACTIVE",
      messages: [],
    },
  ])

  // No chat selected when dashboard opens
  const [activeChatId, setActiveChatId] = useState(null)

  const [message, setMessage] = useState("")

  // New chat popup
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState("")

  const [showArchived, setShowArchived] = useState(false)

  // Document states
  const [document, setDocument] = useState(null)
  const [documentStatus, setDocumentStatus] = useState("")
  const [documentQuestion, setDocumentQuestion] = useState("")
  const [documentAnswer, setDocumentAnswer] = useState("")

  // Feedback
  const [feedback, setFeedback] = useState({})

  const activeChat = conversations.find(
    (chat) => chat.id === activeChatId
  )

  // Send normal message
  const handleSend = () => {
    if (!message.trim() || !activeChat) {
      return
    }

    const userMessage = {
      text: message,
      sender: "USER",
    }

    setConversations((currentChats) =>
      currentChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
            }
          : chat
      )
    )

    setMessage("")

    // Temporary AI response
    setTimeout(() => {
      const aiMessage = {
        text: "I'm processing your question...",
        sender: "AI",
      }

      setConversations((currentChats) =>
        currentChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [...chat.messages, aiMessage],
              }
            : chat
        )
      )
    }, 500)
  }

  // Open new chat popup
  const handleNewChat = () => {
    setNewChatTitle("")
    setShowNewChat(true)
  }

  // Create new chat
  const handleCreateChat = () => {
    if (!newChatTitle.trim()) {
      alert("Please enter a title")
      return
    }

    const newChat = {
      id: Date.now(),
      title: newChatTitle.trim(),
      status: "ACTIVE",
      messages: [],
    }

    setConversations((currentChats) => [
      newChat,
      ...currentChats,
    ])

    setActiveChatId(newChat.id)
    setNewChatTitle("")
    setShowNewChat(false)
    setShowArchived(false)
  }

  // Close new chat popup
  const handleCloseNewChat = () => {
    setShowNewChat(false)
    setNewChatTitle("")
  }

  // Rename conversation
  const handleRename = (id) => {
    const chat = conversations.find(
      (item) => item.id === id
    )

    if (!chat) return

    const newTitle = prompt(
      "Enter new conversation name:",
      chat.title
    )

    if (!newTitle || !newTitle.trim()) {
      return
    }

    setConversations((currentChats) =>
      currentChats.map((item) =>
        item.id === id
          ? {
              ...item,
              title: newTitle.trim(),
            }
          : item
      )
    )
  }

  // Archive conversation
  const handleArchive = (id) => {
    setConversations((currentChats) =>
      currentChats.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              status: "ARCHIVED",
            }
          : chat
      )
    )

    if (activeChatId === id) {
      setActiveChatId(null)
    }
  }

  // Restore archived chat
  const handleRestore = (id) => {
    setConversations((currentChats) =>
      currentChats.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              status: "ACTIVE",
            }
          : chat
      )
    )
  }

  // Delete conversation
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this conversation?"
    )

    if (!confirmDelete) {
      return
    }

    setConversations((currentChats) =>
      currentChats.filter((chat) => chat.id !== id)
    )

    if (activeChatId === id) {
      setActiveChatId(null)
    }
  }

  // Upload document
  const handleDocumentUpload = (event) => {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    setDocument(file)
    setDocumentStatus("PROCESSING")
    setDocumentAnswer("")

    setTimeout(() => {
      setDocumentStatus("COMPLETED")
    }, 1000)
  }

  // Remove document
  const handleRemoveDocument = () => {
    setDocument(null)
    setDocumentStatus("")
    setDocumentQuestion("")
    setDocumentAnswer("")
  }

  // Ask document question
  const handleDocumentQuestion = () => {
    if (!documentQuestion.trim() || !document) {
      return
    }

    setDocumentAnswer(
      "I'm preparing an answer based on your document..."
    )

    setDocumentQuestion("")
  }

  // Feedback
  const handleFeedback = (messageIndex, type) => {
    setFeedback((currentFeedback) => ({
      ...currentFeedback,
      [`${activeChatId}-${messageIndex}`]: type,
    }))
  }

  // Logout
  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    )

    if (!confirmLogout) {
      return
    }

    if (setPage) {
      setPage("login")
    }
  }

  return (
    <div className="dashboard">

      {/* Header */}
      <header className="dashboard-header">

        <h2>ChatBot</h2>

        <div className="user-area">

          <span>👤</span>
          <span>User</span>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>

      <div className="dashboard-body">

        {/* Sidebar */}
        <aside className="sidebar">

          <button
            className="new-chat-btn"
            onClick={handleNewChat}
          >
            + New Chat
          </button>

          <h3>Conversations</h3>

          {/* Active conversations */}
          <div className="conversation-list">

            {conversations
              .filter(
                (chat) => chat.status === "ACTIVE"
              )
              .map((chat) => (

                <div
                  key={chat.id}
                  className={`conversation-item ${
                    activeChatId === chat.id
                      ? "selected-chat"
                      : ""
                  }`}
                >

                  <button
                    className="conversation-title"
                    onClick={() => {
                      setActiveChatId(chat.id)
                      setShowArchived(false)
                    }}
                  >
                    {chat.title}
                  </button>

                  <div className="conversation-actions">

                    <button
                      onClick={() =>
                        handleRename(chat.id)
                      }
                      title="Rename"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() =>
                        handleArchive(chat.id)
                      }
                      title="Archive"
                    >
                      📥
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(chat.id)
                      }
                      title="Delete"
                    >
                      🗑️
                    </button>

                  </div>

                </div>

              ))}

          </div>

          {/* Archived */}
          <button
            className="archived-toggle"
            onClick={() =>
              setShowArchived(!showArchived)
            }
          >
            📦 Archived
          </button>

          {showArchived && (
            <div className="archived-list">

              {conversations.filter(
                (chat) => chat.status === "ARCHIVED"
              ).length === 0 ? (

                <p className="no-archived">
                  No archived conversations
                </p>

              ) : (

                conversations
                  .filter(
                    (chat) =>
                      chat.status === "ARCHIVED"
                  )
                  .map((chat) => (

                    <div
                      key={chat.id}
                      className="conversation-item archived-item"
                    >

                      <button
                        className="conversation-title"
                        onClick={() =>
                          setActiveChatId(chat.id)
                        }
                      >
                        {chat.title}
                      </button>

                      <div className="conversation-actions">

                        <button
                          onClick={() =>
                            handleRestore(chat.id)
                          }
                          title="Restore"
                        >
                          ↩️
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(chat.id)
                          }
                          title="Delete"
                        >
                          🗑️
                        </button>

                      </div>

                    </div>

                  ))

              )}

            </div>
          )}

        </aside>

        {/* Main Chat Area */}
        <main className="chat-area">

          <div className="chat-content">

            {activeChat ? (

              <>
                <h2 className="active-chat-title">
                  {activeChat.title}
                </h2>

                {activeChat.messages.length === 0 ? (

                  <div className="empty-chat">

                    <h1>
                      {activeChat.title}
                    </h1>

                    <p>
                      Start a new conversation.
                    </p>

                  </div>

                ) : (

                  activeChat.messages.map(
                    (msg, index) => (

                      <div
                        key={index}
                        className={
                          msg.sender === "USER"
                            ? "message user-message"
                            : "message ai-message"
                        }
                      >

                        <div>
                          {msg.text}
                        </div>

                        {/* Feedback only for actual AI answers */}
                        {msg.sender === "AI" && (
                          <div className="feedback-buttons">

                            <button
                              className={
                                feedback[
                                  `${activeChatId}-${index}`
                                ] === "POSITIVE"
                                  ? "feedback-selected"
                                  : ""
                              }
                              onClick={() =>
                                handleFeedback(
                                  index,
                                  "POSITIVE"
                                )
                              }
                              title="Helpful"
                            >
                              👍
                            </button>

                            <button
                              className={
                                feedback[
                                  `${activeChatId}-${index}`
                                ] === "NEGATIVE"
                                  ? "feedback-selected"
                                  : ""
                              }
                              onClick={() =>
                                handleFeedback(
                                  index,
                                  "NEGATIVE"
                                )
                              }
                              title="Not helpful"
                            >
                              👎
                            </button>

                          </div>
                        )}

                      </div>

                    )
                  )

                )}

              </>

            ) : (

              /* Initial Dashboard Welcome */
              <div className="dashboard-welcome">

                <h1>
                  Welcome to ChatBot 👋
                </h1>

                <p>
                  Select a conversation or create a new one.
                </p>

              </div>

            )}

            {/* Selected document */}
            {document && (
              <div className="selected-document">

                <div className="document-file">

                  <span>📄</span>

                  <div>

                    <strong>
                      {document.name}
                    </strong>

                    <small>
                      {documentStatus}
                    </small>

                  </div>

                </div>

                <button
                  onClick={handleRemoveDocument}
                  className="remove-document"
                  title="Remove file"
                >
                  ×
                </button>

              </div>
            )}

            {/* Document answer */}
            {documentAnswer && (
              <div className="document-answer">

                <strong>Answer</strong>

                <p>
                  {documentAnswer}
                </p>

              </div>
            )}

          </div>

          {/* Chat Input */}
          <div className="chat-input-area">

            <input
              type="file"
              id="document-upload"
              hidden
              onChange={handleDocumentUpload}
            />

            {/* Plus button */}
            <label
              htmlFor="document-upload"
              className="attach-button"
              title="Add file"
            >
              +
            </label>

            {/* Message input */}
            <input
              type="text"
              placeholder={
                document
                  ? "Ask something about your document..."
                  : "Type your message..."
              }
              value={
                document
                  ? documentQuestion
                  : message
              }
              onChange={(event) => {

                if (document) {
                  setDocumentQuestion(
                    event.target.value
                  )
                } else {
                  setMessage(
                    event.target.value
                  )
                }

              }}
              onKeyDown={(event) => {

                if (event.key === "Enter") {

                  if (document) {
                    handleDocumentQuestion()
                  } else {
                    handleSend()
                  }

                }

              }}
            />

            <button
              onClick={
                document
                  ? handleDocumentQuestion
                  : handleSend
              }
            >
              Send
            </button>

          </div>

        </main>

      </div>

      {/* New Chat Popup */}
      {showNewChat && (
        <div className="modal-overlay">

          <div className="new-chat-modal">

            <h2>New Chat</h2>

            <label>
              Title
            </label>

            <input
              type="text"
              placeholder="Enter chat title"
              value={newChatTitle}
              onChange={(event) =>
                setNewChatTitle(
                  event.target.value
                )
              }
              onKeyDown={(event) => {

                if (event.key === "Enter") {
                  handleCreateChat()
                }

              }}
              autoFocus
            />

            <button
              className="create-chat-btn"
              onClick={handleCreateChat}
            >
              Create
            </button>

            <button
              className="cancel-chat-btn"
              onClick={handleCloseNewChat}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

export default Dashboard