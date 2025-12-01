# SCRBRD - Immediate Action Task List

This document outlines the critical tasks required to stabilize the application and resolve recurring issues. We will focus on these items before proceeding to new feature development.

---

### Priority 1: Core System Stability & Permissions

-   [ ] **1.1: Comprehensive Permission Audit**:
    -   **Goal**: Ensure the 'System Architect' role has the same permissions as 'Admin' across the entire application.
    -   **Action**: Review all server actions in `src/lib/actions/` and all page components in `src/app/` to verify that permission checks correctly include all administrative roles (`System Architect`, `Admin`, `Sportsmaster`).

-   [x] **1.2: Finalize Server-Side Authentication**:
    -   **Goal**: Guarantee the `getUserId()` function is robust and error-free.
    -   **Action**: Correct the implementation in `src/lib/server-auth.ts` to properly `await headers()` and remove any temporary workarounds to ensure it reliably retrieves the authenticated user's ID on the server.

-   [x] **1.3: Fix Global Layout Constraint**:
    -   **Goal**: Resolve the issue causing content to be centered with empty space on the sides.
    -   **Action**: Remove the global `container` class from the `<body>` tag in `src/app/layout.tsx` to allow page content to fill the full width of the viewport.

---

### Priority 2: UI & User Experience Refinements

-   [ ] **2.1: Fix "New Match" Button Visibility**:
    -   **Goal**: Ensure the "New Match" button is consistently visible to all authorized administrative roles on the Matches page.
    -   **Action**: Correctly pass the `isAdmin` prop to the `NewMatchClient` component and use it to conditionally render the button.

-   [ ] **2.2: Review Key Action Buttons**:
    -   **Goal**: Verify that all primary action buttons (e.g., "Add", "Edit", "Delete") across all management pages are correctly displayed based on user permissions.
    -   **Action**: Perform a quick review of the main pages (`/people`, `/teams`, `/competitions`, etc.) to check for any other missing UI controls for admin users.

---

### Priority 3: New Feature Development

-   [ ] **3.1: Address Roadmap Items**:
    -   **Goal**: Begin implementing the next set of features once core stability is achieved.
    -   **Action**: Once all Priority 1 and 2 tasks are complete and verified, we will proceed with the items outlined in the `ROADMAP.md` file.
