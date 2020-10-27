const express = require('express');
const asyncify = require('express-asyncify');
const cors = require('cors');
 
const app = asyncify(express());

const compression = require('compression');
app.use(compression());

const bodyParser = require('body-parser');
const request = require('request');

const logger = require('./utils/logger');

// CORS 설정
app.use(cors());


// var app = express();
var PORT= process.env.PORT || 3000;

// Publishing Version
const PUB_VER = "";

// https redirect

app.all('*', (req, res, next) => { 
    let userAgent = req.headers['User-Agent'] || req.userAgent; 
    let protocol = req.headers['x-forwarded-proto'] || req.protocol; 
    // console.log(`User-Agent:${userAgent}`);
    if (req.hostname == 'localhost' || protocol == 'https') { 
        next(); 
    } else { 
        let from = `${protocol}://${req.hostname}${req.url}`; 
        let to = `https://금방금방.kr${req.url}`; // log and redirect 
        logger.info(`[${req.method}]: ${from} -> ${to}`); 
        res.redirect(to); 
    } 
});

//urlEncode
app.use(bodyParser.urlencoded({extended : true}));

//view
app.set('views', __dirname+PUB_VER+'/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname+PUB_VER+"/public"));

//use cache-control
var   maxAge =  60 * 60 * 24;
app.all('/img/*',function(req,res,next){
    res.set('Cache-Control', 'public, max-age=31557600');
    next();
});
app.use("/", require(__dirname+PUB_VER+"/server/index"));

//listen
app.listen(PORT, function(){
    logger.info(`Listening on port ${PORT}...`);
});

app.use(function(err, req, res, next) { 
    logger.error(err);
});