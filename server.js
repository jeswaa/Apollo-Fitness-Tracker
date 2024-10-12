import express from 'express';
import connection from './database/db.js';
import routes from './routes/route.js';
import dotenv from 'dotenv';
import path from 'path';

const app = express();
const port = 3000;

app.use(express.json());
connection();
dotenv.config();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));
app.use('/', routes);

app.use((req, res, next) => {
    res.status(404).send("Sorry, that route doesn't exist.");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
