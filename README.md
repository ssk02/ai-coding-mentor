# 🤖 AI Coding Mentor

An agentic, full-stack AI coding mentor platform that enables users to learn programming through interactive, multi-turn conversations with persistent memory and contextual guidance.

---

## 🚀 Overview

**AI Coding Mentor** is designed to simulate a real coding mentor experience.
It supports conversation continuity, secure authentication, pluggable AI providers, and production deployment architecture.

The system stores chat context, adapts responses to user skill level, and can operate in both **mock** and **live AI** modes for cost-controlled development.

---

## ✨ Core Features

* 🔐 User authentication with JWT
* 🧠 Persistent multi-turn AI conversations
* 💬 Conversation history & session tracking
* 🗄 MySQL database storage
* 🔌 Pluggable AI layer (Mock / OpenAI)
* 🛡 Protected chat APIs
* ⚡ Real-time chat interface
* ☁️ Cloud-deployment ready architecture

---

## 🧠 Agentic Architecture

The platform follows an **agentic conversation model**:

* Each user session creates a unique **conversation**
* Messages are stored as **user ↔ assistant exchanges**
* Context is preserved across multiple prompts
* AI responses adapt using stored conversation history
* AI provider can be switched without changing core logic

---

## 🛠 Tech Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Backend         | Node.js, Express.js         |
| Database        | MySQL                       |
| Authentication  | JWT, bcrypt                 |
| AI Integration  | OpenAI API (Mock supported) |
| Frontend (Demo) | EJS                         |
| Version Control | Git, GitHub                 |
| Deployment      | Render, Railway, Vercel     |

---

## 📂 Project Structure

```
ai-coding-mentor/
│
├── config/          # Database configuration
├── controllers/    # Route controllers
├── routes/         # API route definitions
├── middleware/     # Auth middleware
├── services/       # AI service layer
├── frontend/       # UI (React / EJS demo)
├── server.js       # Entry point
└── .env            # Environment variables
```

---

## ⚙️ Setup Instructions

### 1️⃣ Install dependencies

```bash
npm install
```

---

### 2️⃣ Create environment file

Create a `.env` file in the root directory:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_coding_mentor

JWT_SECRET=your_secret_key

# AI Mock mode
AI_MODE=mock   # use "live" for OpenAI
OPENAI_API_KEY=your_key_if_live
```

---

### 3️⃣ Run the server

```bash
npx nodemon server.js
```

---

### 4️⃣ Access the app

```
http://localhost:5000
```

---

## 🔁 AI Modes

### Mock Mode (No billing)

Used for testing without API costs.

```env
AI_MODE=mock
```

Returns structured teaching responses without calling OpenAI.

---

### Live AI Mode

```env
AI_MODE=live
OPENAI_API_KEY=your_key
```

Enables real AI mentor responses via OpenAI.

---

## 💾 Database Design

**Users**

* user_id
* name
* email
* password
* skill_level
* preferred_language

**Conversations**

* conversation_id
* user_id
* title
* created_at

**Messages**

* message_id
* conversation_id
* sender
* message_text
* created_at

---

## ☁️ Deployment Architecture

| Service | Role             |
| ------- | ---------------- |
| Vercel  | Frontend hosting |
| Render  | Backend API      |
| Railway | MySQL database   |

Environment variables are configured per platform.

---

## 📌 Future Enhancements

* React production frontend
* Code debugging assistant
* File upload & code analysis
* Typing indicators & avatars
* Docker containerization
* Role-based dashboards
* Multi-model AI routing

---

## 🧪 Testing Capabilities

* Mock AI responses
* API route testing
* Auth token validation
* Conversation persistence checks

---

## 👤 Author

**Shreyas Kulkarni**
Full Stack Developer • AI Integration Enthusiast

---

## 📄 License

This project is for educational and portfolio use. Add an MIT license if distributing publicly.
