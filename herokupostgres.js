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
    RED.nodes.createNode(this, config);
    var node = this;
    node.name = config.name;
    console.log(config.dbconnFieldType)
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
        node.dburl = new URL(process.env[node.credentials.dbconn])
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
      case 'urlstring': {
        node.dburl = new URL(node.credentials.dbconn)
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
          user: node.credentials.username,
          password: node.credentials.password,
          host: node.credentials.host,
          port: node.credentials.port,
          database: node.credentials.database,
          ssl: {
            rejectUnauthorized: false
          }
        });
        break
      }
      case 'conn': {
        node.pgPool = new Pool(JSON.parse(this.credentials.connobj));
        break
      }
      console.log(node.pgPool)
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
    }
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

