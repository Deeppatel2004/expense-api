# Expense Tracker – Project Plan

## 1. Project Description

Expense Tracker is a full-stack web application that helps users record, manage, search, filter, and track their daily expenses.

Users can register, log in, manage their personal expenses, and view monthly spending summaries with category-wise breakdowns.

## 2. Database Design

We use MongoDB with two collections: User and Expense.

### User Model

| Field | Type | Required |
|---|---|---|
| name | String | Yes |
| email | String | Yes |
| password | String | Yes |
| createdAt | Date | Automatic |
| updatedAt | Date | Automatic |

Rules:
- Email must be unique, lowercase, and trimmed.
- Password must be hashed using bcrypt.
- Password hash must never be returned in API responses.
- Use Mongoose timestamps.

### Expense Model

| Field | Type | Required |
|---|---|---|
| title | String | Yes |
| amount | Number | Yes |
| category | String | Yes |
| date | Date | Yes |
| notes | String | No |
| owner | ObjectId (User reference) | Yes |
| createdAt | Date | Automatic |
| updatedAt | Date | Automatic |

Rules:
- Amount must be a valid positive number.
- Title must not be empty.
- Category must match an allowed category.
- Owner must reference the expense's user.
- Use Mongoose timestamps.

### Expense Categories

- Food
- Transport
- Shopping
- Bills
- Entertainment
- Health
- Education
- Other

### Database Relationship

One user can have many expenses, but each expense belongs to only one user.

## 3. API Routes

### Authentication Routes

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| POST | /auth/register | Register a new user | No |
| POST | /auth/login | Login and receive JWT | No |

Logout is handled on the frontend by clearing the stored authentication token.

### Expense Routes

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| POST | /expenses | Create an expense | Yes |
| GET | /expenses | Get expenses | Yes |
| GET | /expenses/:id | Get one expense | Yes |
| PATCH | /expenses/:id | Update an expense | Yes |
| DELETE | /expenses/:id | Delete an expense | Yes |
| GET | /expenses/summary?month=YYYY-MM | Get monthly summary | Yes |

### Search and Filtering

- Search expenses by title.
- Search expenses by notes.
- Filter expenses by category.
- Filter expenses by month.
- Sort expenses.
- Combine supported filters.

Search currently runs in the browser using the loaded expense list.

### Security

- Protect private routes using requireAuth.
- Use JWT authentication.
- Store passwords securely using bcrypt.
- Retrieve only the logged-in user's expenses.
- Include owner ID when updating or deleting expenses.
- Users must not access another user's expenses.

## 4. Frontend Pages

| URL | Page | Functionality |
|---|---|---|
| /register | Register | Create a new account |
| /login | Login | Login to an account |
| / | Expenses | View, add, search, filter, edit, and delete expenses |
| /summary | Monthly Summary | View monthly totals and category breakdown |

### Expenses Page Features

- Add new expenses.
- View expenses.
- Edit expenses.
- Delete expenses.
- Search by title and notes.
- Filter by category.
- Filter by month.
- Sort expenses.
- Display expense count and total.

### Monthly Summary Features

- Month picker.
- Monthly expense total.
- Category-wise spending.
- Category percentages.
- Category spending bars.
- Biggest single expense.
- Empty month message.
- Loading and error states.

### UI States

- Loading state while fetching or submitting data.
- Error state when an API request fails.
- Empty state when no expenses are available.
- Success feedback after creating, updating, or deleting expenses.

## 5. Five-Day Development Plan

### Day 1 – Backend Skeleton

- [x] Create expense-api repository.
- [x] Initialize npm project.
- [x] Install Express, Mongoose, and dotenv.
- [x] Configure server.js.
- [x] Add logger middleware.
- [x] Add GET /health.
- [x] Add error handling.
- [x] Create User and Expense models.
- [x] Implement expense validation.
- [x] Install Vitest and Supertest.
- [x] Write health and validation tests.
- [x] Create README.
- [x] Initialize Git and push to GitHub.

### Day 2 – Full CRUD

- [x] Implement GET all expenses.
- [x] Implement GET expense by ID.
- [x] Implement POST expense.
- [x] Implement PATCH expense.
- [x] Implement DELETE expense.
- [x] Add input validation.
- [x] Write API tests for CRUD operations.
- [x] Test invalid IDs and missing data.

### Day 3 – Authentication and Ownership

- [x] Implement user registration.
- [x] Hash passwords using bcrypt.
- [x] Implement user login.
- [x] Generate JWT tokens.
- [x] Create requireAuth middleware.
- [x] Add owner reference to expenses.
- [x] Protect expense routes.
- [x] Test authentication.
- [x] Test user data isolation.

### Day 4 – React Frontend

- [x] Create expense-react repository.
- [x] Set up React and React Router.
- [x] Create Login and Register pages.
- [x] Create Expenses page.
- [x] Create expense form.
- [x] Implement Edit functionality.
- [x] Implement Delete functionality.
- [x] Connect frontend to backend API.
- [x] Add loading and error states.
- [x] Implement protected routes.

### Day 5 – Search, Summary and Deployment

- [x] Implement title search.
- [x] Implement notes search.
- [x] Implement category filtering.
- [x] Implement month filtering.
- [x] Implement expense sorting.
- [x] Calculate monthly expense totals.
- [x] Create