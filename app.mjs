import express from 'express';
import boardApi from './boardapi.mjs';
import memberApi from './memberapi.mjs';
import authMiddleware from './authmiddleware.mjs';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'content-type, access-token');
    next();
});

app.use('/boards', boardApi);
app.use('/members', memberApi);

app.listen(9000, () => {
    console.log('Listening...');
});