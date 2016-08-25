var fs = require('fs');
var needle = require("needle");
// require config.json
var config = require('./config');
// connect us to the server with rcon
// IP, port, password
var Rcon = require('simple-rcon');
var client = new Rcon({
	host: config.clientIP,
	port: config.clientPort,
	password: config.clientPassword,
	timeout: 0
}).connect();

fs.writeFileSync(config.factorioDirectory + "/script-output/orders.txt", "")

client.on('authenticated', function() {
	console.log('Authenticated!');
}).on('connected', function() {
	console.log('Connected!');
}).on('disconnected', function() {
	console.log('Disconnected!');
	// now reconnect
	client.connect();
});

// set some globals
confirmedOrders = [];

// trigger when something happens to output.txt
fs.watch(config.factorioDirectory + "/script-output/output.txt", "utf8", function(eventType, filename) {
	// get array of lines in file
	items = fs.readFileSync(config.factorioDirectory + "/script-output/output.txt", "utf8").split("\n");
	// if you found anything, reset the file
	if(items[0]) {
		fs.writeFileSync(config.factorioDirectory + "/script-output/output.txt", "")
	}
	for(i = 0;i < items.length; i++) {
		if(items[i]) {
			g = items[i].split(" ");
			g[0] = g[0].replace("\u0000", "");
			console.log("exporting " + JSON.stringify(g));
			// send our entity and count to the master for him to keep track of
			needle.post(config.masterIP + ":" + config.masterPort + '/place', {name:g[0], count:g[1]}, 
			function(err, resp, body){
				// console.log(body);
			});
		}
	}
})

fs.watch(config.factorioDirectory + "/script-output/orders.txt", "utf8", function(eventType, filename) {
	// get array of lines in file
	items = fs.readFileSync(config.factorioDirectory + "/script-output/orders.txt", "utf8").split("\n");
	// if you found anything, reset the file
	if(items[0]) {
		fs.writeFileSync(config.factorioDirectory + "/script-output/orders.txt", "")
	}
	
	for(i = 0;i < items.length; i++) {
		if(items[i]) {
			g = items[i].split(" ");
			g[0] = g[0].replace("\u0000", "");
			g[0] = g[0].replace(",", "");
			// send our entity and count to the master for him to keep track of
			needle.post(config.masterIP + ":" + config.masterPort + '/remove', {name:g[0], count:g[1]}, function(err, resp, body){
				if(body == "success"){
					console.log("importing: " + JSON.stringify({[g[0]]: g[1]}));
					// buffer confirmed orders
					confirmedOrders[confirmedOrders.length] = {[g[0]]: g[1]}
					//client.exec("/c remote.call('clusterio', 'importMany', '[" + JSON.stringify(jsonobject) + "]')")
				} else {
					console.log("ERROR: " + body)
				}
			});
		}
	}
	// if we got some confirmed orders
	console.log("Importing " + confirmedOrders.length + " items! " + JSON.stringify(confirmedOrders));
	if(confirmedOrders[1]) {
		// send our RCON command
		client.exec("/c remote.call('clusterio', 'importMany', '" + JSON.stringify(confirmedOrders) + "')");
		confirmedOrders = [];
	}
	
	/*for(i = 0;i < items.length; i++) {
		if(items[i]) {
			g = items[i].split(" ");
			g[0] = g[0].replace("\u0000", "");
			g[0] = g[0].replace(",", "");
			console.log(g);
			// send our entity and count to the master for him to keep track of
			needle.post(config.masterIP + ":" + config.masterPort + '/remove', {name:g[0], count:g[1]}, function(err, resp, body){
				console.log(body);
				if(body == "success"){
					client.exec("/c remote.call('clusterio', 'import', '" + g[0] + "', " + g[1] + ")")
				}
			});
		}
	}*/
})
