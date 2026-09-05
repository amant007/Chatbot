# ChatBot Frontend

React + Vite frontend for the Web-Based Chatbot project.

## Run the project

1. Open this folder in VS Code.
2. Open Terminal.
3. Run:

```bash
npm install
npm run dev
```

4. Open the localhost address shown by Vite.

## Admin Dashboard

From the normal login screen, click **Admin**.
Enter any non-empty User ID and password in this frontend demo and click **Login as Admin**.

The Admin Dashboard includes:
- Dashboard overview
- Total Users
- Total Conversations
- Total Messages
- Total Documents
- Total Feedback
- Users management/search
- Conversations table
- Documents table
- Feedback table
- Logout
- Responsive mobile sidebar

## Important backend note

The admin login and dashboard currently use frontend demo data so the project runs independently.

For the final project, connect these screens to the Django REST API:

- `POST /api/login/`
- `POST /api/admin/login/`
- `GET /api/admin/statistics/`
- `GET /api/admin/users/`
- `GET /api/admin/conversations/`
- `GET /api/admin/documents/`
- `GET /api/admin/feedback/`

React should communicate with Django APIs. React must not connect directly to MySQL.

The database design remains in MySQL on the backend.
