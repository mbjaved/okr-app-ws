# Development Timeline & Task Log

This file documents all major tasks, debugging sessions, and time taken for each, organized by date. It serves as a transparent record of the project’s progress and decision-making.

---

## 2025-04-28

- **Project Initialization**
  - Set up Next.js (TypeScript, Tailwind, ESLint, src/app structure).
  - Added Prettier and best practices documentation.
  - Initialized git repo, created master/dev branches, and pushed to GitHub.
  - **Time taken:** ~25 minutes

- **Dependency & UI Library Setup**
  - Installed NextAuth, MongoDB adapter, shadcn/ui, icon & form libraries.
  - **Time taken:** ~15 minutes

- **Authentication Backend**
  - Implemented NextAuth.js config with MongoDB adapter (Google + email/password).
  - Created MongoDB connection utility and user model helpers.
  - **Time taken:** ~20 minutes

- **Registration & Login Flow**
  - Scaffolded registration and login pages matching the design prompt.
  - Connected registration form to backend API with error handling.
  - **Time taken:** ~20 minutes

- **Best Practices Update**
  - Added timeline/task logging as a new best practice.
  - Created this DEVELOPMENT_TIMELINE.md file.
  - **Time taken:** 5 minutes


- **2025-04-28 15:16 (+04:00)**
  - Created and switched to new branch: `feature/auth-flow-rework` from `dev`.
  - Rationale: To follow best practices, all authentication flow improvements and fixes will be made in this feature branch. This ensures clean code reviews, safe merges, and better project management.
  - **Time taken:** ~2 minutes

---

(Continue to log all future tasks, debugging, and decisions here)
