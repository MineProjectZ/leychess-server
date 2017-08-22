const Jocly = require('leychess-jocly');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moveCount = 0

app.get('/', function(req, res){
  res.sendFile(__dirname + '/');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function RunMatch(match) {
    function NextMove() {
        var move;
        match.machineSearch()
            .then( (result) => {
                move = result.move;
                return match.getMoveString(move);
            })
            .then( (moveStr) => {
                console.info(
                    ((!(moveCount%2) && ((moveCount>>1)+1)+".  ") || "")
                    +(moveCount%2 && "            " || "")+" "+moveStr
                );
                moveCount++;
            })
            .then( () => {
                return match.applyMove(move);
            })

            .then( (result) => {
                if(result.finished) {
                    if(result.winner==Jocly.PLAYER_A){
                        var winner = 'Player A Wins';
                        io.emit('winner', winner);
                    }
                    else if(result.winner==Jocly.PLAYER_B){
                        var winner = 'Player B Wins'
                        io.emit('winner', winner);
                    }
                    else if(result.winner==Jocly.DRAW){
                        var winner = 'Draw'
                        io.emit('winner', winner);
                    }
                } else
                    NextMove();
            })
              
            .then( ()=> {
              return match.getBoardState();
            })
            .then( (boardState)=> {
            var fen;
             fen = boardState;
            io.emit('fendata', fen);
            })
            .catch( (e) => {
                console.info("Error",e);
            })

            

    }
    NextMove();
}
    
io.on('connection', function(socket){
    socket.on('start', function(begin){
        Jocly.createMatch("classic-chess")
        .then((match)=>{
            RunMatch(match);
        })
    });   
});
