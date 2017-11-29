const needle = require("needle");
const io = require("socket.io");

const chunkStore = require("./../../lib/chunkStore.js");

const moduleConfig = require("./config"); // not to be confused with clusterio config. This config is private to this plugin.
console.log("/silent-command game.print('"+moduleConfig.name+" version "+moduleConfig.version+" enabled')");

// initialize chunk database
const chunkMap = new chunkStore(config.unique, 64, "./chunkStore/"+config.unique);

/*setInterval(function(){
	console.log("/silent-command game.write_file('"+moduleConfig.scriptOutputFileSubscription+"', game.tick, true, 0)");
},1000);*/

var config = {};
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
	var chunk = process.stdin.read();
	if (chunk !== null && !isNaN(chunk) && !chunk.includes("objects")){
		console.log(chunk);
		throw chunk;
		// objects -29,-35;-28,-34: ,inserter -28.5 -34.5
		
		let data = chunk.split(",");
		data.shift();data.shift();data.shift();
		if(data && data[0] == undefined){
			// this position is now empty, delete whatever was there from DB
			console.log("empty: ")
			console.log(chunk)
		}
		data.forEach(entity => {
			let name = entity.split(" ")[0];
			let xPos = entity.split(" ")[1];
			let yPos = entity.split(" ")[2];
			if(xPos && yPos && name){
				chunkMap.setEntity(xPos, yPos, name).then(chunk => {
					console.log("Added "+name+" to chunk "+chunk.position.x+", "+chunk.position.y);
				});
			}
		});
		
	} else {
		// config is the same config as client.js and master.js uses
		config = JSON.parse(chunk);
		
		// set up websocket communication and handle requests from web interface users (which are going through master)
		// socket should be a global
		socket = io.connect("http://"+config.masterIP+":"+config.masterPort);
		socket.on("hello", data => {
			socket.emit("registerSlaveMapper", {instanceID: config.unique});
		});
	}
});
process.stdin.on('end', () => {
	process.stdout.write('end');
});
