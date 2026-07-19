## Node vs Express — who does what

**Node's `http` module** only knows how to do one thing: open a port
and listen for raw HTTP requests. It doesn't know about routes,
middleware, or JSON. To create a server, it needs ONE thing from you:
a function shaped like `(req, res) => {...}` that it can call every
time a request comes in.

const server = http.createServer((req, res) => {
res.end('hello')
})

**`express()` creates `app`** — and `app` IS a function with exactly
that shape: `(req, res)`. Express just builds a much smarter version
of it, with routing and middleware baked in, so you don't write raw
if/else on `req.url` yourself.

const app = express()
app.get('/pizza', handler1) // adds a route to app's internal routing table
app.use(middleware) // adds a step to app's middleware pipeline

**So passing `app` into `createServer` means:** "Node, whenever a
request arrives, call this `app` function and let IT decide what to
do (routing/middleware/response) instead of me writing that logic
by hand."

const server = http.createServer(app) // app is just the (req,res) handler
server.listen(3000) // server = actual socket, starts listening

**`app.listen(3000)` is shorthand for those last two lines combined**
— it internally does `http.createServer(this)` then `.listen()` on
the result, and returns that `http.Server` object.

## One-line summary

- `app` = routing + middleware logic (a smart request-handler function)
- `http.Server` = the actual socket that accepts connections
- `app.listen()` = glues them together and starts listening in one call

Express creates the application, but Node.js creates the actual server.Express knows when to trigger server creation.

Express is a web framework built on top of Node.js for handling HTTP requests and building web applications. To add WebSocket support, you typically use a WebSocket library such as ws or Socket.IO, which handles WebSocket upgrade requests on the underlying HTTP server.

TECHNICALLY, WHAT HAPPENS:
The server remains an HTTP server.
Some incoming HTTP requests contain an Upgrade: websocket header.
The WebSocket library intercepts those upgrade requests and switches that particular connection from HTTP to WebSocket.

So the server doesn't permanently become a "WebSocket server." It continues serving normal HTTP requests while also accepting WebSocket connections on the same port.

REMEMBER:
wss = WebSocket Server
ws = One WebSocket Connection (ws in our case is named as ws_dedicated_connection)

Think of it like this:

                 wss
                  │
        ┌─────────┼─────────┐
        │         │         │
      ws(A)     ws(B)     ws(C)
        │         │         │
    Client A   Client B   Client C

Each ws is a dedicated communication channel between the server and exactly one client.

If you have three clients:

Client A ↔ ws(A)
Client B ↔ ws(B)
Client C ↔ ws(C)

There is no single ws object shared by all three clients.

Why?

A WebSocket connection is a TCP connection underneath.

A TCP connection has exactly two endpoints:

Server <────────TCP────────> Client

One server endpoint, one client endpoint.

You can't have:
Client A
│
│
Server ──────┼────── ❌ One TCP/WebSocket connection
│
Client B

That isn't how TCP or WebSockets work.

Then how does a chat app send one message to everyone?

It doesn't use one ws.

Instead, it loops over all client connections:
'''
wss.clients.forEach((client) => {
client.send("Hello everyone!");
});
'''
Internally, that's equivalent to:

'''
wsA.send("Hello everyone!");
wsB.send("Hello everyone!");
wsC.send("Hello everyone!");
'''

Imagine three browsers connect:
Browser A
Browser B
Browser C

The connection event runs three times:

Client A connects
↓
connection event
↓
ws object created for A

Client B connects
↓
connection event
↓
ws object created for B

Client C connects
↓
connection event
↓
ws object created for C

Each ws is a different object. The ws for Client A is not the same object as the ws for Client B.

OUR CODE INTERPRETATION:

1. A client connects (connection event on the server).
2. The server gets that client's connection object (ws).
3. Every 100 ms, the server sends memory usage to that client with ws.send(...).
4. When that client disconnects (close event on the client socket), stop the interval.

So wss is the server, while ws is one connected client or a communication channel between server and a single client.

Layer 1: WebSocket Protocol (the standard)

This is the actual networking protocol defined by RFC 6455.

It only defines concepts like

connection opens
messages sent
connection closes
errors

Every implementation must support these somehow.

Layer 2: WebSocket Library

Examples

ws (Node)
Socket.IO
uWebSockets.js
Bun WebSocket
Java WebSocket
Python websockets
Go Gorilla WebSocket

Each library decides what API you write.

Just like every SQL database supports SELECT, but MySQL and PostgreSQL have different helper functions.

The event names and the syntax can vary from library to library.(very obvious though)

This is because the library's API is not the WebSocket protocol itself. The protocol only defines what happens (connection, message, close, error), not what the programming interface looks like.

Let's compare.

| Library               | Register event                             | Connection event       | Message event                                                  | Close event               |
| --------------------- | ------------------------------------------ | ---------------------- | -------------------------------------------------------------- | ------------------------- |
| **ws (Node)**         | `ws.on(...)`                               | `wss.on("connection")` | `ws.on("message")`                                             | `ws.on("close")`          |
| **Browser WebSocket** | `on...` properties or `addEventListener()` | `onopen`               | `onmessage`                                                    | `onclose`                 |
| **Socket.IO**         | `socket.on(...)`                           | `io.on("connection")`  | **No built-in `message` requirement** (you define event names) | `socket.on("disconnect")` |

Examples:

ws (Node)

'''
wss.on("connection", (ws) => {
ws.on("message", (data) => {});
ws.on("close", () => {});
});
'''

Browser WebSocket
'''
const ws = new WebSocket(url);

ws.onopen = () => {};
ws.onmessage = (event) => {};
ws.onclose = () => {};
'''
or

'''
ws.addEventListener("message", (event) => {});
'''
Notice there is no .on() method here.

SOME FUNDAMENTAL WEBSOCKETS CONCEPT (MAY VARY IN IMPLEMENTATION):
connection (server): Fired when a client connects to the server
open (client): Fired when the connection is established
message: Fired when a message is received
error: Fired when an error occurs
close: Fired when the connection is closed

## When does a WebSocket connection close?

1. **Explicit close** — either side calls `.close()` (client: `ws.close()`,
   server: `ws_dedicated_connection.close()`) → clean handshake, `close`
   event fires on both ends.

2. **Tab closed / page navigated away** — browser terminates the connection.

3. **Network failure** — wifi drops, sleep, timeout, server crash —
   TCP just dies (not a clean handshake).

4. **Server shuts down** — process stops/restarts/deploys → all open
   connections drop.

5. **Ping/pong heartbeat timeout** — server pings, no pong back in time
   → assumed dead, connection terminated. (Not automatic in `ws` —
   must be implemented manually to catch zombie connections.)

`ws_dedicated_connection.on("close", ...)` fires for all of the above
(clean or not) — good place for cleanup like `clearInterval(id)`.

⚠️ Worth adding later: an `on("error", ...)` handler too, since some
failure modes fire `error` before/instead of `close`.
