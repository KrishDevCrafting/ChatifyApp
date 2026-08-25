# 📘 WebSocket Chat Application — Master Notes & Interview Guide

> **Tech Stack:** Node.js, Express.js, MySQL / PostgreSQL, WebSockets (`ws` / `socket.io`), JWT, Bcryptjs  
> **Authors:** Krish & Aarushi ✨  

---

## 📑 Table of Contents
1. [Architecture Overview (MVC Pattern)](#1-architecture-overview-mvc-pattern)
2. [Module 1: User Registration (`registerUser`)](#2-module-1-user-registration-registeruser)
3. [Deep Dive: Bcrypt vs General Hashing](#3-deep-dive-bcrypt-vs-general-hashing)
4. [Security Best Practices Learned](#4-security-best-practices-learned)
5. [Interview Prep: Ready-to-Speak Scripts](#5-interview-prep-ready-to-speak-scripts)

---

## 1. Architecture Overview (MVC Pattern)

We follow the **Model-View-Controller (MVC)** design pattern:
- **Models (`/models`):** Handles all raw database queries using parameterized SQL (`?` placeholders).
- **Controllers (`/controller`):** Handles business logic, validation, hashing, JWT creation, and response formatting.
- **Routes (`/routes`):** Maps HTTP methods and endpoint paths to controller functions.

```
Client (Postman/Frontend)
         │
         ▼ (HTTP Request)
   Routes (`/routes/authRoutes.js`)
         │
         ▼
   Controllers (`/controller/authController.js`) ──► Validations, Bcrypt Hashing, JWT
         │
         ▼
   Models (`/models/users.js`) ──────────────────────► Database Queries (MySQL/PostgreSQL)
```

---

## 2. Module 1: User Registration (`registerUser`)

### 🧠 Logic Mind Map
```
🔐 registerUser
  ├── 📨 1. Receive Inputs (username, email, password)
  ├── 🛡️ 2. Validation & Duplicate Checks
  │     ├── Empty fields? ──────► ❌ 400 Bad Request
  │     ├── Email exists? ──────► ❌ 400 'Email in use'
  │     └── Username exists? ──► ❌ 400 'Username taken'
  ├── 🔒 3. Security (Bcrypt Hashing)
  │     ├── genSalt(10)
  │     └── hash(password, salt)
  ├── 💾 4. Database Insert (Model Layer)
  │     └── create(username, email, hash)
  └── 📤 5. Output Response
        ├── Success ───────────► ✅ 201 Created (userId)
        └── Catch Block ───────► ⚠️ 500 Internal Server Error
```

### 💡 Core Code Snippet (`authController.js`)
```javascript
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Fail-fast validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Uniqueness checks
    const existingEmail = await FindbyEmail(email);
    if (existingEmail) return res.status(400).json({ message: "Email is already in use" });

    const existingUser = await findByUsername(username);
    if (existingUser) return res.status(400).json({ message: "Username is already taken" });

    // 3. Salted Bcrypt Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Persistence via Model
    const result = await create(username, email, hashedPassword);

    return res.status(201).json({
      message: "User registered successfully!",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

---

## 3. Deep Dive: Bcrypt vs General Hashing

### ❓ What is the difference?
- **Hashing (e.g., MD5, SHA-256):** A general one-way function designed for **speed and data integrity**. Because it is fast, attackers can calculate billions of hashes per second using GPUs and **Rainbow Tables**.
- **Bcrypt:** A cryptographic hashing algorithm designed **specifically for passwords**.

### 🔑 Why Bcrypt is Superior for Passwords:
1. **Automatic Unique Salting:** Every password gets a random salt attached before hashing. Even if 100 users have the password `"secret123"`, every single hash in the database will look completely different.
2. **Adaptive Work Factor (Salt Rounds):** Bcrypt is intentionally slow. We use 10 rounds (~100ms per hash), making brute-force cracking mathematically infeasible.

---

## 4. Security Best Practices Learned

| Security Rule | Why it is mandatory |
| :--- | :--- |
| **Never store plain text passwords** | Protects user credentials even if the database is leaked. |
| **Parameterized Queries (`?`)** | Prevents **SQL Injection** attacks completely. |
| **Fail-Fast Validation** | Reject invalid requests early to save database CPU cycles. |
| **Never return passwords in response** | Sensitive credentials should never leave the server. |

---

## 5. Interview Prep: Ready-to-Speak Scripts

### 🎙️ How to explain `registerUser` to an Interviewer:
> *"In my authentication system, I implemented the user registration controller following the **MVC pattern** and the **fail-fast principle**.*
>
> 1. *I first validate that `username`, `email`, and `password` exist in `req.body`, returning an early `400 Bad Request` if any are missing.*
> 2. *I perform duplicate conflict checks on both email and username against the database.*
> 3. *For password security, I never store plain text. I use `bcrypt` with 10 salt rounds to generate a salted one-way hash, protecting against Rainbow Table attacks.*
> 4. *The data is saved through the model layer using parameterized SQL queries to prevent SQL Injection.*
> 5. *Finally, a semantic `201 Created` status with the new `userId` is returned, with the entire flow safeguarded inside a `try...catch` error handler."*

---

## 6. Top Technical Interview Questions & Answers (Q&A)

### ❓ Q1: Why use `bcrypt` instead of `crypto.createHash('sha256')` for passwords?
> **Answer:** SHA-256 is designed for fast hashing (data integrity / checksums). Because modern GPUs can calculate billions of SHA-256 hashes per second, attackers can easily brute-force passwords or use precomputed **Rainbow Tables**.  
> In contrast, `bcrypt` is **intentionally slow**, adds a **unique cryptographic salt automatically**, and allows us to configure an **adaptive work factor (cost)**, making brute-force cracking practically impossible.

---

### ❓ Q2: What are "Salt Rounds" in bcrypt, and what happens if you set it too high (e.g., 20) or too low (e.g., 4)?
> **Answer:** Salt rounds define the cost factor ($2^{\text{rounds}}$ iterations).
> - **10 rounds:** $2^{10} = 1,024$ iterations (~80-100ms per hash) — **Industry Standard**.
> - **Too Low (e.g., 4):** $2^4 = 16$ iterations (~1ms). Fast but easy for attackers to brute force.
> - **Too High (e.g., 20):** $2^{20} = 1,048,576$ iterations (~several seconds per request). This would **block the Node.js event loop / CPU threads** and cause severe server lag or Denial of Service (DoS).

---

### ❓ Q3: How do Parameterized Queries (`?`) prevent SQL Injection?
> **Answer:** In parameterized queries, the SQL statement and the user-supplied data are sent to the database engine separately:
> 1. The database compiles the SQL query structure first (`SELECT * FROM users WHERE email = ?`).
> 2. The input values are treated strictly as **literal data values**, never as executable SQL commands — even if the user inputs `' OR '1'='1`.

---

### ❓ Q4: What is the "Fail-Fast" approach in backend controllers?
> **Answer:** Fail-fast means validating incoming request payloads immediately at the entry point (e.g., checking for missing fields or invalid email formats) before executing database queries or expensive business logic. This saves server CPU cycles, frees up database connections, and reduces latency.

---

### ❓ Q5: Why return HTTP `201 Created` instead of `200 OK` on registration?
> **Answer:** In RESTful API design standards:
> - `200 OK` indicates general request success (like fetching data or updating an existing item).
> - `201 Created` explicitly signifies that a **new resource was successfully created and persisted** in the database, often returning the generated resource ID.

---

### ❓ Q6: What is the difference between Authentication (AuthN) and Authorization (AuthZ)?
> **Answer:**
> - **Authentication (AuthN):** Verifying **who you are** (e.g., Registering, Logging in with email & password, verifying identity).
> - **Authorization (AuthZ):** Verifying **what you are allowed to access** (e.g., verifying JWT token permissions, checking if a user is an Admin or allowed into a private chat room).

