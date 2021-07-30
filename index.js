import express from 'express';
import morgan from 'morgan';
import busboy from 'connect-busboy';
import busboyBodyParser from 'busboy-body-parser';

import cors from 'cors';
import './database.js';

import userRoutes from './src/routes/user.routes.js';
import challengeRoutes from './src/routes/challenge.routes.js';

const app = express();

app.use(morgan('dev'));
app.use(busboy());
app.use(busboyBodyParser());
app.use(express.json());
app.use(cors());

/* ROTAS */
app.use('/user', userRoutes);
app.use('/challenge', challengeRoutes);

app.listen(process.env.PORT || 8000, function () {
  console.log('WS okay');
});
