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

  function HerokuPGConfig(n) {
    const node = this;
    RED.nodes.createNode(node, n);
    node.name = n.name;
    switch (n.dburlFieldType) {
      case 'DATABASE_URL': {
        node.dburl = new URL(process.env.DATABASE_URL)
      }
      case 'env': {
        node.dburl = new URL(process.env[n.dburl])
      }
      case 'str': {
        node.dburl = new URL(n.dburl)
      }
    } 
    this.pgPool = new Pool({
      user: node.dburl.username,
      password: node.dburl.password,
      host: node.dburl.hostname,
      port: node.dburl.port,
      database: node.dburl.pathname.replace("/",""),
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  RED.nodes.registerType('HerokuPGConfig', HerokuPGConfig);

  function HerokuPG(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.config = RED.nodes.getNode(config.postgresDB);
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

  RED.nodes.registerType('HerokuPG', HerokuPG);
}

