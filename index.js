const express = require('express');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const Chess = require('chess.js').Chess;

let chess = new Chess();
let moves = [];

let form = new formidable.IncomingForm();
form.uploadDir = './uploads';
form.maxFileSize = 20 * 1024;

const port = process.env.PORT || 8080;
const app = express();

app.listen(port, function(){
  console.log(`Server is running on ${port}`);
});

app.get('/pgn-home',(req,res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});
app.post('/pgn-read', (req,res) => {
  res.header('content-type', 'text/plain');
  form.parse(req, function (err, fields, files) {
    if (err) {
      res.send('Error: max file-size = 20kB');
    } else {
      let uploadedFile = files.fileupload.path;
      res.send(parsePgn(uploadedFile));
    }
  });
});

function parsePgn(file) {
  let result = '';

  pgn = fs.readFileSync(file,'utf8')
    .replace(/\[.*\]/g,'')
    .trim()
    .replace(/(?:\r\n|\r|\n)/g,' ')
    .replace(/\d*\..*?(?=\d*\.)/g,'$&\n')
    .split('\n');

  pgn.forEach( el => {
    moveNum = el.match(/\d*\./)[0].replace(/\./,'');
    moveAction = el.replace(/\d*\./,'').trim().split(' ');
    moveAction.forEach( (el,i) =>   {
      if (el !== '') {
        moves.push({turn: moveNum, move: el});
      } else {
        moves.push({turn: 'win', move: moveAction[i+1]});
      }
    });
  });

  // console.log(moves);
  moves.some( el => {
    if (chess.moves().indexOf(el.move) > -1) {
      console.log('turn permitted');
      chess.move(el.move);
      return false;
    }
    if (el.turn === 'win') {
      console.log('Game over: '+ el.move);
      result += `Game over: ${el.move}`;
      return true;
    }
    console.log('invalid turn: '+el.turn+' Move: '+ el.move);
    result += `Invalid turn: ${el.turn}, Move: ${el.move}`;
    return true;
  });

  return result;
}
