# 📘 WebSocket Chat Application — Master Notes & Interview Guide

> **Tech Stack:** Node.js, Express.js, MySQL / PostgreSQL, WebSockets (`ws` / `socket.io`), JWT, Bcryptjs  
> **Authors:** Krish & Aarushi ✨  

---

## 📑 Table of Contents
1. [Architecture Overview (MVC Pattern)](#1-architecture-overview-mvc-pattern)
2. [Module 1: User Registration (`registerUser`)](#2-module-1-user-registration-registeruser)
3. [Module 2: User Login & JWT (`loginUser`)](#3-module-2-user-login--jwt-loginuser)
4. [Module 3: JWT Middleware (`verifyToken`)](#4-module-3-jwt-middleware-verifytoken)
5. [Module 4: Chat Database Schema (`rooms` & `messages`)](#5-module-4-chat-database-schema-rooms--messages)
6. [Deep Dive: Bcrypt vs General Hashing](#6-deep-dive-bcrypt-vs-general-hashing)
7. [Deep Dive: How JSON Web Tokens (JWT) Work](#7-deep-dive-how-json-web-tokens-jwt-work)
8. [Deep Dive: Foreign Keys, Relationships & CASCADE](#8-deep-dive-foreign-keys-relationships--cascade)
9. [Security Best Practices Learned](#9-security-best-practices-learned)
10. [Interview Prep: Ready-to-Speak Scripts](#10-interview-prep-ready-to-speak-scripts)
11. [Top Technical Interview Questions & Answers (Q&A)](#11-top-technical-interview-questions--answers-qa)

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

## 3. Module 2: User Login & JWT (`loginUser`)

### 🧠 Logic Mind Map
```
🔑 loginUser
  ├── 📨 1. Receive Inputs (email, password)
  ├── 🛡️ 2. Validate & Find User
  │     ├── Empty fields? ────────────► ❌ 400 Bad Request
  │     └── Find by Email (DB) ───────► ❌ 400 'Invalid email or password' (if not found)
  ├── 🔒 3. Compare Password
  │     └── bcrypt.compare(pass, hash) ──► ❌ 400 'Invalid email or password' (if mismatch)
  ├── 🎫 4. Generate JWT Token
  │     └── jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' })
  └── 📤 5. Output Response
        ├── Success ──────────────────► ✅ 200 OK (token, user without password)
        └── Catch Block ──────────────► ⚠️ 500 Internal Server Error
```

### 💡 Core Code Snippet (`authController.js`)
```javascript
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await FindbyEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

---

## 4. Module 3: JWT Middleware (`verifyToken`)

### 🧠 Logic Mind Map
```
🛡️ verifyToken (Middleware — The Gatekeeper)
  ├── 📨 1. Read Authorization Header
  │     └── Missing or no 'Bearer'? ───► ❌ 401 'Access denied. No token'
  ├── ✂️ 2. Extract Token
  │     └── authHeader.split(' ')[1]
  ├── 🔍 3. Verify Token
  │     └── jwt.verify(token, JWT_SECRET)
  │           └── Invalid / Expired? ───► ❌ 403 'Invalid or expired token'
  ├── 👤 4. Attach User to Request
  │     └── req.user = decoded (id, username)
  └── ⏩ 5. Call next()
        └── Proceeds to the actual Controller / Route Handler
```

### 💡 Core Code Snippet (`middleware/verifyToken.js`)
```javascript
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "Access denied. No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;  // Now any controller can access req.user.id, req.user.username
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
```

### 🔗 How to Use in Routes
```javascript
// Any route that needs authentication:
router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({ user: req.user });
});
```

---
## 5. Module 4: Chat Database Schema (`rooms` & `messages`)

### 🧠 Entity Relationship Mind Map
```
🗄️ Chat Database Schema
  │
  ├── 👤 users (Phase 1 ✅)
  │     ├── id (PK, AUTO_INCREMENT)
  │     ├── username (UNIQUE)
  │     ├── email (UNIQUE)
  │     └── password (hashed, VARCHAR 255)
  │
  ├── 🏠 rooms (Phase 2 — NEW)
  │     ├── id (PK, AUTO_INCREMENT)
  │     ├── name (UNIQUE — no duplicate rooms)
  │     ├── created_by (FK → users.id)
  │     └── created_at (auto TIMESTAMP)
  │
  └── 💬 messages (Phase 2 — NEW)
        ├── id (PK, AUTO_INCREMENT)
        ├── room_id (FK → rooms.id)
        ├── user_id (FK → users.id)
        ├── content (TEXT — message body)
        └── created_at (auto TIMESTAMP)
```

### 💡 SQL Queries
```sql
-- Table 1: Chat Rooms
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Table 2: Chat Messages
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 🔑 Key SQL Concepts Used
| Concept | Meaning |
| :--- | :--- |
| **`PRIMARY KEY (PK)`** | Unique identifier for each row. Auto-increments so we never set it manually. |
| **`FOREIGN KEY (FK)`** | Links a column to another table's Primary Key, creating a relationship. |
| **`ON DELETE CASCADE`** | If the referenced row (e.g., a user) is deleted, all related rows (messages, rooms) are automatically deleted too. |
| **`UNIQUE`** | Prevents duplicate values in a column (no two rooms with the same name). |
| **`TEXT`** | Stores large strings (messages can be long), unlike `VARCHAR(255)` which has a limit. |
| **`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`** | Automatically records the exact date & time when a row is inserted. |

---

## 6. Deep Dive: Bcrypt vs General Hashing

### ❓ What is the difference?
- **Hashing (e.g., MD5, SHA-256):** A general one-way function designed for **speed and data integrity**. Because it is fast, attackers can calculate billions of hashes per second using GPUs and **Rainbow Tables**.
- **Bcrypt:** A cryptographic hashing algorithm designed **specifically for passwords**.

### 🔑 Why Bcrypt is Superior for Passwords:
1. **Automatic Unique Salting:** Every password gets a random salt attached before hashing. Even if 100 users have the password `"secret123"`, every single hash in the database will look completely different.
2. **Adaptive Work Factor (Salt Rounds):** Bcrypt is intentionally slow. We use 10 rounds (~100ms per hash), making brute-force cracking mathematically infeasible.

---

## 7. Deep Dive: How JSON Web Tokens (JWT) Work

A JWT consists of 3 parts separated by dots (`.`): `Header.Payload.Signature`
1. **Header:** Contains the algorithm (`HS256`) and token type (`JWT`).
2. **Payload:** Contains non-sensitive claims (`userId`, `username`, expiration `exp`). *Note: Base64-encoded, NOT encrypted — never store passwords here!*
3. **Signature:** `HMACSHA256(base64(Header) + "." + base64(Payload), SECRET_KEY)`. Ensures the token cannot be tampered with by clients.

---

## 8. Deep Dive: Foreign Keys, Relationships & CASCADE

### Why Foreign Keys Matter:
Without Foreign Keys, your database has **no rules**. Someone could insert a message with `user_id = 999` even if no user with ID 999 exists. Foreign Keys enforce **Referential Integrity** — every relationship must point to a real, existing row.

### CASCADE Types:
| Type | What Happens When Parent Row is Deleted |
| :--- | :--- |
| **`ON DELETE CASCADE`** | Child rows are **automatically deleted** (Used in our app: user deleted → their messages deleted). |
| **`ON DELETE SET NULL`** | Child row's FK column becomes `NULL` (e.g., "deleted user" but keep the message). |
| **`ON DELETE RESTRICT`** | **Blocks** the parent deletion if children exist (strictest option). |

---

## 9. Security Best Practices Learned

| Security Rule | Why it is mandatory |
| :--- | :--- |
| **Never store plain text passwords** | Protects user credentials even if the database is leaked. |
| **Parameterized Queries (`?`)** | Prevents **SQL Injection** attacks completely. |
| **Fail-Fast Validation** | Reject invalid requests early to save database CPU cycles. |
| **Never return passwords in response** | Sensitive credentials should never leave the server. |
| **Generic Error Messages on Auth** | Return *"Invalid email or password"* to prevent **User Enumeration**. |
| **Keep JWT Payload Clean** | Only include non-sensitive IDs in JWT to prevent data leaks. |

---

## 10. Interview Prep: Ready-to-Speak Scripts

### 🎙️ How to explain `registerUser` & `loginUser` to an Interviewer:
> *"In my authentication system, I implemented registration and login controllers following the **MVC pattern** and the **fail-fast principle**.*
>
> - *For registration: I validate input fields, check for unique constraints on email and username, and hash passwords using `bcrypt` with 10 salt rounds before saving via parameterized queries.*
> - *For login: I retrieve the user, securely compare passwords using `bcrypt.compare`, and issue a signed **JWT token** with an expiration of 7 days.*
> - *To protect against user enumeration attacks, I provide generic error messages (`Invalid email or password`) regardless of whether the email or password was incorrect.*
> - *Sensitive fields like passwords are systematically omitted from the client response payload."*

---

## 11. Top Technical Interview Questions & Answers (Q&A)

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

### ❓ Q4: What is "User Enumeration" and how did we prevent it?
> **Answer:** User Enumeration is when an attacker tests random email addresses to see which ones are registered on the platform. If the API returns *"Email does not exist"* vs *"Wrong password"*, the attacker confirms the email exists. We prevent this by returning a generic message: `"Invalid email or password"` in all failure scenarios.

---

### ❓ Q5: Is the JWT Payload encrypted? Can anyone read it?
> **Answer:** **No, JWT payload is Base64Url-encoded, NOT encrypted.** Anyone with the token can decode and view the payload data. Security relies on the **Signature**, which guarantees the data was not modified. Therefore, sensitive information like passwords or credit card details should NEVER be placed in a JWT payload.

---

### ❓ Q6: What is the difference between Authentication (AuthN) and Authorization (AuthZ)?
> **Answer:**
> - **Authentication (AuthN):** Verifying **who you are** (e.g., Registering, Logging in with email & password, verifying identity).
> - **Authorization (AuthZ):** Verifying **what you are allowed to access** (e.g., verifying JWT token permissions, checking if a user is an Admin or allowed into a private chat room).

---

### ❓ Q7: What is Express Middleware and why is `verifyToken` a middleware?
> **Answer:** Express middleware is a function that sits between the incoming HTTP request and the route handler. It has access to `req`, `res`, and a `next()` function. Our `verifyToken` middleware intercepts every request to protected routes, validates the JWT token, attaches the decoded user payload to `req.user`, and only calls `next()` if the token is valid. If not, it short-circuits the request with a `401` or `403` response, ensuring unauthorized users never reach the controller logic.

---

### ❓ Q8: Why do we use `401 Unauthorized` vs `403 Forbidden` — what's the difference?
> **Answer:**
> - **401 Unauthorized:** The client did NOT provide any credentials (no token at all). *"Who are you? I don't know you."*
> - **403 Forbidden:** The client DID provide a token, but it's invalid, expired, or lacks permission. *"I know who you are, but you're not allowed."*

---

### ❓ Q9: What is a Foreign Key and why is it important in a chat application?
> **Answer:** A Foreign Key is a column that creates a link between two tables by referencing the Primary Key of another table. In our chat app, `messages.user_id` references `users.id`, ensuring every message belongs to a real, existing user. Without Foreign Keys, orphan records (messages from non-existent users) could corrupt data integrity.

---

### ❓ Q10: What is `ON DELETE CASCADE` and when would you NOT use it?
> **Answer:** `ON DELETE CASCADE` automatically deletes all child rows when the parent row is deleted. For example, deleting a chat room also deletes all its messages. You would **NOT** use it when you want to preserve history — for example, in an e-commerce app, you wouldn't want to delete all orders when a user deletes their account. In that case, you'd use `ON DELETE SET NULL` or `ON DELETE RESTRICT`.
