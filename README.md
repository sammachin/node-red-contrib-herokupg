

# node-red-contrib-herokupg
Node-red-contrib-herokupg  is a [**Node-RED**](http://nodered.org/) node allowing basic access to [**Postgres**](https://www.postgresql.org/) :elephant: database.

This is a fork of the [postgrestor](https://github.com/andreabat/node-red-contrib-postgrestor) that has been modified to use a Postgres URL as the connection details specifically the format used by the Heroku addon suplied in an environment varible.


# Configuration

The herokupg_config node takes a single url with the details of the postgres server and database eg:
`postgres://user:password@hostname:port/database`

This can be supplied in 3 ways, the default is an env parameter called `DATABASE_URL` which is the Heroku default, you can also specify any other env parameter or just enter it as a string.

# Queries
The HerokuPG node 
Pass them as a parameter array  ***params** of the msg object.

The node sets up a console to execute queries against the configured database.

It also  suports mustache templates within queries queries:
```sql
SELECT * FROM table WHERE name = '{{ msg.name }}'

SELECT * FROM table where name = $1;
```
```json
msg.name = "Bob"
msg.params = ['Bob'] 
```


## Output

```msg.payload``` will contain the result object of the query. It has the following properties:
* ```command```: The sql command that was executed (e.g. "SELECT", "UPDATE", etc.)
* ```rowCount```: The number of rows affected by the SQL statement
* ```oid```: The oid returned
* ```rows```: An array of rows
