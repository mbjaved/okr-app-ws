# Development Timeline & Task Log

## 2025-05-02
- Implemented authentication wall on the OKRs page using NextAuth's useSession and useRouter for redirect.
- Unauthenticated users are redirected to /login; a loading spinner is shown while checking auth status.
- This follows project best practices for security, user feedback, and modularity.
- **Enhanced OKR Dialog:** Added dirty-checking so the Save OKR button is only enabled if the form has unsaved changes. Tooltip provides feedback when Save is disabled. This follows best practices for user feedback and prevents unnecessary API calls.
- Referenced PROJECT_BEST_PRACTICES.md and design prompts for all changes.


This file documents all major tasks, debugging sessions, and time taken for each, organized by date. It serves as a transparent record of the project’s progress and decision-making.

---

## 2025-05-05

- **Teams API Route Created**
  - Added `/api/users` route to serve user/team data for the Teams page.
  - Follows best practices: modularity, security (add auth checks in prod), separation of concerns, and type safety.
  - Referenced PROJECT_BEST_PRACTICES.md and Design_Prompts for implementation.
  - **Time taken:** ~10 minutes

- **Teams Page Updated to Use Real Data**
  - Refactored `/team` page to fetch and display real user/team data from the new API route using SWR.
  - Maintains separation of concerns, accessibility, and UI consistency as per Design_Prompts.
  - Added error/loading state and documented best practices in code.
  - **Time taken:** ~15 minutes

- **Process**: Timeline updated side by side with implementation as required by project process rules.

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

- **OKR API Implementation**
  - Designed and implemented OKR MongoDB schema (referenced Design_Prompts/1.txt for requirements).

- **OKR Management UI Scaffolding**
  - Reviewed Design_Prompts/1.txt, 2.txt, and 3.txt for UI/UX requirements and visual guidelines.

- **OkrCard Component Implementation**
  - Created a modular, reusable, and accessible OkrCard component in src/components/okr/OkrCard.tsx.

- **Add/Edit OKR Dialog Implementation**
  - Created a full-page dialog component (OkrDialog) in src/components/okr/OkrDialog.tsx.

- **Departments API Endpoint**
  - Implemented /api/departments GET endpoint to fetch all departments for dropdown selection in OKR dialog.
  - Added robust error handling and clear user-facing error messages.
  - Adopted new best practice: All error handling must be clear, actionable, and logged both for the user and for debugging.
  - Logged this step in DEVELOPMENT_TIMELINE.md per best practices.
  - **Time taken:** ~10 minutes
  - Referenced all design prompts for layout, accessibility, sticky CTAs, and confirmation modal before close.
  - Ensured modularity and accessibility best practices.
  - Logged this step in DEVELOPMENT_TIMELINE.md per best practices.
  - **Time taken:** ~15 minutes
  - Referenced all design prompts for color, status, and layout.
  - Used shadcn/ui Card as the foundation for consistent styling.
  - Logged this step in DEVELOPMENT_TIMELINE.md per best practices.
  - **Time taken:** ~10 minutes
  - Proposed and scaffolded the OKRs page with modular layout: header, tabs (All/Archived), and OKR card grid.
  - Used shadcn/ui components for consistency and accessibility.
  - Logged this step in DEVELOPMENT_TIMELINE.md per best practices.
  - **Time taken:** ~10 minutes
  - Added department association to OKR schema for flexible filtering (user or department level).
  - Created RESTful API endpoints for OKR CRUD operations:
    - POST /api/okrs (Create OKR)
    - GET /api/okrs (List OKRs for user or department)
    - GET /api/okrs/:okrId (Fetch single OKR)
    - PUT /api/okrs/:okrId (Update OKR)
    - DELETE /api/okrs/:okrId (Soft delete/archive OKR)
  - All endpoints enforce authentication and access control per best practices.
  - Proactively presented schema and API proposals for user review (per updated best practices).
  - Maintained modular code structure and clear separation of concerns.
  - **Time taken:** ~35 minutes
  - Created this DEVELOPMENT_TIMELINE.md file.
  - **Time taken:** 5 minutes


- **2025-04-28 15:16 (+04:00)**
  - Created and switched to new branch: `feature/auth-flow-rework` from `dev`.
  - Rationale: To follow best practices, all authentication flow improvements and fixes will be made in this feature branch. This ensures clean code reviews, safe merges, and better project management.
  - **Time taken:** ~2 minutes

---

### 2025-05-07

### Feature: Deterministic Dummy Avatars for All Users

### Fix: Show Avatars for All Users in TopNav and Teams Page (2025-05-07)

### Feature: Profile Dropdown Actions & Settings Pages (2025-05-07)
- **Summary:** Implemented navigation actions for the profile dropdown in TopNav. Profile navigates to `/settings/profile`, Settings to `/settings`, and Logout performs a robust two-step sign-out. Created accessible placeholder pages for `/settings` and `/settings/profile`.
- **Best Practices:**
  - Modularity and extensibility (easy to add more actions/settings)
  - Accessibility (keyboard navigation, semantic structure)
  - Timeline and documentation updated in parallel with code changes
- **Time Tracked:** ~20min

- **Summary:** Fixed avatar display for all users (including existing ones) both in the Teams page and the TopNav profile menu. The Avatar component now receives the correct username and avatarUrl for the logged-in user by extracting custom fields from the session object with a type guard. This ensures deterministic Dicebear avatars appear everywhere, even for legacy users.
- **Best Practices:**
  - Defensive coding for session.user custom fields (type guard)
  - Extensible, modular component usage
  - Timeline and documentation updated in parallel with code changes
- **Time Tracked:** ~15min

- **Summary:** Implemented automatic, unique SVG avatars for all users using Dicebear. Avatars are generated via a Node.js script and saved in `/public/avatars/{username}.svg`. The API and UI were updated to reference these avatars as placeholders until custom uploads are supported.
- **API:** `/api/users` now returns an `avatarUrl` pointing to the dummy avatar for each user if no custom avatar is set.
- **UI:** The `Avatar` component and Teams page now use the `username` prop to display the correct dummy avatar for each user.
- **Best Practices:**
  - Deterministic avatar generation for visual distinction and future extensibility (Design_prompts)
  - Modular, accessible, and typed components
  - Timeline updated in parallel with implementation (process compliance)
- **Time Tracked:** ~30min


- **Teams Page: Filtering by Department and Role (Start)**

- **UX Improvement:** Reduced filter drawer overlay opacity from 30% to 10% for a less intrusive, more Radix UI-consistent experience (per design review and user feedback).
  - Began implementation of filtering with a side drawer and dismissible chips, per Design_Prompts/3.txt.
  - Side drawer will provide checkboxes for department and role; selected filters will be shown as chips above the table and can be dismissed to clear filters.
  - Filtering logic is modular, accessible, and defensive. All UI components use Radix UI/shadcn/ui where possible.
  - Timeline logging and per-task time tracking in progress for this step, as required by project process rules.
  - **Time taken:** [in progress]

(Continue to log all future tasks, debugging, and decisions here)
