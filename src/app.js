const express = require('express');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

require('./db/mongoose');  // connecting to the database

const app = express(); // creating a new express app instance

const PORT = process.env.PORT;
const hostname = '127.0.0.1';

app.use(express.json()); // setting up our app to automatically parse raw json from req

app.use(userRouter); // registeing the user router with our app
app.use(taskRouter); // registeing the user router with our app

app.listen(PORT, () => {
    console.log(`server up on http://${hostname}:${PORT}`);
});