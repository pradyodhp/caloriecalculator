import EmbeddedPostgres from 'embedded-postgres';
const pg = new EmbeddedPostgres({ databaseDir: '/tmp/pgdata', user: 'nutritrack', password: 'nutritrack', port: 54329, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('nutritrack');
console.log('READY');
setTimeout(async()=>{await pg.stop();process.exit(0)}, 600000);
