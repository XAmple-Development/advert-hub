# 🚀 Advert Hub by X-Ample Development

Advert Hub is a modern and powerful platform built to manage and showcase Discord server and bot advertisements. Built by [X-Ample Development](https://x-ampledevelopment.co.uk), this project is ideal for communities looking to create a feature-rich hub for promoting bots, servers, or services in the Discord ecosystem.

![License](https://img.shields.io/github/license/XAmple-Development/advert-hub?style=for-the-badge)
![Stars](https://img.shields.io/github/stars/XAmple-Development/advert-hub?style=for-the-badge)
![Last Commit](https://img.shields.io/github/last-commit/XAmple-Development/advert-hub?style=for-the-badge)
[![Netlify Status](https://api.netlify.com/api/v1/badges/26e254ed-9f9e-46a4-a3db-399c5148be96/deploy-status)](https://app.netlify.com/projects/adverthubwebsite/deploys)
---

## ✨ Features

- 🛠️ Modern and sleek frontend interface
- 🔐 Discord OAuth2 authentication
- 📤 Submit & manage Discord bots and servers
- 🗳️ Voting system with cooldowns and vote tracking
- 🔍 Search, sort, and filter across listings
- 🧾 Tags, descriptions, invite links, and more
- 📊 Admin dashboard with moderation tools
- 📡 Live status integration via BetterStack
- 💡 Group-based benefits (e.g. verified bots)
- 💾 MySQL/Supabase compatible

---

## 📸 Preview

> *(Add screenshots or preview GIFs of your site here)*

---

## 🧰 Tech Stack

- **Frontend:** React, TailwindCSS, ShadCN/UI
- **Backend:** Supabase (optional: Node.js API)
- **Database:** Supabase PostgreSQL / MySQL
- **Auth:** Discord OAuth2
- **Hosting:** Netlify, VPS, or custom environment

---

## ⚙️ Getting Started

### 🔐 Prerequisites

Make sure you have the following installed:

- Node.js v18+
- Git
- Supabase project (or MySQL DB)
- Discord Developer Portal App

---

### 📦 Installation

Clone the repository:

```git clone https://github.com/XAmple-Development/advert-hub.git
cd advert-hub
npm install
```
🔧 Environment Setup
Create a .env file at the root of your project:

env
Copy
Edit
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Discord OAuth2
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional Stripe (for premium features)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
▶️ Start Development Server
bash
Copy
Edit
npm run dev
The app will be live at http://localhost:3000.

📁 Project Structure
bash
Copy
Edit
advert-hub/
├── components/          # Reusable UI components
├── pages/               # Next.js pages (routes)
├── hooks/               # Custom React hooks
├── lib/                 # Helper functions and API clients
├── public/              # Static assets
├── styles/              # TailwindCSS / global styles
├── .env                 # Environment variables
└── supabase/            # Supabase client setup
🛡️ License
This project is licensed under the MIT License.

🤝 Contribution
Contributions are welcome!

Fork the repo

Create a new branch (git checkout -b feature/my-feature)

Commit your changes (git commit -am 'Add new feature')

Push to the branch (git push origin feature/my-feature)

Open a Pull Request

👥 About X-Ample Development
X-Ample Development is a UK-based development company building custom software, game server tools, web platforms, and bots.

🌐 Website: [X-Ample Development](https://x-ampledevelopment.co.uk)

💬 Discord: [X-Ample Discord](https://discord.gg/3mNGT2AwNy)

🛒 Marketplace: [Coming Soon]

📣 Twitter: @XAmpleDev

📬 Contact
For support, partnerships, or custom development:

📧 [Email Us](mailto:info@x-ampledevelopment.co.uk)

Made with 💙 by the X-Ample Development Team
