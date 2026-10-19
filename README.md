# Task Management Application

A full-stack task management web app for creating, updating, and tracking tasks.

## Features
- User authentication & authorization (JWT + bcrypt; users only see their own tasks)
- CRUD operations for tasks (title, description, status)
- Filter by status: To Do / In Progress / Done
- Responsive design for web and mobile, with dark mode

## Tech Stack
Node.js, Express, JSON file storage, vanilla HTML/CSS/JS

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000

Optional: set `JWT_SECRET` and `PORT` environment variables.

## API
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/register | Create account |
| POST | /api/login | Login |
| GET | /api/tasks | List my tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
