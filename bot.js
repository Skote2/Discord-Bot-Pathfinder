const fs        = require('fs');
const Discord   = require('discord.js');
const client    = new Discord.Client();
const tokenFile = "token.txt";

var parseCommand = function (cmdStr) {
  var command = [];

  cmdStr = cmdStr.substring(1, cmdStr.length);
  if (cmdStr.indexOf(' ') === -1)
    command[0] = -1;
  else
    command = cmdStr.split(' ');
  return command;
}

var roll = function (str) {
  const regex = /(([\+\s]*-){2}[\s]*)*[\+\s]*([\+-])([\+\s]*)((\d*)(\s*)([dz])(\s*)(([\d]+)|(%|\u{2030}|\u{2031}))|([\d]+)|(\w[\s\w\d]*))/gmui
  const limit = 1000//above this we just return the mean value, below this we roll each number on it's own
  const displayLimit = 12//display at most this many dice per group
  
  var masterTotal = 0
  var masterOutput = ""
  var lineCount = 0
  
  //str = "/roll 5d6 + 2"
  //it makes the RegEx work
  //str = "+"+str
  str = "+"+str.replace(/\/roll\s*/gmui, "+")
  
  let m
  //we loop once per match/dice to throw
  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
        regex.lastIndex++
    }
    
    var sign = ((m[3].includes('+')) ? (1) : (-1))
    var display = ((sign == -1)?"-":"")+m[5]
    var count = ((isNaN(parseInt(m[6]))) ? (1) : (parseInt(m[6])))
    var min = +(!m[8] || m[8].toUpperCase().includes("D"))
    var max = ((isNaN(parseInt(m[11]))) ? ({"%":100, "\u2030":1000, "\u2031":10000}[m[10]]||20) : (parseInt(m[11])))-!min
    if(!isNaN(parseInt(m[13]))){max=min=parseInt(m[13])}//adds support for constants
    
    //both min and max are inclusive
    
    var total = 0
    var output;
    if(min === max){
      output = display
      total = max*sign;
    }else if(count <= 0){
      output = display+": Not going to roll "+count+" dice, you get nothing"
    }else if(count > limit){
      total = Math.floor((max-min)*count/2+min*count)*sign
      output = display+": [ehh..] about "+total
    }else{
      var arrOutputNumbers = Array()
      while(count-- >0){
        let n = Math.floor(Math.random()*(max-min+1)+min)
        if(count <= displayLimit){arrOutputNumbers.push(n)}
        total += n
      }
      total *= sign
      output = display+":"+(arrOutputNumbers.length>displayLimit?" ...":" [")+arrOutputNumbers[0]
      arrOutputNumbers.forEach((n,i) => {if(i<displayLimit && i>0){output+=", "+n}})
      output+="] for a total of: "+total
    }
    
    masterTotal += total
    masterOutput+= (lineCount++==0?"":"\n")+output
  }
  //console.log(masterOutput + ((lineCount > 1)?"\nTotal: "+masterTotal:""))
  return masterOutput + ((lineCount > 1)?"\nTotal: "+masterTotal:"")
}

//load text
var loadText = function (fileName) {
  return fs.readFile( __dirname + '/' + fileName, function (err, data) {
    if (err) {
      throw err; 
    }
    var token = data.toString();

    console.log(token);
    return token;
  });
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//when something pops up in chat
client.on('message', msg => {
  console.log(msg.content);
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
  else if (msg.content[0] === '/') {
    var cmd = parseCommand(msg.content);
    var replyStr = "empty Reply";

    if (cmd[0] === "roll")
      replyStr = roll(msg.content);
    else if (cmd[0] === -1)
      replyStr = "Unknown Command";
    else if (cmd === [])
      replyStr = "poor syntax?";
    
    msg.reply(replyStr);
  }
});

//login the bot from token login file
fs.readFile( __dirname + '/' + tokenFile, function (err, data) {
  if (err) throw err; 
  client.login(data.toString());
});
