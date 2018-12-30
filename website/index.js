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
	xml2js 						=	require('xml2js'),
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
			console.log(data);
			console.log(`\n\n${typeof data}\n\n`)
			xml2js.parseString(data, {trim: true}, (err, parsedXml) => {
				if(err) {
					console.log(err);
				} else {
					console.log(util.inspect(parsedXml, false, null))
					parsedXml = addPhotoPaths(parsedXml);											//	Add public folder filepaths to photo filenames
					parsedXml.document.gallery[0].photo.sort(compare);			//	Sort photos in 'position' order
					callback(JSON.stringify(parsedXml));
				}
			});
		}
	})
}

function addPhotoPaths(parsedXml) {
	console.log(parsedXml.document.gallery[0]);
	parsedXml.document.gallery[0].photo.forEach((photo, index) => {
		console.log(photo);
		photo.path = path.join(lkb.path.galleries, parsedXml.document.gallery[0].$.folder, photo._);
		photo.thumbPath = path.join(lkb.path.galleries, parsedXml.document.gallery[0].$.folder, 'thumbs', photo._);
		console.log(photo.path);
	});
	return parsedXml;
}

function compare(a,b) {
	console.log(a.$.position);
  if (a.$.position < b.$.position)
    return -1;
  if (a.$.position > b.$.position)
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
