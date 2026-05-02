# Divvy 

> AI-powered bill splitting app that keeps friendships intact.

## Team members
ID: 230103074 Yerdaulet Amanbay \
ID: 230103277 Dias Izdibayev \
ID: 230103107 Alikhan Bissenov \
ID: 230103059 Nursanat Mussa
---

## Problem Statement

Splitting bills among friends is awkward, error-prone, and often leads to misunderstandings. Who ordered what? Did someone include the tip? Divvy eliminates the friction by using Computer Vision to scan receipts and automatically calculate exactly who owes what — fairly and instantly.

---

## Features

-  **AI Receipt Scanning** — Snap a photo of any receipt and let Computer Vision extract all items, prices, names, quantities
-  **Fair Bill Splitting** — Split by individual items, equal shares, or custom amounts
-  **Group Orders** — Handle complex orders across large friend groups with ease
-  **Debt Tracking** — Always know who owes what at a glance
-  **User Authentication** — Sign up with email, Google, or Apple

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend UI framework |
| Tailwind CSS | Styling and responsive design |
| Figma | UI/UX design |
| JavaScript (ES6+) | Application logic |

---

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/divvy-frontend.git
cd divvy-frontend/divvy
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

4. **Open in browser**
```
http://localhost:3000
```

---

## Usage

1. Open the app in your browser
2. Click **"Scan a Check"** to simulate scanning a receipt
3. Click **"Get Started"** to create an account
4. Navigate sections using the top navigation bar:
   - **Features** — See what Divvy can do
   - **How It Works** — 4-step walkthrough
   - **Community** — Subscribe for updates

---


---

## Project Structure

```
divvy/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main component (all components in one file)
│   ├── index.js        # React entry point
│   ├── index.css       # Tailwind imports
|   └── imgs
│     ├── img1.jpg        # Hero image assets
│     ├── img2.png
│     ├── img3.png
│     ├── img5.jpg
│     └── dollar.svg      # Decorative vector
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---
