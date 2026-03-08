# API Reference

The **Preguntas API** follows a RESTful pattern and is documented here for developers.

## Endpoints

### Lessons

- `GET /api/lessons/`: List all lessons with nested pages and exercises.
- `GET /api/lessons/{id}/`: Retrieve a specific lesson.

### User & Profiles

- `POST /api/users/register/`: Register a new student or creator.
- `POST /api/users/login/`: Authenticated login (returns a Token).
- `GET /api/users/me/`: Retrieve current user profile.

### Student Stats & Progress

- `GET /api/students/me/stats/`: Retrieve attempts, achievements, and progress for the current student.
- `POST /api/attempts/`: Log a new exercise completion attempt.

## Authentication

We use **Token Authentication**. All requests to protected endpoints must include the `Authorization: Token <your_token>` header.

---
*For interactive API exploration, use the Django REST Framework browsable API at `/api/`.*
