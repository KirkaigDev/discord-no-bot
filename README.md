# Discord No Bot
This is mainly designed for a discord server I'm a part of, nothing is stopping anyone from using parts of the code or reusing this whole thing. But this repository is made to add features to the current bot, if you do want to check out the discord server then it's at https://discord.gg/EnjyqpwnMt

## Purpose
To count the word no and associate it with points as well as having some moderation features.

## Features
* No counter, the bot counts all instances of no and assigns points to each user
* Translator, it connects to the libretranslator API to provide translations
* Leaderboard, there is a leaderboard featuring the users that have the top 10 points of that server
* A spam channel, the bot will not reply to comments featuring no in the specified channel(s)
### Project Features
* I've included an event and command handler, similar to djs commander except that it allows automatic subcommand creation (discord doesn't allow this to go past 3)

## Plans
* To have the score reduced when someone says a synonym to yes. It needs a good formula so it doesn't take away too many or too few points
* Have synonyms to no such as nah
* Allow the classic Australian "yeah, nah"
* Have a text based RPG where you can earn points and multipliers as well as maybe adding some roles and other aesthetics

# Project Documentation
* Note: keep commits readable, if I can't understand your code easily enough then I'm just going to ignore it. And I'm telling you now, if you're just going to get an LLM to do everything for you then you can piss off now.
## Running On Your Device
* Warning: I'm not sure if this will run on a Windows OS since they use incorrect file paths (backslashes). Maybe it still works, but I haven't tested it.

I've designed this to be as simple as possible, especially since I deploy this on a different device and I use a different bot and discord server for developing.

### Exact Recreation
* Dependencies: mysql/mariadb, node.js (I made this on Arch Linux btw, so it was the latest version of node. No idea how it will work on older versions.)
* Optional Dependencies: libretranslate (should work nearly the same without it), npm (it's what I used so I recommend using it)

1. If you're doing a recreation then you will want to first make sure you have any roles and channels in your server which are referenced in the config.js file.
2. This is obvious, but you do need to cd into the project and run npm i
3. Copy the src/config.js to src/test-config.js and edit the file to match your setup (feel free to disable the translator as you will likely not need it)
4. Copy the .env.example contents to .env
5. If you haven't already, create your discord bot (I will not provide documentation around this, the discord docs will be far more helpful) and set TOKEN in .env to your actual discord app token (it's just an API key, not sure what they call it and it might get renamed)
6. Install mariadb and add the relevant details to the .env file.
7. Feel free to name the database whatever you want, which is in src/db.js. Then you can run the src/create-db.js which will create the database structure for you
8. Should now work when you run the index file. Feel free to reach out if you have any problems

### Modifications
Nothing is stopping you from using this for your own purposes, but I'm not going to provide help or documentation. It's hard enough maintaining the project for myself.

## Project Design
Most of this should be obvious by looking at the project, although it's hard to imagine what other people might see. Feel free to reach out if you have any questions.
### Common Design
* Do not put any globals in. The config.js is the one place for globals and it has everything within the one object to avoid overpopulating global. And it is to stay constant, it will not be modified anywhere else.
* This is all obvious stuff, but try to keep everything as clean and as readable as possible. I know there's some ugly parts in there and I intend to fix that.

### My Personal Preferences
* If a function is used outside of its file, I like to have {} for the paramters as that way I don't have to remember their order.

### Event (and Command) Handler
I created an event/command handler. It works similarly to djs commander https://github.com/notunderctrl/djs-commander which has an npm package. That's what I used beforehand and what I based mine off of.

#### Events
There's the events part (even though commands are counted as an event) which is pretty simple. It scans the events directory (which can be changed in src/test-config.js) and every directory within that uses its name as the event name. So if it was messageCreate you would make the events/messageCreate directory and every file within that would be run for messageCreate. For the files themselves it's pretty simple, you can name the files anything (as long as it ends with .js) then you need to export the function as export default. The first parameter is client then the others are passed through from discord.

#### Commands
The commands part was far more difficult to make and was probably what I struggled on the longest. But it should be simple enough to use, for adding a command, your file just needs to export (as default) an object with data and exec, where data is the command data which can be made with SlashCommandBuilder from discord.js and exec is just the command to execute with the parameters as ({client, interaction}).

The directories is where it gets a little more complex. The first set of directories is just for project organisation and won't create any subcommands but all directories created deeper than that will. You can change the depth and even turn off subcommands altogether inside of src/test-config.js. If you're adding a subcommand then the data part in your file needs to be created with SlashCommandSubcommandBuilder. Keep in mind that you can always just manually add subcommands in the file, I just thought this made things cleaner.
