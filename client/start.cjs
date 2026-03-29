const { createServer } = require('vite');
async function start() {
  const server = await createServer({
    configFile: require('path').join(__dirname, 'vite.config.js'),
    server: { port: 5180 }
  });
  await server.listen();
  server.printUrls();
}
start().catch(err => { console.error(err); process.exit(1); });
