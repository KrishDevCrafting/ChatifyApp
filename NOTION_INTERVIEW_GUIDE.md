# 🚀 Full-Stack & Backend Developer — Master Interview Guide (Notion Ready)

> **Candidate:** Krish Singh  
> **Core Stack:** Node.js, Express.js, React.js, WebSockets (Socket.IO), MySQL, PostgreSQL, Cloudinary, JWT  
> **Target Roles:** Full-Stack Developer Intern, Backend Engineer (SDE-1)

---

## 📑 Table of Contents
1. [The "Tell Me About Yourself" & Project Pitches](#1-the-tell-me-about-yourself--project-pitches)
2. [Real-Time Systems & WebSockets (Socket.IO)](#2-real-time-systems--websockets-socketio)
3. [Node.js & Express Architecture](#3-nodejs--express-architecture)
4. [Database & SQL Mastery (MySQL / PostgreSQL)](#4-database--sql-mastery-mysql--postgresql)
5. [Security & Authentication (JWT, Bcrypt, IDOR)](#5-security--authentication-jwt-bcrypt-idor)
6. [Frontend & React Engineering](#6-frontend--react-engineering)
7. [Behavioral & Real Bug Stories](#7-behavioral--real-bug-stories)

---

# 1. The "Tell Me About Yourself" & Project Pitches

### 🎙️ Q: "Tell me about yourself."
> **Best Answer (Spoken in 60–90 seconds):**  
> *"Hi, I'm Krish. I’m a Full-Stack developer specializing in Node.js, Express, React, and real-time backend systems. Over the past year, I’ve worked both as an independent developer shipping client web solutions and as a frontend intern in an Agile team.
>
> What drives me most is building high-performance, real-time products. Recently, I architected and deployed **Chatify**—a production real-time communication platform using Socket.IO, MySQL, and Cloudinary CDN, where I implemented dual-layer JWT authentication and room-level IDOR security. I also built **Tatvra**, a modular e-commerce RESTful backend.
>
> I love taking complete ownership from database schema design to cloud deployment, and I’m looking for an engineering role where I can jump straight into high-impact sprints and build scalable products."*

---

### 🎙️ Q: "Can you explain the architecture of your project Chatify?"
> **Best Answer:**  
> *"Chatify is an end-to-end real-time workspace chat application built on the MVC (Model-View-Controller) pattern.
>
> • **Frontend:** React 19 with Tailwind CSS, deployed on Vercel Edge. Features mobile-first drawers, persistent light/dark themes, active room states, and instant message rendering.  
> • **Backend:** Node.js and Express server with Socket.IO, deployed on Render.  
> • **Database:** TiDB Cloud / MySQL using parameterized SQL queries with `ON DELETE CASCADE` relational integrity.  
> • **Media Pipeline:** Integrated Multer with Cloudinary v2 SDK using streaming buffers and automated transformations (`quality: auto, fetch_format: auto`), reducing image payloads by ~75% before CDN delivery.  
> • **Security:** Implemented dual-layer authentication: stateless HTTP route verification for REST endpoints and handshake-level authentication (`io.use`) on WebSocket connections to prevent unauthenticated socket access."*

---

# 2. Real-Time Systems & WebSockets (Socket.IO)

### ❓ Q1: What is the difference between HTTP Polling, Long Polling, Server-Sent Events (SSE), and WebSockets?
| Feature | Short Polling | Long Polling | Server-Sent Events (SSE) | WebSockets |
| :--- | :--- | :--- | :--- | :--- |
| **Protocol** | HTTP/1.1 | HTTP/1.1 | HTTP/1.1 or HTTP/2 | `ws://` or `wss://` |
| **Direction** | Unidirectional (Client pulls) | Unidirectional (Server holds request) | Unidirectional (Server pushes to client) | **Full-Duplex (Bidirectional)** |
| **Overhead** | Very High (repeated HTTP headers) | High (connection closes after every event) | Low (single persistent HTTP connection) | **Lowest (tiny frame overhead: 2–10 bytes)** |
| **Best For** | Infrequent updates (e.g. order status check) | Legacy systems needing updates | Stock tickers, live sports scores | **Chat apps, multiplayer games, collaborative docs** |

---

### ❓ Q2: How does the WebSocket Handshake work?
> **Answer:**  
> A WebSocket connection starts as a standard HTTP request called the **"Upgrade Handshake"**:
> 1. Client sends an HTTP GET request with special headers:
>    ```http
>    GET /socket.io/ HTTP/1.1
>    Connection: Upgrade
>    Upgrade: websocket
>    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
>    Sec-WebSocket-Version: 13
>    ```
> 2. The server verifies the key and responds with **`HTTP 101 Switching Protocols`**:
>    ```http
>    HTTP/1.1 101 Switching Protocols
>    Upgrade: websocket
>    Connection: Upgrade
>    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
>    ```
> 3. After this exchange, the TCP connection remains permanently open and transitions from HTTP to the binary WebSocket framing protocol.

---

### ❓ Q3: How do you authenticate a WebSocket connection using JWT?
> **Answer:**  
> Unlike REST APIs where the JWT is passed in the `Authorization: Bearer <token>` header with every single request, WebSocket authentication happens **once during the initial connection handshake**:
> ```javascript
> // Socket.IO Middleware (Server-side)
> io.use((socket, next) => {
>   try {
>     const token = socket.handshake.auth.token;
>     if (!token) return next(new Error("Authentication error: No token provided"));
>     
>     const decoded = jwt.verify(token, process.env.JWT_SECRET);
>     socket.user = decoded; // Attach user to socket instance
>     next();
>   } catch (err) {
>     return next(new Error("Authentication error: Invalid or expired token"));
>   }
> });
> ```
> Once verified, `socket.user` stays attached for the entire duration of the connection. If the client disconnects or the token is invalid, the connection is rejected immediately.

---

### ❓ Q4: What is the difference between `socket.emit`, `io.emit`, and `socket.broadcast.emit`?
* **`socket.emit('event', data)`**: Sends the message **only to the sender** who triggered it.
* **`io.emit('event', data)`**: Broadcasts the message to **everyone connected to the server**.
* **`socket.broadcast.emit('event', data)`**: Sends the message to **everyone EXCEPT the sender**.
* **`io.to(room).emit('event', data)`**: Sends the message to **all sockets joined in a specific room**.

---

### ❓ Q5: How do you scale Socket.IO across multiple server instances?
> **Answer:**  
> By default, Socket.IO stores connected socket IDs and rooms in server memory. If you run multiple server instances behind a load balancer, User A connected to Server 1 cannot emit an event to User B connected to Server 2.  
> **Solution:** Use the **Socket.IO Redis Adapter** (Pub/Sub). When Server 1 emits an event to a room, it publishes the event to Redis, which broadcasts it to Server 2 and Server 3, ensuring all instances sync events in real time.

---

# 3. Node.js & Express Architecture

### ❓ Q6: How does the Node.js Event Loop work?
> **Answer:**  
> Node.js is single-threaded using an event-driven architecture powered by **libuv**. The Event Loop processes tasks in recurring phases:
> 1. **Timers Phase:** Executes callbacks scheduled by `setTimeout()` and `setInterval()`.
> 2. **I/O Callbacks Phase:** Executes I/O-related callbacks (networking, file system).
> 3. **Poll Phase:** Retrieves new I/O events and executes their callbacks.
> 4. **Check Phase:** Executes callbacks scheduled by `setImmediate()`.
> 5. **Close Callbacks Phase:** Handles close events like `socket.on('close')`.
>
> ⚡ **Microtasks vs Macrotasks:**  
> Between every phase, the Event Loop checks the **Microtask Queue** (`process.nextTick()` and `Promise.then()` callbacks). Microtasks have highest priority and execute **immediately** before moving to the next macrotask phase.

---

### ❓ Q7: If Node.js is single-threaded, how does it handle thousands of concurrent requests?
> **Answer:**  
> Node.js uses **Non-Blocking Asynchronous I/O**. When an asynchronous operation is triggered (like a database query, network request, or disk read), Node.js offloads the heavy work to the operating system kernel or the **libuv Thread Pool** (which runs 4 background worker threads by default).  
> The main thread continues serving other incoming requests. When the I/O finishes, its callback is pushed to the Event Loop queue to be executed without freezing the server.

---

### ❓ Q8: What are Streams and Buffers, and where did you use them?
> **Answer:**  
> • **Buffer:** A temporary chunk of raw binary memory allocated outside the V8 JavaScript engine.  
> • **Stream:** A continuous sequence of data broken down into chunks, processed piece by piece without loading the entire file into RAM.  
>
> **Real-world Example in Chatify:**  
> When users upload images, we used `multer.memoryStorage()`, which captures the file as an in-memory `Buffer`. Instead of writing the file to the server disk and reading it again, we piped the buffer directly into Cloudinary's `cloudinary.uploader.upload_stream()`. This prevented disk thrashing, minimized server latency, and works on serverless/ephemeral hosts like Render.

---

# 4. Database & SQL Mastery (MySQL / PostgreSQL)

### ❓ Q9: What is SQL Injection and how do Parameterized Queries prevent it?
> **Answer:**  
> SQL Injection happens when untrusted user input is directly concatenated into a raw SQL string:
> ```sql
> -- ❌ Vulnerable query:
> "SELECT * FROM users WHERE email = '" + req.body.email + "'";
> -- If attacker inputs: ' OR '1'='1
> -- Query becomes: SELECT * FROM users WHERE email = '' OR '1'='1' (Bypasses authentication!)
> ```
> **How Parameterized Queries solve it:**  
> In parameterized queries (`pool.execute("SELECT * FROM users WHERE email = ?", [email])`), the database engine separates the **query compilation** from the **data evaluation**:
> 1. The database prepares the execution plan for the query template first.
> 2. The input parameters are inserted strictly as **literal string values**, never as executable SQL commands. Even if the parameter contains `' OR '1'='1`, the database treats it as literal text.

---

### ❓ Q10: What is `ON DELETE CASCADE` and when should you NOT use it?
> **Answer:**  
> `ON DELETE CASCADE` is a foreign key constraint rule that automatically deletes child rows when their parent row is deleted.  
> • **When TO use it:** In Chatify, when a chat room is deleted, all messages belonging to that room should be cleaned up automatically (`FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`).  
> • **When NOT to use it:** In financial, e-commerce, or audit systems. For example, in an e-commerce platform (**Tatvra**), if a customer deletes their user account, you must **NEVER** delete their previous orders, because accounting, invoicing, and inventory records depend on that data. In such cases, use `ON DELETE RESTRICT` or `ON DELETE SET NULL`.

---

### ❓ Q11: What is a Database Index and how does it affect Performance?
> **Answer:**  
> An index is a specialized data structure (typically a **B-Tree**) that creates quick pointers to rows in a table, similar to an index in a book.  
> • **Pros:** Speeds up `SELECT`, `WHERE`, `JOIN`, and `ORDER BY` operations from $O(N)$ full table scans down to $O(\log N)$ logarithmic lookups.  
> • **Trade-off:** Slows down `INSERT`, `UPDATE`, and `DELETE` operations because every time data is modified, the B-Tree index must also be rebalanced and updated on disk. It also consumes additional storage space.

---

# 5. Security & Authentication (JWT, Bcrypt, IDOR)

### ❓ Q12: Why use Bcrypt instead of standard SHA-256 for passwords?
> **Answer:**  
> 1. **Speed is the enemy of password hashing:** SHA-256 was designed to be fast for file checksums and data integrity. Modern GPUs can calculate over **10 billion SHA-256 hashes per second**, making brute-force attacks and Rainbow Table lookups trivial.  
> 2. **Bcrypt is intentionally slow (Adaptive Cost Factor):** Bcrypt uses an exponential work factor (e.g. 10 salt rounds = $2^{10} = 1,024$ iterations, taking ~80ms per password).  
> 3. **Automatic Unique Salting:** Bcrypt generates a random cryptographic salt for every password automatically and embeds it in the hash string. Even if two users choose the exact same password (`"password123"`), their resulting hashes are completely distinct.

---

### ❓ Q13: Is a JWT encrypted? Can anyone read its payload?
> **Answer:**  
> **No, a JWT payload is NOT encrypted—it is Base64Url encoded.** Anyone can decode the payload string and view the claims (e.g. `id`, `username`, `exp`).  
> The security of a JWT relies entirely on its **Cryptographic Signature** (`HMACSHA256(header + payload, SECRET_KEY)`). The signature guarantees that if a client modifies even one character in the payload, the server rejects the token because the signature check fails. Therefore, sensitive data like passwords or credit card numbers should **never** be stored in a JWT payload.

---

### ❓ Q14: What is an IDOR vulnerability and how did you prevent it in Chatify?
> **Answer:**  
> **IDOR (Insecure Direct Object Reference)** occurs when an application exposes a reference to an internal object (like a database ID) and fails to verify whether the requesting user actually owns that object.
>
> **The Vulnerability:**  
> A route like `DELETE /api/chat/rooms/:id` could allow any logged-in user to pass room ID `5` and delete another user's room.
>
> **Our Fix:**  
> We added an explicit ownership authorization check in `roomController.js`:
> ```javascript
> const room = await getRoomsId(id);
> if (!room) return res.status(404).json({ message: "Room not found" });
>
> // IDOR Protection: Verify ownership before allowing mutation
> if (room.created_by !== req.user.id) {
>   return res.status(403).json({
>     message: "Unauthorized: Only the creator can delete this room"
>   });
> }
> ```

---

# 6. Frontend & React Engineering

### ❓ Q15: How does the React Virtual DOM and Reconciliation work?
> **Answer:**  
> The Virtual DOM is a lightweight JavaScript object representation of the real browser DOM kept in memory.  
> 1. When component state changes, React re-renders and creates a new Virtual DOM tree.  
> 2. React runs a **Diffing Algorithm (Reconciliation)** comparing the new Virtual DOM with the previous Virtual DOM snapshot.  
> 3. React batches the minimal set of required changes and updates **only the modified elements in the real DOM**, preventing costly full-page browser repaints.

---

### ❓ Q16: What is a "Stale Closure" in React `useEffect`, and how did you resolve it in Chatify?
> **Answer:**  
> A stale closure happens when a callback inside `useEffect` captures variables from an earlier render because those variables were not included in the dependency array or were captured by a long-lived event listener.
>
> **Problem in Chatify:**  
> When the Socket.IO listener for `chat message` was set up in an effect with an empty dependency array `[]`, it captured the initial `activeRoom` state (`null` or `general`). When the user switched rooms, the socket callback was still reading the old room value!
>
> **Solution:**  
> We used a `useRef` to store the active room:
> ```javascript
> const activeRoomRef = useRef(activeRoom);
> useEffect(() => {
>   activeRoomRef.current = activeRoom;
> }, [activeRoom]);
>
> // Inside socket listener:
> socket.current.on("chat message", (message) => {
>   // activeRoomRef.current ALWAYS points to the freshest active room without re-binding socket listeners!
>   if (message.roomId === activeRoomRef.current?.id) { ... }
> });
> ```

---

# 7. Behavioral & Real Bug Stories

### 🎙️ Q: "Tell me about a difficult technical bug you encountered and how you solved it."
> **Best Answer (STAR Method):**  
> • **Situation:** *"While configuring our MySQL database on a recent server update to MySQL 8.4, the Node.js backend failed to connect, throwing `ERROR 1524: Plugin mysql_native_password is not loaded`."*  
> • **Task:** *"I needed to understand why authentication was rejected even with valid credentials and restore database connectivity without breaking existing application data."*  
> • **Action:** *"I inspected the MySQL 8.4 release changes and discovered that Oracle deprecated and disabled the legacy `mysql_native_password` plugin by default, migrating to `caching_sha2_password`. When our user attempted to authenticate using the legacy plugin, the server rejected it. I configured the server options via a custom drop-in config `native-pass.cnf`, verified the auth plugin migration, and restarted the daemon, successfully re-establishing the pool connection."*  
> • **Result:** *"The application connected with zero downtime, and it taught me the importance of checking LTS engine defaults when upgrading infrastructure."*

---

### 🎙️ Q: "Why do you want to join an early-stage startup instead of an established MNC?"
> **Best Answer:**  
> *"In a large company, engineers often work on small, isolated cogs of a giant system. At a startup, you have end-to-end visibility: you write the schema, build the API, optimize the UI, and see real users interact with your code within days. I enjoy high ownership, rapid shipping cycles, and solving messy real-world problems. That’s where I learn and deliver the most value."*
