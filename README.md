

# node-red-contrib-herokupg
Node-red-contrib-herokupg  is a [**Node-RED**](http://nodered.org/) node allowing basic access to [**Postgres**](https://www.postgresql.org/) :elephant: database.

This is a fork of the [postgrestor](https://github.com/andreabat/node-red-contrib-postgrestor) that has been modified to use a postgres URL as the connection details specifically the format used by the Heroku addon suplied in an environment varible.

Pass them as a parameter array  ***params** of the msg object.

Node-red-contrib-postgrestor sets up a console to execute queries against the configured database.

```msg.payload``` will contain the result object of the query. It has the following properties:
* ```command```: The sql command that was executed (e.g. "SELECT", "UPDATE", etc.)
* ```rowCount```: The number of rows affected by the SQL statement
* ```oid```: The oid returned
* ```rows```: An array of rows


Postgres implements a template engine allowing parameterized queries:
```sql
/* INTEGER id COLUMN */
SELECT * FROM table WHERE id = {{ msg.id }}

/* VARCHAR id COLUMN */
SELECT * FROM table WHERE id = '{{ msg.id }}'



SELECT * FROM table where name = $1;

```

msg.params = ['Andrea'] 

