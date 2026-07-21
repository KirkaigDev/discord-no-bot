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
* If someone's first word is a synonym to yes, they will be silenced until reviewed by a admin.
* Have synonyms to no such as nah
* Allow the classic Australian "yeah, nah"
* Have a text based RPG where you can earn points and multipliers as well as maybe adding some roles and other aesthetics
* Combos, when someone responds with a normal sentence that makes sense with context (decided by an LLM) the no count will be boosted. Each no will multiply so 7 nos in one sentence could be worth 1200 points.

# Project Documentation
* Note: keep commits readable, if I can't understand your code easily enough then I'm just going to ignore it. And I'm telling you now, if you're just going to get an LLM to do everything for you then you can piss off now.
## Running On Your Device
* Warning: I'm not sure if this will run on a Windows OS since they use incorrect file paths (backslashes). Maybe it still works, but I haven't tested it.

I've designed this to be as simple as possible to setup, especially since I use a different device to run it the test version.

### Exact Recreation
* Dependencies: mysql/mariadb, npm (all of the node dependencies are in the package.json)
* Optional Dependencies: libretranslate (should work nearly the same without it)

1. If you're doing a recreation then you will want to first make sure you have any roles and channels in your server which are referenced in the src/config.example.ts file.
2. This is obvious, but you do need to cd into the project and run npm i
3. Copy the src/config.example.ts to src/config.ts and edit the file to match your setup (feel free to disable the translator as you will likely not need it)
4. Copy the .env.example contents to .env
5. If you haven't already, create your discord bot (I will not provide documentation around this, the discord docs will be far more helpful) and set TOKEN in .env to your actual discord app API key (I think discord refers to it as an app token)
6. Install mariadb and add the relevant details to the .env file.
7. Feel free to name the database whatever you want, which is in .env with the rest database values. Then you can run the src/create-db.ts which will create the database structure for you, you can also do this with `npm run create-db`
8. Since it's written in typescript, you need to compile it with `npm run build`
9. Should now work when you do `npm run start` which runs the build/index.js file. Feel free to reach out if you have any problems.

### Modifications
Nothing is stopping you from using this for your own purposes, but I haven't designed it for that so don't expect it to work well for you.

## Project Design

### Notes
* Make sure to add the type prefix to any interfaces and types within the project as those types won't exist when compiled to JavaScript. So if you don't specify it as a type then there will be a runtime error when you try to import it since it won't exist.

### Personal Preferences
* I try to avoid populating the global space, I just have some functions added to Math and the projConf object I created.
* If a function is exported, I like to have {} for the paramters as that way I don't have to remember their order.

### Event (and Command) Handler
I created an event/command handler. It works similarly to djs commander https://github.com/notunderctrl/djs-commander which has an npm package. That's what I used beforehand and what I based mine off of.

#### Events
There's the events part (even though commands are counted as an event) which is pretty simple. It scans the events directory (which can be changed in src/config.ts) and every directory within that uses its name as the event name. So if it was messageCreate you would make the events/messageCreate directory and every file within that would be run for messageCreate. For the files themselves it's pretty simple, you can name the files anything (as long as it ends with .ts) then you need to export the function as export default. The first parameter is client then the others are passed through from discord.

#### Commands
The commands part was far more difficult to make and was probably what I struggled on the longest. But it should be simple enough to use, for adding a command, your file just needs to export (as default) an object with data and exec, where data is the command data which can be made with SlashCommandBuilder from discord.js and exec is just the command to execute with the parameters as ({client, interaction}).

The directories is where it gets a little more complex. The first set of directories is just for project organisation and won't create any subcommands but all directories created deeper than that will. You can change the depth and even turn off subcommands altogether inside of src/config.ts. If you're adding a subcommand then the data part in your file needs to be created with SlashCommandSubcommandBuilder. Keep in mind that you can always just manually add subcommands in the file, I just thought this made things cleaner.
