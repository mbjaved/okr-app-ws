# Best Practices for OKR App Development

## 1. Accessibility & Modularity
- All interactive buttons and icons must use the `cursor-pointer` class for clear interaction feedback. Icon buttons should provide visible :hover and :focus styles for accessibility and modern UX.
- All components and pages must be accessible and modular, following shadcn/ui and design system conventions.

## 2. Typed API Contracts
- Use TypeScript types for all API request/response objects and database models.

## 3. Minimal, Robust API Payloads
- Only send the necessary fields in API requests, with correct types (e.g., always send manager as user _id, never an object).

## 4. Debug Logging & Feedback
- Add debug logging for outgoing API requests and show robust UI feedback (toasts, errors, loading indicators).

## 5. Development Timeline Logging
- All major features and improvements must be logged in DEVELOPMENT_TIMELINE.md as they are implemented.

## 6. Design Prompt Reference
- Always refer to Design_prompts for guidance and note which best practice is followed in each step.

## 7. Client-Side Auth Flows
- Authentication and sign-out flows must use client-side navigation for consistent redirect behavior across environments.

## 8. **Meaningful Error Messages** _(NEW)_
- Every API and UI request must return or display a meaningful error message to the user, clearly indicating what went wrong and how to correct it. This assists users in self-correcting mistakes and improves overall UX.

---

_This document is updated as new best practices are established. All contributors must review and follow these guidelines._
