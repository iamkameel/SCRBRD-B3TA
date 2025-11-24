# SCRBRD UI/UX Breakdown

This document provides a comprehensive breakdown of the SCRBRD application's frontend, covering its visual identity, component architecture, and overall user experience design.

---

## 1. Visual Identity & Theming

The visual identity of SCRBRD is designed to be modern, clean, and professional, with a distinct cricketing feel. The color scheme and typography are central to this identity.

### 1.1. Color Palette

The color system is managed via CSS variables in `src/app/globals.css`, allowing for easy theming and consistency.

-   **Primary Color (`--primary`)**: `#3ccc6c` (HSL: 145 59% 52%)
    -   A vibrant, energetic green that evokes the feeling of a cricket field. It's used for primary actions, active states, and key highlights.
-   **Accent Color (`--accent`)**: `#94dca4` (HSL: 132 51% 72%)
    -   A lighter, complementary green used for hover states and secondary highlights, providing a soft contrast to the primary green.
-   **Background (`--background`)**: `#f0f3f5` (Light) / `#111827` (Dark)
    -   A light, neutral grey for the light theme and a deep, cool navy for the dark theme, ensuring content is always readable and comfortable on the eyes.
-   **Destructive Color (`--destructive`)**: Red (`#dc2626`)
    -   Used exclusively for destructive actions like deletions to provide a clear visual warning.
-   **Sidebar**: The sidebar maintains a consistent dark theme (`#111827`) across both light and dark modes to provide a stable, modern navigation anchor.

### 1.2. Typography

-   **Primary Font**: `Inter`
    -   A highly legible and modern sans-serif font used for all UI text, from body copy to headlines. It is loaded via Google Fonts in `src/app/layout.tsx`.
-   **Font Weights**: Regular (400), Medium (500), Semibold (600), and Bold (700) are used to create a clear visual hierarchy.

### 1.3. UI Components (ShadCN)

The application is built using **ShadCN UI**, a collection of accessible and reusable components built on top of Radix UI and Tailwind CSS. This ensures a consistent look and feel across all elements.

-   **Style**: `default`
-   **Base Color**: `neutral`
-   **Key Components Used**: `Card`, `Button`, `Table`, `Tabs`, `Dialog`, `DropdownMenu`, `Select`, `Input`, `Avatar`, `Badge`, and many more. All components are styled according to the theme variables defined in `globals.css`.

---

## 2. Layout & Responsive Design

The application uses a responsive, sidebar-based layout that adapts to various screen sizes.

-   **Desktop Layout**: A fixed 256px sidebar (`md:pl-64`) on the left with a main content area on the right.
-   **Mobile Layout**: The sidebar is hidden and accessible via a "hamburger" menu icon in the header. The layout reflows into a single-column format for optimal viewing on small screens.
-   **Page Shell (`/src/components/page-shell.tsx`)**: This component wraps the main content area, providing consistent padding and structure.

---

## 3. Core UI Pages & Modules

### 3.1. Dashboards (`/src/app/dashboards/`)

-   **Role-Based Experience**: The main dashboard page (`/dashboard`) dynamically renders a specific dashboard component based on the user's active role.
-   **Key Components**: Dashboards heavily use `Card` components for KPIs and `Table` or list views for summaries of upcoming events. `Recharts` is used for data visualization.

### 3.2. Data Management Pages (`/src/app/(schools|teams|people|...)`)

-   **CRUD Operations**: These pages provide full Create, Read, Update, and Delete functionality for core data entities.
-   **UI Patterns**:
    -   `Table` is used for the primary list view, with powerful sorting and filtering capabilities.
    -   `Dialog` components house the forms for creating and editing items.
    -   `DropdownMenu` is used for row-level actions (Edit, Delete).
    -   `AlertDialog` is used for destructive action confirmation.
-   **Advanced UI**:
    -   **Multiple Views**: The Matches page offers List, Card, and interactive Calendar views.
    -   **Filtering**: `Popover` and `DropdownMenu` with `DropdownMenuCheckboxItem` are used to build complex filtering interfaces.

### 3.3. Match Details Page (`/src/app/matches/[matchId]/`)

-   **Tabbed Interface**: Uses `Tabs` to organize a large amount of information into logical sections (Scorecard, Lineups, Analysis, Logistics).
-   **Live Scoring**: A dedicated interface for live scoring (`live-scoring-interface.tsx`) featuring a custom `WagonWheel` component.
-   **Visualizations**: Completed matches display interactive charts from `match-charts.tsx`, including `ManhattanChart`, `WormChart`, and `WagonWheelCard`, all built with `Recharts`.
-   **AI Interaction**: Buttons with `Loader2` icons provide clear feedback when generating AI content like match reports or previews.

### 3.4. Player Profile (`/src/app/people/[personId]/`)

-   **Comprehensive Overview**: Combines a player's personal details, stats, team assignments, and development plans.
-   **Tracker Tab**: A new, dedicated tab (`player-tracker-tab.tsx`) that visualizes long-term development using `PerformanceTimelineChart` and `SkillRadarChart`.
-   **Skills Tab**: Allows coaches to rate player attributes on a 1-20 scale using `Slider` components.

---

## 4. Navigation & User Flow

-   **Sidebar (`/src/components/sidebar.tsx`)**: The primary navigation element, dynamically configured by `getNavConfig` based on the user's role. It uses an `Accordion` for nested menu items.
-   **Header (`/src/components/header.tsx`)**: Contains global elements like the `CommandSearch`, notifications, and a user profile dropdown with a role switcher.
-   **Command Search (`/src/components/command-search.tsx`)**: A powerful, keyboard-accessible search (`⌘K` or `Ctrl+K`) that allows users to quickly ask questions about league stats using a natural language interface powered by Genkit.
