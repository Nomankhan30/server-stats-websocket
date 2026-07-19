//Purpose of using app.use(express.static(...)) here in code:
//when a browser hits http://localhost:8080/, Express's static middleware finds public/index.html and serves it directly. 
// No separate frontend server (like a Vite dev server or a static file host) is needed — 
// one Node process handles both the frontend files AND the WebSocket connection.
//1. http://localhost:8080 → serves public/index.html (via express.static)
//2. ws://localhost:8080 → WebSocket connection (via wss, attached to the same server)
//3. One port, two protocols, one Node process.
//imported express framework
const express=require("express")
const path=require("path")
const {createServer}=require("http")
const WebSocket=require("ws")
const app=express() //creating express framework object to handle routing, middlewares etc
//app.use(...) — registers middleware on app, so it runs on every incoming request
// express.static is a middleware — it has access to the req/res cycle
// (like any middleware) AND has the built-in ability to serve static 
// files (html, css, js, images, etc.) directly from a given folder
app.use(express.static(path.join(__dirname,"/public")))
const server=createServer(app) //creating http server using node module of http and 
//passing app to let createServer know which function will be handling routing
const wss=new WebSocket.Server({server}) 
// plugs ws library into the existing http server by registering a listener 
// on server's 'upgrade' event (done once, here at setup).
//
// server checks EVERY incoming request for an "Upgrade: websocket" header:
//   - no  → normal HTTP request, goes to app as usual
//   - yes → server fires its 'upgrade' event
//
// wss doesn't scan requests itself — it just reacts when server notifies it,
// then completes the WebSocket handshake and fires its own 'connection' event
//In short, ws library is actually registering a listener against a native upgrade of http server
wss.on("connection",(ws_dedicated_connection)=>{
    // runs once per client, after their handshake succeeds — 
    // ws_dedicated_connection is the dedicated socket for that client
    console.log("Some One Connected")
    const id=setInterval(function(){
        //first convert js object into raw/plain string form
        ws_dedicated_connection.send(JSON.stringify(process.memoryUsage()))
    },100)
    ws_dedicated_connection.on("close",function(){
        console.log("CONNECTION IS CLOSED")
        clearInterval(id)
    })
}

)
server.listen(8080,function(){
     console.log("CONNECTED TO THE SERVER SUCCESSFULLY")
})

//WE COULD HAVE DONE THIS AS WELL:
// const server=app.listen(8080,...) //retrieving http server from express object
// app.listen() creates the http.Server internally AND returns it,
// then attaching it with
// const wss = new WebSocket.Server({ server }) 