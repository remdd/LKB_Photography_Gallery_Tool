var express 				= require('express'),
	logger						= require('morgan'),
	dotenv						= require('dotenv'),
	favicon						= require('serve-favicon'),
	bodyParser				= require('body-parser'),
	app 							= express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(logger('dev'));
// app.use(favicon('public/img/CSFavicon.png'));
app.use(bodyParser.urlencoded({extended: true}));

dotenv.config({path: '.env'});				//	Loads environment variables file

//	ROUTES	//
app.get('/', function(req, res) {
	res.render('homepage');
});

app.get('/g', (req, res) => {
	let gallery = req.query.name;
	res.render('gallery', {gallery: gallery});
});

app.listen(process.env.PORT, process.env.IP, function() {
	console.log("Server started");
});
