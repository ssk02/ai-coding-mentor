# 🤖 AI Coding Mentor

An agentic, full-stack AI coding mentor that helps users learn programming through interactive, multi-turn conversations with persistent memory.

## 🚀 Features
- User authentication using JWT
- Protected AI chat APIs
- Agentic conversation flow with memory
- Pluggable AI service (Mock / OpenAI)
- Persistent chat history using MySQL
- Simple frontend for demo using EJS

## 🧠 Agentic Design
- Each chat session is stored as a conversation
- User and assistant messages are saved in the database
- Context is preserved across multiple messages
- AI layer can switch between mock and production modes

## 🛠 Tech Stack
- Backend: Node.js, Express
- Database: MySQL
- Authentication: JWT, bcrypt
- AI: OpenAI API (mock supported)
- Frontend: EJS
- Version Control: Git, GitHub

## ⚙️ Setup Instructions

npm install

Create a .env file:
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_coding_mentor
JWT_SECRET=your_secret
AI_MODE=mock

Run the server:
npx nodemon server.js

Open in browser:
http://localhost:5000

##📌 Future Enhancements
-React frontend
-Code debugging assistant
-Dockerized deployment
-Role-based dashboards

👤 Author
Shreyas Kulkarni
