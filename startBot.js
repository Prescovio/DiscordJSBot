/* 
discord.js node-opus --save
npm install --save ffmpeg-binaries
npm install --global --production windows-build-tools
npm install node-opus (execute in bot directory)
npm install ytdl-core
============================
startBot.js
- initialize discord client
- listen to events 
- delegate work to function
requires:
- discord.js
- config.json
- groups.json
- paths.json
- commandPermissions.json
- fs
- ytdl-core
============================
*/

//modules
const Discord = require('discord.js');
const client = new Discord.Client();
//JSON
const config = require("./config.json");
const groups = require("./groups.json");
const paths = require("./paths.json");
const commandPermissions = require("./commandPermissions.json");
//filesystem
const fs = require('fs');
//youtube videos
const ytdl = require('ytdl-core');

//dispatchers required for voice
var dispatchers = [];

/*ready event*/
client.on('ready', () => {
  client.user.setGame('.help');
  console.log('Ready!');
  console.log('Connected to:');
  
  //print guilds (servers)
  client.guilds.forEach(function(value, key) {
    console.log(value.name)
  });
  console.log('-------------');
});

/*
============================
channel events
============================
*/
client.on('channelCreate', channel => {
  console.log('channel created');
});

client.on('channelDelete', channel => {
  console.log('channel deleted');
});

client.on('channelPinsUpdate', (channel, time) => {
  console.log('channel pins updated');
});

client.on('channelUpdate', (oldChannel, newChannel) => {
  console.log('channel updated');
});

/*
============================
guild update events
============================
*/
client.on('guildBanAdd', (guild, user) => {
  console.log('guild ban added');
});

client.on('guildBanRemoved', (guild, user) => {
  console.log('guild ban removed');
});

client.on('guildCreate', guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setGame(`on ${client.guilds.size} servers`);
  console.log('guild created');
});

client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
  console.log('guild deleted');
});

client.on('guildMemberAdd', member => {
  member.send(`Welcome to ${member.guild}, ${member}`);
});

client.on('guildMemberAvailable', member => {
  console.log('guild member available');
});

client.on('guildMemberRemove', member => {
  console.log('guild member removed');
});

client.on('guildMembersChunk', (members, guild) => {
  console.log('guild members chunked');
});

client.on('guildMemberSpeaking', (member, speaking) => {
  console.log('guild member speaking');
  if (member.guild.id in dispatchers) {
    if (speaking) {
      //dispatchers[member.guild.id].setVolume(0.5);
    }
    else {
      //dispatchers[member.guild.id].setVolume(1);
    }
  }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
  console.log('guild member updated');
});

client.on('guildUnavailable', guild => {
  console.log('guild unavailable');
});

client.on('guildUpdate', (oldGuild, newGuild) => {
  console.log('guild member updated');
});

client.on('presenceUpdate', (oldMember, newMember) => {
  console.log('presence updated');
});

/*
============================
role events
============================*/
client.on('roleCreate', role => {
  console.log('role created');
});

client.on('roleDelete', role => {
  console.log('role deleted');
});

client.on('roleUpdate', role => {
  console.log('role updated');
});

/*
============================
client user update events
============================
*/
client.on('clientUserGuildSettingsUpdate', clientUserGuildSettings => {
  console.log('client user guild settings updated');
});

client.on('clientUserSettingsUpdate', clientUserSettings => {
  console.log('client user settings updated');
});

/*
============================
debug event
============================
*/
client.on('debug', info => {
  //console.log('debugging');
});

/*
============================
connection events
============================
*/
client.on('reconnecting', () => {
  console.log('reconnecting');
});

client.on('resume', replayed => {
  console.log('resume');
});

client.on('disconnect', event => {
  console.log('disconnected');
});

/*
============================
emoji events
============================
*/
client.on('emojiCreate', emoji => {
  console.log('emoji created');
});
 
client.on('emojiDelete', emoji => {
  console.log('emoji deleted');
});

client.on('emojiUpdate', (oldEmoji, newEmoji) => {
  console.log('emoji updated');
});

/*
============================
error/warning event
============================
*/
client.on('error', error => {
  console.log('error');
});

client.on('warn', () => {
  console.log('warned');
});

/*
============================
user update events
============================
*/
client.on('userNoteUpdate', (user, oldUser, newUser) => {
  console.log('user note updated');
});

client.on('userUpdate', (oldUser, newUser) => {
  console.log('user updated');
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  console.log('voice state updated');
});

/*
============================
type events
============================
*/
client.on('typingStart', (channel, user) => {
  console.log('typing started');
});

client.on('typingStop', (channel, user) => {
  console.log('typing stopped');
});

/*
============================
strings
central methods for strings that are used more often
============================
*/

//returns the help string for command (command, description, usage)
function getHelpString(command) {
  return `**${command}** | Description: *${commands[command].description}* | \`${commands[command].usage}\`\n`;
}

/*
============================
help functions
============================
*/

//checks if at least one role may execute the command
function checkPermissions(roles, command) {
  var requiredRole = roles.filter(
    (n) => n.name in groups && //check if roles are in groups.json
    groups[n.name] <= commandPermissions[command] //if role found check for permission level
  );
  //at least one required role found
  if (requiredRole.size > 0 || requiredRole.length > 0) {
    return true;
  } else {
    return false;
  }
}

//builds help for all groups
function helpForGroup(groupName) {
  var output = ""
  for (command in commands) {
    if (groups[groupName] <= commandPermissions[command])  {
      if (!output) {
        output = `**Commands for ${groupName}:**\n` 
      }
      output += getHelpString(command);
    }
  }
  if (output) {
    return output + '\n';
  } else {
    return output + `${groupName} may not execute any commands.`
  }
}

//used by .playmusic
function playMusic(guildId, args) {
  if (args.length) {
    const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl(args[0], { filter : 'audioonly' });
    const dispatcher = client.guilds.get(guildId).voiceConnection.playStream(stream, streamOptions);
    dispatchers[guildId] = dispatcher;
  } else {
    //get files from directory specified in paths.json
    var files = fs.readdirSync(paths["music"]).filter((n) => n.endsWith(".mp3"));
    createDispatcher(files, guildId);
  }
}

//used by playMusic
function createDispatcher(musicFiles, guildId) {
  //all files played, refresh files
  if (musicFiles.length == 0) {
    musicFiles = fs.readdirSync(paths["music"]).filter((n) => n.endsWith(".mp3"));
  }
  var rnd = Math.floor(Math.random() * musicFiles.length); //random start file
  if (musicFiles.length) {
    var dispatcher = client.guilds.get(guildId).voiceConnection.playFile(paths["music"] + musicFiles[rnd]);
    musicFiles.splice(rnd, 1); //remove current file  

    dispatcher.on("start", () => {
      console.log("started")
    });
    dispatcher.on("end", reason => {
      console.log(reason);
      if (reason == "stream") { //file done playing
        createDispatcher(musicFiles, guildId);
      }
      else if (reason == "stopMusic") { //.stopmusic
         return
      } else { 
      }
    });
    dispatchers[guildId] = dispatcher;
  }
}

/*
============================
commands
============================
*/

var commands = {
  /*
  ============================
  help
  ============================
  */
  "help": {
    usage: config.prefix + "help",
    description: "lists every command you may execute and its usage.",
    permissionlevel: commandPermissions["help"],
    minimumArgLength: 0,
    process: 
    function (message, args) {
      var output = ""
      for (command in commands) {
        if (checkPermissions(message.member.roles.array(), command))  {
          if (!output) {
            output = "**Commands:**\n"
          }
          output += getHelpString(command);
        }
      }

      if (output) {
        message.reply("Check your private messages")
        message.author.send(output);
      } else {
        message.channel.send("There are no commands you may execute.")
      }
    }
  },
  "helpall": {
    usage: config.prefix + "helpall",
    description: "lists every command and its usage for every group.",
    permissionlevel: commandPermissions["helpall"],
    minimumArgLength: 0,
    process: 
    function (message, args) {
      var output = ""
      for (groupId in groups) {
        output += helpForGroup(groupId);
      }

      message.reply("Check your private messages")
      message.author.send(output);
    }
  },
  "ping": {
    usage: config.prefix + "ping",
    description: "Answers with pong and tells the latency.",
    permissionlevel: commandPermissions["ping"],
    minimumArgLength: 0,
    process: 
    function(message, args) {
      message.channel.send("Ping?")
      .then(sentMessage => sentMessage.edit(`Pong! Latency is ${sentMessage.createdTimestamp - sentMessage.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`))
      .catch(console.error);
    }
  },
  "generateinvite": {
    usage: config.prefix + "generateinvite",
    description: "Generates an invitelink for the bot.",
    permissionlevel: commandPermissions["generateinvite"],
    minimumArgLength: 0,
    process: 
    function(message, args) {
      client.generateInvite(['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE']) //permissions the bot requires on a server
      .then(link => {
        message.channel.send(`Generated bot invite link: ${link}`);
      });
    }
  },
  /*
  ============================
  voice
  ============================
  */
  "joinvoice": {
    usage: config.prefix + "joinvoice",
    description: "Makes bot join your voice channel.",
    permissionlevel: commandPermissions["joinvoice"],
    minimumArgLength: 0,
    process: 
    function(message, args) {
      //check if bot is already connected on server
      if (message.guild.voiceConnection)
      {
        message.channel.send(`Already connected to ${message.guild.voiceConnection.channel}.`);
      } else if (message.member.voiceChannel) //message.author connected
      {
        message.member.voiceChannel.join();
        message.channel.send(`Connected to ${message.member.voiceChannel}.`);
      } else { //message.author not connected 
        message.reply("You are not connected to any voice channel.");
      }
    }
  },
  "leavevoice": {
    usage: config.prefix + "leavevoice",
    description: "Makes bot leave your voice channel.",
    permissionlevel: commandPermissions["leavevoice"],
    minimumArgLength: 0,
    process: 
    function(message, args) {
      if (!message.member.voiceChannel) {
        message.reply("You are not connected to any voice channel.");
      } else {
        var channel;

        //check if bot and user are in the same channel
        client.voiceConnections.forEach(function (channelId, voiceConnection) {
          if (channelId.channel == message.member.voiceChannel) {
            channel = channelId.channel;
          }
        });

        //bot is in message.member.voicechannel
        if (channel) {
          channel.leave();
          message.channel.send(`Disconned from ${channel}.`);
        } else {
          message.reply("Bot is not connected to your voice channel.");
        }
      }
    }
  },
  "playmusic": {
    usage: config.prefix + "playmusic <link>",
    description: "Makes bot play music (mp3 files in music folder) <link>.",
    permissionlevel: commandPermissions["playmusic"],
    minimumArgLength: 0,
    process: 
    function(message, args) {
      if (message.guild.voiceConnection) { //bot connected to a voice channel
        if (message.member.voiceChannel) { //message.author connected to a voice channel
          if (message.member.voiceChannel == message.guild.voiceConnection.channel) { //bot and message.author in the same channel
            message.channel.send(`Playing music in ${message.member.voiceChannel}.`);
            playMusic(message.guild.id, args);
          } else {
            message.reply("You are not connected to the same voice channel as the bot.");
          }
        } else {
          message.reply("You are not connected to any voice channel.");
        }
      } else { //message.author not connected 
        message.reply("Bot is not connected to any voice channel.");
      }
    }
  },
  "stopmusic": {
    usage: config.prefix + "stopmusic",
    description: "Makes bot stop playing music.",
    permissionlevel: commandPermissions["stopmusic"],
    minimumArgLength: 0,
    process: 
    function(message, args) {
      if (message.guild.voiceConnection) { //bot connected to a voice channel
        if (message.member.voiceChannel) { //message.author connected to a voice channel
          if (message.member.voiceChannel == message.guild.voiceConnection.channel) { //bot and message.author in the same channel
            if (message.guild.id in dispatchers) {
              dispatchers[message.guild.id].end("stopMusic");
              message.channel.send(`Stopped playing music in ${message.member.voiceChannel}.`);
            } else {
              message.channel.send(`Bot is not playing music.`);
            }
          } else {
            message.reply("You are not connected to the same voice channel as the bot.");
          }
        } else {
          message.reply("You are not connected to any voice channel.");
        }
      } else { //message.author not connected 
        message.reply("Bot is not connected to any voice channel.");
      }
    }
  }
};

/*
============================
handle message
============================
*/

function handleMessage(message) {
  //ignore bot user commands
  if(message.author.bot) return;
  
    //ignore messages with wrong prefix
    if(message.content.indexOf(config.prefix) !== 0) return;
  
    //split command and arguments
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command in commands) {
      //at least one group with enough permissions
      if (checkPermissions(message.member.roles, command)) {
        if (args.length >= commands[command].minimumArgLength)
        {
          commands[command].process(message, args);
        } else {
          message.channel.send(`Synthax error, *Usage:* \`${commands[command].usage}\``)
        }
      } else {
        //tell author which groups are allowed to use that command
        message.channel.send(`Only \`${Object.keys(groups).filter((n) => groups[n] <= commandPermissions[command]).join(", ")}\` have the permissions to execute this command.`)
      }
    }
}

/*
============================
message events
============================
*/

client.on('message', message  => {
  handleMessage(message);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
  handleMessage(newMessage);
});

client.on('messageDelete', message => {
  console.log('message deleted');
});

client.on('messageDeleteBulk', messages => {
  console.log('message deleted bulk');
});

/*
============================
reaction events
============================
*/
client.on('messageReactionAdd', (messageReaction, user) => {
  console.log('message reaction added');
});

client.on('messageReactionRemove', (messageReaction, user) => {
  console.log('message reaction removed');
});

client.on('messageReactionRemoveAll', message => {
  console.log('message reaction removed all');
});

client.login(config.token);