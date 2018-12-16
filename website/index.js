var express 				= require('express'),
	logger						= require('morgan'),
	dotenv						= require('dotenv'),
	favicon						= require('serve-favicon'),
	bodyParser				= require('body-parser'),
	opn								=	require('opn'),
	del								=	require('del'),
	path							=	require('path'),
	fs								=	require('fs-extra'),
	util							=	require('util'),
	app 							= express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(logger('dev'));
// app.use(favicon('public/img/CSFavicon.png'));
app.use(bodyParser.urlencoded({extended: true}));

dotenv.config({path: '.env'});				//	Loads environment variables file

const lkb = {
	path: {
		root: __dirname,
		public: 'public',
		galleries: 'galleries'
	}
}
lkb.path.full = path.join(lkb.path.root, lkb.path.public, lkb.path.galleries);


//	ROUTES	//
app.get('/', function(req, res) {
	res.render('homepage');
});

app.get('/g', (req, res) => {
	let gallery = req.query.name;
	res.render('gallery', {gallery: gallery});
});


function loadGalleryNames() {
	lkb.galleries = [];
	let galleries = fs.readdirSync(lkb.path.full).map(name => path.join(lkb.path.full, name)).filter(checkIfFolder);
		galleries.forEach(gallery => {
			lkb.galleries.push(path.basename(gallery).toLowerCase());
		});
}

function checkIfFolder(target) {
	return fs.lstatSync(target).isDirectory();
}

function loadGalleryXml(galleryName) {
	let galleryObj = {};

}


function setup() {
	loadGalleryNames();
	console.log(lkb.galleries);
}




//	Start server
app.listen(process.env.PORT, process.env.IP, function() {
	setup();
	console.log("Server started");
});
