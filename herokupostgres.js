module.exports = function (RED) {
  'use strict';
  const mustache = require('mustache');
  const Pool = require('pg').Pool;

  function getField(node, kind, value) {
    switch (kind) {
      case 'flow': {
        return node.context().flow.get(value);
      }
      case 'global': {
        return node.context().global.get(value);
      }
      case 'num': {
        return parseInt(value);
      }
      case 'bool': {
        return JSON.parse(value);
      }
      default: {
        return value;
      }
    }
  }

  function PGConfig(config) {
    console.log(config)
    RED.nodes.createNode(this, config);
    var node = this;
    node.name = config.name;
    switch (config.dbconnFieldType) {
      case 'DATABASE_URL': {
        node.dburl = new URL(process.env.DATABASE_URL)
        node.pgPool = new Pool({
          user: node.dburl.username,
          password: node.dburl.password,
          host: node.dburl.hostname,
          port: node.dburl.port,
          database: node.dburl.pathname.replace("/",""),
          ssl: {
            rejectUnauthorized: false
          }
        });
        break;
      }
      case 'env': {
        node.dburl = new URL(process.env[config.credentials.dbconn])
        node.pgPool = new Pool({
          user: node.dburl.username,
          password: node.dburl.password,
          host: node.dburl.hostname,
          port: node.dburl.port,
          database: node.dburl.pathname.replace("/",""),
          ssl: {
            rejectUnauthorized: false
          }
        });
        break
      }
      case 'str': {
        node.dburl = new URL(config.credentials.dbconn)
        node.pgPool = new Pool({
          user: node.dburl.username,
          password: node.dburl.password,
          host: node.dburl.hostname,
          port: node.dburl.port,
          database: node.dburl.pathname.replace("/",""),
          ssl: {
            rejectUnauthorized: false
          }
        });
        break
      }
      case 'values': {
        node.pgPool = new Pool({
          user: config.credentials.username,
          password: config.credentials.password,
          host: config.credentials.hostname,
          port: config.credentials.port,
          database: config.credentials.database,
          ssl: {
            rejectUnauthorized: false
          }
        });
        break
      }
      case 'connobj': {
        node.pgPool = new Pool(JSON.parse(config.credentials.connobj));
        break
      }
    } 
    
  }
  RED.nodes.registerType('PGConfig', PGConfig,{
    credentials: {
        dbconn: {type:"text"},  
        username: {type:"text"},
        password: {type:"password"},
        host: {type:"text"},
        port: {type:"text"},
        database: {type:"text"},
        connobj: {type:"text"}
    });




  function Postgres(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.config = RED.nodes.getNode(config.PGConfig);
    node.on('input', (msg) => {
      const query = mustache.render(config.query, { msg });
      const asyncQuery = async () => {
        let client = false;
        try {
          client = await node.config.pgPool.connect();
          var res = await client.query(query, msg.params || []);
        } catch (err) {
          const error = err.toString();
          node.error(error);
          msg.payload = error;
        } finally {
          if (client) {
            client.release();
          }
          msg.payload = {}
          msg.payload.command = res.command
          msg.payload.rowCount = res.rowCount
          msg.payload.oid = res.oid
          msg.payload.rows = res.rows
          node.send(msg);
        }
      };
      asyncQuery();
    });
    node.on('close', () => node.status({}));
  }
  RED.nodes.registerType('Postgres', Postgres);
}

