# Expense Tracker – Project Plan

## 1. Project Description

Expense Tracker is a web application that helps users record, manage, search, and track their daily expenses, view monthly spending totals, and organize expenses by category.

## 2. Database Design

We will use MongoDB with two collections: User and Expense.

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
- Owner must reference an existing user.
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
| GET | /auth/me | Get logged-in user details | Yes |

Logout will be handled on the frontend by clearing the stored authentication token.

### Expense Routes

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| POST | /expenses | Create an expense | Yes |
| GET | /expenses | Get all expenses | Yes |
| GET | /expenses/:id | Get one expense | Yes |
| PATCH | /expenses/:id | Update an expense | Yes |
| DELETE | /expenses/:id | Delete an expense | Yes |
| GET | /expenses/summary/monthly | Get monthly totals for the last six months | Yes |

### Search and Filter

Search and filtering will use query parameters.

Examples:

- GET /expenses?search=lunch
- GET /expenses?category=Food
- GET /expenses?category=Transport
- GET /expenses?from=2026-11-01&to=2026-11-30
- GET /expenses?search=bus&category=Transport

Features:
- Search by expense title.
- Filter by category.
- Filter by date range.
- Combine multiple filters.

### Security

- Protect private routes using requireAuth.
- Use ownerFilter to retrieve only the logged-in user's expenses.
- Include owner ID when updating or deleting expenses.
- Users must not access another user's expenses.

## 4. Frontend Pages

| URL | Page | Functionality |
|---|---|---|
| /register | Register | Create a new account |
| /login | Login | Login to an account |
| /dashboard | Dashboard | View expense summaries and charts |
| /expenses | Expense List | View, search, and filter expenses |
| /expenses/new | Add Expense | Create a new expense |
| /expenses/:id/edit | Edit Expense | Update an existing expense |

### Dashboard Features

- Current month's total expenses.
- Number of expenses this month.
- Category-wise spending.
- Monthly spending chart for the last six months.
- Recent expenses.

### Expense List Features

- Search expenses by title.
- Filter expenses by category.
- Filter expenses by date.
- View expense details.
- Edit expenses.
- Delete expenses.
- Add new expenses.

### UI States

- Loading state while fetching or submitting data.
- Error state when an API request fails.
- Empty state when no expenses are available.
- Success feedback after creating, updating, or deleting expenses.

## 5. Five-Day Development Plan

### Day 1 – Backend Skeleton

- Create expense-api repository.
- Initialize npm project.
- Install Express, Mongoose, and dotenv.
- Configure server.js.
- Add logger middleware.
- Add GET /health.
- Add 404 and error handlers.
- Create User and Expense models.
- Implement POST /expenses with validation.
- Install Vitest and Supertest.
- Write GET /health test.
- Write invalid POST /expenses test.
- Create README.
- Initialize Git and push to GitHub.

### Day 2 – Full CRUD

- Implement GET all expenses.
- Implement GET expense by ID.
- Implement POST expense.
- Implement PATCH expense.
- Implement DELETE expense.
- Add input validation.
- Write API tests for all CRUD operations.
- Test invalid IDs and missing data.

### Day 3 – Authentication and Ownership

- Implement user registration.
- Hash passwords using bcrypt.
- Implement user login.
- Generate JWT tokens.
- Create requireAuth middleware.
- Add owner reference to expenses.
- Implement ownerFilter.
- Protect all expense routes.
- Test authentication.
- Test two-user data isolation.

### Day 4 – React Frontend

- Create expense-react repository.
- Set up React and React Router.
- Create Login and Register pages.
- Create Dashboard page.
- Create Expense List page.
- Create Add Expense form.
- Create Edit Expense form.
- Implement Delete functionality.
- Connect frontend to backend API.
- Add loading and error states.

### Day 5 – Search, Calculations and Deployment

- Implement title search.
- Implement category filtering.
- Implement date filtering.
- Calculate monthly expense totals.
- Display the last six months in a chart.
- Test the complete application.
- Deploy backend.
- Deploy frontend.
- Configure production API URL.
- Update README with deployment links.

## 6. First Task Tomorrow Morning

Create the expense-api project, initialize npm, install the required dependencies, and configure the backend folder structure.

## 7. Technologies

- Frontend: React, HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB and Mongoose
- Authentication: JWT and bcrypt
- Testing: Vitest and Supertest
- Deployment: Render and Vercel
- Version Control: Git and GitHub