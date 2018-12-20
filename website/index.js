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
	xml2json					=	require('xml2json'),
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
	res.render('home', {galleryXml: 'home'});
});

app.get('/g', (req, res) => {
	let galleryName = req.query.name;
	loadGalleryXml(galleryName, (galleryXml) => {
		console.log("*******************************\n", galleryXml);
		res.render('gallery', {galleryXml: galleryXml});
	});
});


function loadGalleryNames() {
	lkb.galleries = [];
	let galleries = fs.readdirSync(lkb.path.full).map(name => path.join(lkb.path.full, name)).filter(checkIfFolder);
		galleries.forEach(gallery => {
			lkb.galleries.push(path.basename(gallery).toLowerCase());
		});
}

function loadGalleryXml(galleryName, callback) {
	let xmlPath = path.join(lkb.path.full, galleryName, galleryName + '.xml');
	fs.readFile(xmlPath, 'utf8', (err, data) => {
		if(err) {
			console.log(err);
		} else {
			// data = JSON.stringify(JSON.parse(xml2json.toJson(data)), null, 2);
			data = xml2json.toJson(data);										//	Parse XML doc to JSON
			data = addPhotoPaths(data);											//	Add public folder filepaths to photo filenames
			data.document.gallery.photo.sort(compare);			//	Sort photos in 'position' order
			callback(JSON.stringify(data));
		}
	})
}

function addPhotoPaths(galleryXml) {
	galleryXml = JSON.parse(galleryXml);
	galleryXml.document.gallery.photo.forEach((photo, index) => {
		photo.path = path.join(lkb.path.galleries, galleryXml.document.gallery.folder, photo.$t);
		photo.thumbPath = path.join(lkb.path.galleries, galleryXml.document.gallery.folder, 'thumbs', photo.$t);
		console.log(photo.path);
	});
	return galleryXml;
}

function compare(a,b) {
  if (a.position < b.position)
    return -1;
  if (a.position > b.position)
    return 1;
  return 0;
}

function checkIfFolder(target) {
	return fs.lstatSync(target).isDirectory();
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
