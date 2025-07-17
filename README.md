# 📁 Project File Structure Guide

This document explains the file and folder structure of the **ChatPilot** project to help new developers quickly understand and collaborate.

---

## Root Directory

- **README.md**  
  This file. Project overview, setup instructions, and file structure guide.

- **package.json / package-lock.json**  
  Project dependencies, scripts, and metadata.

- **tsconfig.json / tsconfig.app.json / tsconfig.node.json**  
  TypeScript configuration files for app, node, and general settings.

- **tailwind.config.ts / postcss.config.js**  
  Tailwind CSS and PostCSS configuration for styling.

- **vite.config.ts**  
  Vite build tool configuration.

- **vercel.json**  
  Vercel deployment configuration.

- **components.json**  
  (If present) Custom component registry or configuration.

- **bun.lockb**  
  Bun package manager lockfile (if using Bun).

---

## Main Folders

### `/src`

> **All source code lives here.**

- **/assets/**  
  Static assets (images, icons, etc.)
  - `/images/`  
    All image files, including platform icons, sidebar icons, and branding.

- **/components/**  
  All React components, organized by feature or UI section.
  - `ui/`  
    Reusable UI primitives (buttons, dialogs, forms, etc.)
  - Main app panels:  
    - `AppHeader.tsx`, `SidebarNav.tsx`, `ChatPanel.tsx`, `TasksPanel.tsx`, etc.
  - Feature-specific:  
    - `SmartSummary.tsx`, `UnifiedInbox.tsx`, `AISummaryPanel.tsx`, etc.

- **/hooks/**  
  Custom React hooks for shared logic (e.g., `useAuth.tsx`, `useTheme.tsx`).

- **/lib/**  
  Utility functions and helpers (e.g., `utils.ts`).

- **/pages/**  
  Top-level route components for the app.  
  **Routing details:**
  - **`/auth`:**  
    - Renders the `AuthPage` component.
    - Handles **Sign In / Sign Up** flows.
  - **`/` (Root):**  
    - If the user is **not logged in**, they are redirected to `/auth`.
    - If the user is **logged in but not onboarded**, the `OnboardingFlow` component is rendered at the `/` route.
    - If the user is **signed in and onboarded**, the `/` route (handled by `src/pages/Index.tsx`) renders the **Unified Inbox** page using inner components (main chat interface).
  - **`/smart-tasks`:**  
    - Renders the **Smart Tasks** page, a productivity/task management interface powered by AI.
  - **Other pages:**  
    - **`/privacy-policy`**: Privacy policy information.
    - **`/terms-of-service`**: Terms of service.
    - **`/notfound`**: 404 page for unmatched routes.
    - **`/unified-inbox`**: Main chat/inbox interface (may be the default after login/onboarding).

  Each file in `/src/pages/` corresponds to a route in the app, following the conventions of modern React/Vite routing setups.

- **App.tsx / App.css / index.css**  
  Main app entry and global styles.

- **main.tsx**  
  React app bootstrap.

- **vite-env.d.ts**  
  Vite/TypeScript environment declarations.

---

### `/public`

> Static files served as-is (e.g., `robots.txt`, `placeholder.svg`).

---

### Other Folders

- **/node_modules/**  
  Installed dependencies (auto-generated).

- **/.git/**  
  Git version control data.

- **/.vite/**  
  Vite build cache (auto-generated).

---

## 🗂️ Typical Workflow

- **Add new UI:**  
  Create a component in `/src/components/` or `/src/components/ui/`.
- **Add a new page/route:**  
  Add a file to `/src/pages/`.
- **Add a new hook:**  
  Add to `/src/hooks/`.
- **Add an image or icon:**  
  Place in `/src/assets/images/`.
- **Integrate a new service:**  
  Add to `/src/integrations/` or `/supabase/functions/`.

---

## 🧑‍💻 For Collaborators

- **Follow the modular structure:**  
  Keep code organized by feature and type.
- **Use TypeScript and functional components.**
- **Use Tailwind CSS for styling.**
- **Check this README and code comments for guidance.**
- **Ask questions or propose changes via GitHub issues or PRs.**

---