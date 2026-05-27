const socket = io();
const board = document.getElementById('myBoard');
const game = new Chess();
let board = null;
let playerColor = null;

const $status = $('#status');
const $color = $('#playerColor');

function onDragStart (source, piece, position, orientation) {
    if (game.game_over()) return false;

    // Only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Only allow move if it's your turn
    if (playerColor && game.turn() !== playerColor) {
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

    // Emit move to server
    socket.emit('move', {
        gameId: $('#gameIdInput').val(),
        move: move
    });

    updateStatus();
}

function onSnapEnd () {
    board.position(game.fen());
}

function updateStatus () {
    let status = '';
    let moveColor = (game.turn() === 'b') ? 'Black' : 'White';

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }
    $status.html(status);
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
board = Chessboard('myBoard', config);

$('#joinBtn').on('click', () => {
    const gameId = $('#gameIdInput').val();
    socket.emit('joinGame', gameId);
});

socket.on('playerAssignment', ({ color }) => {
    playerColor = color;
    $color.text(color === 'w' ? 'White' : 'Black');
    
    // Flip board for black player
    if (color === 'b') {
        board.flip();
    }
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
});
