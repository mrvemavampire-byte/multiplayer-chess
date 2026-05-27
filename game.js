const socket = io();
const game = new Chess();
let board = null;
let playerColor = 'w';
let gameMode = 'single';

const $status = $('#status');
const $color = $('#playerColor');

function updateStatus() {
    let status = '';
    let moveColor = (game.turn() === 'b') ? 'Black' : 'White';

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) status += ', ' + moveColor + ' is in check';
    }
    $status.html(status);
}

function makeRandomMove() {
    setTimeout(() => {
        const possibleMoves = game.moves();
        if (possibleMoves.length === 0) return;
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        game.move(possibleMoves[randomIndex]);
        board.position(game.fen());
        updateStatus();
    }, 500);
}

function onDragStart (source, piece, position, orientation) {
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    if (gameMode === 'multi' && playerColor && game.turn() !== playerColor) {
        return false;
    }
}

function onDrop (source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    updateStatus();

    if (gameMode === 'multi') {
        socket.emit('move', {
            gameId: $('#gameIdInput').val(),
            move: move
        });
    } else if (gameMode === 'single' && game.turn() === 'b') {
        makeRandomMove();
    }
}

function onSnapEnd () {
    board.position(game.fen());
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};
board = Chessboard('myBoard', config);

window.startSinglePlayer = function() {
    gameMode = 'single';
    $('#mainMenu').hide();
    $('#myBoard').show();
    $('#gameInfo').show();
    $color.text('White');
    updateStatus();
};

window.showMultiplayer = function() {
    $('#multiplayerInputs').css('display', 'flex');
};

window.joinMultiplayer = function() {
    const gameId = $('#gameIdInput').val();
    if (!gameId) return alert('Please enter a Game ID');
    
    gameMode = 'multi';
    socket.emit('joinGame', gameId);
    
    $('#mainMenu').hide();
    $('#myBoard').show();
    $('#gameInfo').show();
};

socket.on('playerAssignment', ({ color }) => {
    playerColor = color;
    $color.text(color === 'w' ? 'White' : 'Black');
    if (color === 'b') board.flip();
});

socket.on('gameStart', () => {
    $status.text('Game Started! White moves first.');
});

socket.on('move', (move) => {
    game.move(move);
    board.position(game.fen());
    updateStatus();
});

socket.on('fullGame', (msg) => {
    alert(msg);
    location.reload();
});
