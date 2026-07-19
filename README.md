# Server Stats — Live WebSocket Demo

A minimal Node.js + Express + WebSocket project that streams live
server memory usage (`process.memoryUsage()`) to the browser in real
time, updated every 100ms — served entirely from a single Node process.

Inspired by DigitalOcean's now-archived [sample-websocket](https://github.com/digitalocean/sample-websocket) repo.

![Server stats demo](./assets/server-stats-websocket.png)

## How it works

- Express serves the frontend (`public/index.html`) as a static file
  via `express.static`
- A single Node `http.Server` (via `http.createServer(app)`) handles
  both regular HTTP requests and WebSocket upgrade requests
- The `ws` library attaches to that same server, listening for the
  native `'upgrade'` event — no separate WebSocket port needed
- The frontend dynamically resolves the WebSocket URL from
  `window.location.host` and uses `wss://` automatically when served
  over HTTPS — so it works both locally and once deployed
- On each client connection, the backend pushes `process.memoryUsage()`
  as JSON every 100ms
- The frontend renders RSS, Heap Total, Heap Used, and External memory
  in a live-updating table

One process, one port — handles frontend delivery, backend routing,
and the WebSocket connection all together.

## Stack

- Node.js
- Express
- [ws](https://github.com/websockets/ws) (WebSocket library)
- Docker (for deployment)

## Getting Started (local)

### Install dependencies

```bash
npm install
```

### Run the server

```bash
node index.js
```

### View it

Open your browser to:

# Server Stats — Live WebSocket Demo

A minimal Node.js + Express + WebSocket project that streams live
server memory usage (`process.memoryUsage()`) to the browser in real
time, updated every 100ms — served entirely from a single Node process.

Inspired by DigitalOcean's now-archived [sample-websocket](https://github.com/digitalocean/sample-websocket) repo.

![Server stats demo](./assets/server-stats-websocket.png)

## How it works

- Express serves the frontend (`public/index.html`) as a static file
  via `express.static`
- A single Node `http.Server` (via `http.createServer(app)`) handles
  both regular HTTP requests and WebSocket upgrade requests
- The `ws` library attaches to that same server, listening for the
  native `'upgrade'` event — no separate WebSocket port needed
- The frontend dynamically resolves the WebSocket URL from
  `window.location.host` and uses `wss://` automatically when served
  over HTTPS — so it works both locally and once deployed
- On each client connection, the backend pushes `process.memoryUsage()`
  as JSON every 100ms
- The frontend renders RSS, Heap Total, Heap Used, and External memory
  in a live-updating table

One process, one port — handles frontend delivery, backend routing,
and the WebSocket connection all together.

## Stack

- Node.js
- Express
- [ws](https://github.com/websockets/ws) (WebSocket library)
- Docker (for deployment)

## Getting Started (local)

### Install dependencies

```bash
npm install
```

### Run the server

```bash
node index.js
```

### View it

Open your browser to:
http://localhost:8080

`express.static` automatically serves `public/index.html`. The table

updates live as the server's memory usage changes, over the same

port via WebSocket.

## Running with Docker

```bash

# build the image

docker build -t server-stats-ws .

# run the container

docker run -p 8080:8080 server-stats-ws

```

Then visit `http://localhost:8080` same as above.

### Dockerfile

```dockerfile

FROM node:18

WORKDIR /app

COPY . /app

RUN npm install

CMD ["npm", "start"]

```

## Deployment

Planned deployment target: [Back4App](https://www.back4app.com/)

(container-based deployment via the Dockerfile above).

## Project Structure

├── index.js # Express app + http server + WebSocket setup
├── public/
│ └── index.html # Frontend — connects via WebSocket, renders stats
├── assets/
│ └── server-stats-websocket.png
├── Dockerfile
└── package.json

## Status

🚧 Fun/learning project — working locally. Docker build ready,
Back4App deployment in progress.
