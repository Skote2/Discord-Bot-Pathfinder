const fs        = require('fs');
const Discord   = require('discord.js');
const client    = new Discord.Client();
const tokenFile = "token.txt";
const NamedRegExp = require('named-regexp-groups')

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
  str = "+" + str
  /*
  Regex explination
  
  ## I use '#' to start comments in this section
  
  (?<LeadingPlussesAndMinuses> #Matches the start of the capture group
    (?<EvenMinuses> #Will match iff there are an even number of '-' characters in this part
      ((\s*\++)+\s*) #Matches iff there are none
      |
      (([\s\+]*-){2})+[\s\+]*) #See the {2}? that means match twice. This matches an even 
    |
    (?<OddMinuses>
      [\s\+]*-          #Matches the first minus
      (([\s\+]*-){2})   #Matches pairs of minuses (see the {2}?)
      *[\s\+]*          #Matches the last of the spaces and pluses
    )
  )      #By this point, we have all the leading crap out of the way
  
  (      
    (?<dice>  #Matches things like 2d4*6
      (
        (?<numberOfDice>\d+)?                       #Matches one or more numbers, optionally (see the '?' ?, that means match 0 or 1)
        \s*                                         #Take up extra whitespace
        (?<typeOfDice>(?<min1>[d])|(?<min0>[z]))    #Matches ['d','D','z','Z']
        \s*                                         #Take up extra whitespace
      )?                                            #This whole part of the die is optional, without it we have a constant
      
      (?<sizeOfDice>
        (?<sizeNumber>\d+)                          #Matches numbers
        |
        (?<sizeCharacter>%|\u{2030}|\u{2031})       #Matches the percent, permill, and pertenthousand characters
      )
      \s*
      ([x\*]\s*(?<multiplyBy>\d+))?                 #Matches the optional xN or *N at the end of a die
    )
    |
    (?<skill>\w(\s?[\w\(\)])*)                      #Matches any pathfinder skill, even ones with '(' and ')'
  )
  
  #Flags
  giu
  g -> Global, it means that an input string can match more than once
  i -> caseIncensitive
  u -> Unicode
  */
  const regex = new NamedRegExp(/(?<LeadingPlussesAndMinuses>(?<EvenMinuses>((\s*\++)+\s*)|(([\s\+]*-){2})+[\s\+]*)|(?<OddMinuses>[\s\+]*-(([\s\+]*-){2})*[\s\+]*))(?<dice>(((?<numberOfDice>\d+)?(?<typeOfDice>(?<min1>[d])|(?<min0>[z])))?(?<sizeOfDice>(?<sizeNumber>\d+)|(?<sizeCharacter>%|\u{2030}|\u{2031}))([x\*](?<multiplyBy>\d+))?)|(?<skill>\w(\s?\w)*[\(\)]?))/giu)
  
  const limit = 1000//above this we just return the mean value, below this we roll each number on it's own
  const displayLimit = 12//display at most this many dice per group
  
  var masterTotal = 0
  var masterOutput = ""
  var lineCount = 0
  
  let m
  //we loop once per match/dice to throw
  SearchLoop:
  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
        regex.lastIndex++
    }
    let g = m.groups
    /*
    g.LeadingPlussesAndMinuses: -> contains all the whitespace '+' and '-' at the start of the roll
    g.EvenMinuses:              -> undefined iff there are an odd number of minus signs
    g.OddMinuses:               -> undefined iff there are an even number of minus signs
    g.dice:                     -> contains the entire right half of the roll. This is meant for printing
    g.numberOfDice:             -> undefined if 1, otherwise roll this many dice
    g.typeOfDice:               -> if this is a 'd' or 'D', the range is [1, size], if it is a 'z' or 'Z' it is [0, size]. If this is undefined, it is a constant
    g.min1                        |->defined and non-empty if 'd' or 'D'
    g.min0                        |->defined and non-empty if 'z' or 'Z'
    g.sizeOfDice:               -> This is for printing if you want it, it is the term that gives us the size
    g.sizeNumber:               -> This is undefined if we are rolling a d% or the like, otherwise it is the size of the dice
    g.sizeCharacter:            -> This is defined if we are rolling d% or the like
    g.multiplyBy:               -> This is the number to multiply the result of the roll by, or 1 if it is undefined
    g.skill:                    -> If we are rolling for a skill, the string for the skill will be here.
    */
    
    var sign =      (g.EvenMinuses) ? (1) : (-1)
    var display =   ((sign == -1)?"-":"")+g.dice
    var count =     (isNaN(parseInt(g.numberOfDice))) ? (1) : (g.numberOfDice)
    var max =       ((isNaN(parseInt(g.sizeNumber))) ? ({"%":100, "\u2030":1000, "\u2031":10000}[g.sizeCharacter] || 20) : (g.sizeNumber))
    var min =       (g.dice)?((g.typeOfDice)?(+!!g.min1):(max)):(1)
    var multiply =  (isNaN(parseInt(multiply = g.multiplyBy))) ? (1) : (multiply)
    
    
    if(g.skill){
      //g.skill has the string of the skill in it
      //count = 1
      //max = 20
      //min = 1
      //multiply = 1
      //This is where you can tell them to sod off if you want
      
      /*
      masterOutput+= (lineCount++==0?"":"\n")+display+" isn't a sodding skill"
      continue SearchLoop
      */
    }
    
    //both min and max are inclusive
    
    var total = 0
    var output;
    if(min === max){
      output = display
      total = max*sign;
    }else if(count <= 0){
      output = display+": Not going to roll "+count+" dice, you get nothing"
    }else if(count > limit){
      total = Math.floor((max-min)*count/2+min*count)*sign*multiply
      output = display+": [ehh..] about "+total
    }else{
      var arrOutputNumbers = Array()
      while(count-- >0){
        let n = Math.floor(Math.random()*(max-min+1)+min)
        if(count <= displayLimit){arrOutputNumbers.push(n)}
        total += n
      }
      total *= sign*multiply
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
      replyStr = roll(cmd.splice(1).join(""));
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
