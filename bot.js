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
  var parts = str.split('d');
  var count;
  var die;
  if (isNaN(parts[0])) { //for '/roll skill' formatting
    count = 1;
    die = 20;
  }
  else {  //for '/roll #d#' format (count-d-die#)
    count = parts[0];
    die = parts[1];
  }
  var roll = "";
  var total = 0;
  for (var i = 0; i < count; i++) {
    r = Math.ceil(die * Math.random());
    if (r === 0) r = 1;
    roll += r + " + ";
    total += r;
  }
  roll = roll.substring(0, roll.length -2);
  if (count > 1)//formatting
    roll += "= " + total;
  else
    roll = total;
  return roll;
};

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
      replyStr = roll(cmd[1]);
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