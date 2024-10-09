import express from 'express';
import connection from './database/db.js';
import routes from './routes/route.js';
import dotenv from 'dotenv';

const app = express();
const port = 3000;

app.use(express.json());

connection();

dotenv.config();

app.use(express.static('public'));

app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
