# TaskFlow

TaskFlow is a small, full-stack **personal task manager** built with the MERN stack.
Users sign up, log in, and manage their own tasks: create, view, edit, delete, mark as completed, and filter by status.
Each user can only see and change their own tasks.

The project is intentionally small in scope. The focus is on **reliability, clear error handling, and clean code** rather than on the number of features.

---

## Key Features

- User signup and login with JWT authentication (passwords hashed with bcrypt)
- Logout, plus the session is restored automatically on page refresh
- Create tasks with a title (required), description, priority (low / medium / high) and due date
- View, edit and delete tasks (delete asks for confirmation)
- Mark tasks as completed / pending with one click
- Filter tasks by status: All / Pending / Completed (done on the server via `?status=`)
- Protected dashboard: only reachable when logged in
- Automatic logout and redirect to the login page when the token expires
- Friendly messages for validation errors, API errors and server/network outages
- Responsive, minimal UI (plain CSS)

## Technologies Used

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Database | MongoDB Atlas, Mongoose                                 |
| Backend  | Node.js, Express 5, JSON Web Tokens, bcryptjs, CORS, dotenv |
| Frontend | React 19 (Vite), React Router, Axios                    |
| Styling  | Plain CSS (no UI framework)                             |

## Folder Structure

```
taskflow/
├── server/
│   ├── config/db.js               # MongoDB connection + clear failure logs
│   ├── models/
│   │   ├── User.js                # name, email (unique), hashed password
│   │   └── Task.js                # title, description, priority, status, dueDate, user
│   ├── controllers/
│   │   ├── authController.js      # signup, login, me
│   │   └── taskController.js      # CRUD + ownership checks
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js      # verifies JWT, loads req.user
│   │   ├── errorHandler.js        # 404 handler + centralized error handler
│   │   └── validate.js            # request body / params / query validation
│   ├── utils/AppError.js          # custom error class with HTTP status code
│   ├── server.js                  # app setup and startup
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── api/axios.js           # axios instance, token + error interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/            # Navbar, ProtectedRoute, TaskForm, TaskItem, TaskList, Loader, ErrorMessage
│   │   ├── pages/                 # Login, Signup, Dashboard, NotFound
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── .env.example
├── .gitignore
└── README.md
```

## Setup and Installation

### Prerequisites

- Node.js 18 or newer
- A MongoDB Atlas cluster (or a local MongoDB) connection string

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd taskflow
```

### 2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure environment variables

**Server:** copy `server/.env.example` to `server/.env` and fill in:

| Variable         | Description                                                    | Example                     |
| ---------------- | -------------------------------------------------------------- | --------------------------- |
| `PORT`           | Port for the API                                               | `5000`                      |
| `MONGO_URI`      | MongoDB connection string                                      | `mongodb+srv://.../taskflow` |
| `JWT_SECRET`     | Long random string used to sign tokens                         | (see command below)         |
| `JWT_EXPIRES_IN` | Token lifetime                                                 | `1d`                        |
| `CLIENT_URL`     | Frontend origin allowed by CORS (comma-separate for several)   | `http://localhost:5173`     |
| `NODE_ENV`       | `development` or `production`                                  | `development`               |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> If you use MongoDB Atlas, make sure your IP address is in **Network Access** in the Atlas dashboard.

**Client:** copy `client/.env.example` to `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

Open two terminals.

**Backend** (http://localhost:5000):

```bash
cd server
npm run dev      # restarts automatically on file changes (node --watch)
# or
npm start
```

**Frontend** (http://localhost:5173):

```bash
cd client
npm run dev
```

Then open http://localhost:5173, create an account and start adding tasks.

Production build of the frontend: `cd client && npm run build`.

## API Endpoints

Base URL: `http://localhost:5000/api`

Every response has the same shape:

```json
{ "success": true, "data": { }, "message": "Human readable message" }
```

| Method | Endpoint             | Auth | Description                                       | Success | Possible errors      |
| ------ | -------------------- | ---- | ------------------------------------------------- | ------- | -------------------- |
| GET    | `/health`            | No   | API and database status                           | 200     | 503                  |
| POST   | `/auth/signup`       | No   | Create account. Body: `name`, `email`, `password` | 201     | 400, 409             |
| POST   | `/auth/login`        | No   | Log in. Body: `email`, `password`                 | 200     | 400, 401             |
| GET    | `/auth/me`           | Yes  | Get the logged-in user                            | 200     | 401                  |
| GET    | `/tasks`             | Yes  | List my tasks. Optional `?status=pending\|completed` | 200  | 400, 401             |
| POST   | `/tasks`             | Yes  | Create task. Body: `title`, `description?`, `priority?`, `dueDate?` | 201 | 400, 401 |
| PUT    | `/tasks/:id`         | Yes  | Update any of `title`, `description`, `priority`, `status`, `dueDate` | 200 | 400, 401, 403, 404 |
| DELETE | `/tasks/:id`         | Yes  | Delete a task                                     | 200     | 400, 401, 403, 404   |

Protected endpoints need the header `Authorization: Bearer <token>`.

## Error Handling Approach

**Backend**

- **One error path.** Controllers throw an `AppError(message, statusCode)`. Express 5 forwards errors from `async` handlers automatically, and a single `errorHandler` middleware turns every error into the standard `{ success: false, data: null, message }` response.
- **Library errors are translated** into meaningful status codes: invalid ObjectId (`CastError`) → 400, Mongoose validation → 400, duplicate email (code `11000`) → 409, expired or invalid JWT → 401, malformed JSON body → 400.
- **Validation happens before the controller** (`validate.js`): empty title, invalid email, password shorter than 6 characters, invalid priority/status, invalid date, and malformed task IDs all return 400 with a clear message.
- **Ownership checks**: a task that doesn't exist returns 404, and a task that belongs to another user returns 403. Task lists are always filtered by the logged-in user.
- **Unknown routes** return a JSON 404. **Unexpected errors** return a generic 500 message; the full stack trace is only logged on the server.
- **Passwords are never returned**: `select: false` on the schema plus a `toJSON` transform that removes them.
- **Startup safety**: missing env variables or a failed MongoDB connection print a clear message and stop the process instead of running in a broken state.

**Frontend**

- The axios response interceptor converts every failure into an `Error` with a user-friendly message: the API's message, a "server unreachable" message for network errors, or a timeout message.
- A 401 on a protected request logs the user out automatically and redirects to the login page with a "session expired" notice.
- Every request has a loading state, submit buttons are disabled while a request is running, and forms are validated before anything is sent.
- The task list has empty states, and its error message has a "Try again" button. Filter requests that are replaced by newer ones are cancelled to avoid race conditions.

## Built with Code0

This project was developed using **Code0** as the AI-assisted development environment. Code0 was used throughout the build, including writing and refactoring code, debugging, and for **all Git operations** (staging, committing with conventional commit messages, and pushing to the remote repository).

## AI Development Experience

> _Fill in this section with your own experience._

**How I used Code0:**

_[Describe your overall workflow, e.g. how you planned the project, how you prompted Code0, and how you reviewed its output.]_

**Specific tasks:**

1. **API creation:** _[e.g. generating the Express routes/controllers for tasks and auth. What you asked, what it produced, what you changed.]_
2. **Database integration:** _[e.g. Mongoose models, MongoDB Atlas connection, unique email index. Any issues you hit and how you fixed them.]_
3. **Component development:** _[e.g. TaskForm / TaskItem / AuthContext. What you kept, what you adjusted.]_
4. **Debugging:** _[e.g. a specific bug such as CORS, an expired-token redirect, or an off-by-one due date. How Code0 helped you find it.]_
5. **Refactoring / testing:** _[e.g. extracting the ownership check into a helper, testing every endpoint with Postman/Thunder Client.]_

**How I validated and fixed AI suggestions:**

_[e.g. tested every endpoint, including error cases, with Postman/Thunder Client; checked status codes against the requirements; read the generated code line by line; fixed X when Y happened.]_
