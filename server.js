const express = require('express'); // Importing Express.js
const app = express(); // Creating an Express app
const http = require('http'); // Importing HTTP module to create a server
const path = require('path'); // Importing Path module to handle file paths
const { Server } = require('socket.io'); // Importing Server class from socket.io for WebSocket communication
const ACTIONS = require('./src/Actions'); // Importing custom actions for socket events

const server = http.createServer(app); // Creating an HTTP server using the Express app
const io = new Server(server); // Creating a new Socket.io server and binding it to the HTTP server

// Serve static files from the 'build' directory
app.use(express.static('build'));

// Serve the index.html file for any route that is not caught by previous routes (for client-side routing)
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {}; // Object to map socket IDs to usernames

// Function to get all connected clients in a specific room
function getAllConnectedClients(roomId) {
    // Convert the Set of socket IDs in the room to an array
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId, // Socket ID of the connected client
                username: userSocketMap[socketId], // Username associated with the socket ID
            };
        }
    );
}

// Event listener for a new socket connection
io.on('connection', (socket) => {
    console.log('socket connected', socket.id); // Log when a new client connects

    // Event listener for when a client joins a room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username; // Map the socket ID to the username
        socket.join(roomId); // Add the socket to the specified room
        const clients = getAllConnectedClients(roomId); // Get the list of all connected clients in the room
        // Notify all clients in the room about the new client
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients, // Send the updated list of clients
                username, // Send the username of the newly joined client
                socketId: socket.id, // Send the socket ID of the newly joined client
            });
        });
    });

    // Event listener for when the code is changed in the editor
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code }); // Broadcast the code change to other clients in the room
    });

    // Event listener to sync code with a specific client (usually a newly joined client)
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code }); // Send the current code to the specified client
    });

    // Event listener for when a client is disconnecting
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms]; // Get all rooms the socket is currently in
        // Notify all clients in those rooms that the client is disconnecting
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id, // Send the socket ID of the disconnecting client
                username: userSocketMap[socket.id], // Send the username of the disconnecting client
            });
        });
        delete userSocketMap[socket.id]; // Remove the client from the userSocketMap
        socket.leave(); // Leave all rooms
    });
});

// Start the server on the specified port, or default to port 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
