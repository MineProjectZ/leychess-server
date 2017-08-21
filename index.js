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
                    if(result.winner==Jocly.PLAYER_A)
                        console.info("Player A wins");
                    else if(result.winner==Jocly.PLAYER_B)
                        console.info("Player B wins");
                    else if(result.winner==Jocly.DRAW)
                        console.info("Draw");
                } else
                    NextMove();
            })
              
            .then( ()=> {
              return match.getBoardState();
            })
            .then( (boardState)=> {
              console.info(boardState);
            })
            .then( (boardState)=> {
             io.on('connection', function(socket, boardState){
           socket.on('fendata', function(boardState){
           io.send('fendata', boardState);
        });
      });
            })
            .catch( (e) => {
                console.info("Error",e);
            })

            

    }
    NextMove();
}



Jocly.createMatch("classic-chess")
    .then((match)=>{
        RunMatch(match);
    })
    .catch((e)=>{
        console.info("Error creating match",e);                
    });