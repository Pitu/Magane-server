const Server = require('./structures/Server');
const { port } = require('./config').server;

const server = new Server({ port });

server.start();
