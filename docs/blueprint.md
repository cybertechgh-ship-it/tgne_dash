# **App Name**: DevDash Connect

## Core Features:

- Client Manager: Add, edit, or delete client profiles, including business name, contact details, and notes.
- Website Project Details: Manage website information for each client, such as domain, hosting, platform, project price, and payment status.
- Secure Credentials Vault: Store and securely access login credentials for cPanel, hosting, domain registrars, and WordPress admin. Features password masking, show/hide toggles, and copy-to-clipboard, with simulated encryption.
- Renewal and Reminder System: Track domain expiry and hosting renewals. The system highlights upcoming renewals and triggers alerts based on the current date.
- Task Management: Create and manage tasks per client with configurable statuses like pending, in progress, or completed.
- AI Assistant Tool (Simulated): A chat panel AI tool that accepts natural language input (e.g., 'Show clients with unpaid invoices' or 'Add task for Kofi') and performs actions based on parsed intent using local data.
- Local Data Persistence & Management: Handles CRUD operations on mock JSON data structures, persisting changes locally using LocalStorage or IndexedDB and allowing import/export.

## Style Guidelines:

- A sophisticated light color scheme that emphasizes clarity and professionalism. Primary interactions use a muted yet deep blue (#4A7289) to instill trust and focus, resonating with a modern tech aesthetic.
- The background color is a very light, desaturated cool gray (#ECF1F3), providing a clean canvas that promotes readability and a premium feel, subtly echoing the primary blue hue.
- An accent color of vibrant yet soft purple (#8585E3) is used for key interactive elements and alerts, providing a creative and energetic counterpoint to the primary blue, ensuring crucial information stands out.
- The entire application will use the 'Inter' font (sans-serif) for both headlines and body text, providing excellent legibility and a sleek, contemporary feel consistent with premium SaaS platforms.
- Employ a consistent set of clean, minimalist line icons across the dashboard to maintain a modern, uncluttered interface aligned with the 'Stripe / Notion' aesthetic.
- Implement a clear sidebar navigation system with distinct sections for dashboard, clients, credentials, tasks, reminders, and the AI Assistant. The layout will be fully responsive to ensure a seamless experience across all device sizes.
- Include subtle animations, such as a simulated typing animation for the AI assistant and gentle transitions for filtering data or opening/closing panels, to enhance the perceived responsiveness and premium feel.