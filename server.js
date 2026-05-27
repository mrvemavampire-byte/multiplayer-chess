const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let games = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (gameId) => {
        socket.join(gameId);
        if (!games[gameId]) {
            games[gameId] = { players: [] };
        }
        
        if (games[gameId].players.length < 2) {
            games[gameId].players.push(socket.id);
            const color = games[gameId].players.length === 1 ? 'w' : 'b';
            socket.emit('playerAssignment', { color });
        } else {
            socket.emit('fullGame', 'Game is full');
        }

        if (games[gameId].players.length === 2) {
            io.to(gameId).emit('gameStart');
        }
    });

    socket.on('move', ({ gameId, move }) => {
        socket.to(gameId).emit('move', move);
    });

    socket.on('disconnect', () => {
        for (let gameId in games) {
            games[gameId].players = games[gameId].players.filter(id => id !== socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
