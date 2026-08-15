# WeddingPass

> Elegant digital wedding invitations, RSVP tracking, and secure QR-code entry management — all in one platform.

## Overview

WeddingPass is a modern web application that helps couples design beautiful digital wedding invitations, distribute unique entry tickets to every guest, track RSVPs in real time, and verify attendance at the venue using QR codes.

Whether you are planning an intimate ceremony or a large celebration, WeddingPass replaces paper invitations, manual guest lists, and printed tickets with a seamless, fully digital experience.

## Key Features

- **Digital Invitation Cards** — Design elegant, customizable invitation cards with wedding details, event schedule, photo gallery, and a live countdown.
- **QR-Code Entry Tickets** — Every guest receives a unique, non-transferable ticket with a QR code that encodes their personal invitation link.
- **Guest Management** — Add, import, categorize, and search guests with support for families, friends, partners, colleagues, VIPs, and more.
- **RSVP Tracking** — Guests respond with a single click; organizers see live attendance analytics and are notified instantly of every response.
- **Venue Check-In** — Scan guest QR codes at the entrance to verify entry, prevent duplicate admission, and maintain a full check-in log — with offline mode support.
- **Notifications** — Organizers receive real-time notifications whenever a guest confirms, declines, or updates their RSVP.
- **Beautiful Templates** — Choose from modern, traditional, romantic, and Ethiopian-inspired invitation designs, with light and dark themes.
- **Download & Share** — Guests can save their invitation as a PNG or PDF and share it via WhatsApp, Telegram, email, or a simple link.

## Technology Stack

- **Frontend Framework** — React 18 with TypeScript
- **Build Tooling** — Vite
- **Styling** — Tailwind CSS
- **UI & Animations** — Framer Motion, Lucide React icons
- **Forms & Validation** — React Hook Form, Zod
- **Routing** — React Router
- **Backend & Database** — Supabase (PostgreSQL, authentication, Row-Level Security, and storage)
- **QR Code & Scanning** — qrcode, html5-qrcode
- **Document Export** — html2canvas, jsPDF
- **Data Visualization** — Recharts
- **Deployment** — Vercel

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase project with the schema migrations applied

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key

# 3. Run the development server
npm run dev
```

### Build for production

```bash
npm run build
npm run preview
```

## Environment Variables

| Variable                  | Description                          |
| ------------------------- | ------------------------------------ |
| `VITE_SUPABASE_URL`       | Your Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY`  | Your Supabase anon (public) API key  |

## License

This project is private and proprietary.