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
app.use(logger('common'));
// app.use(favicon('public/img/CSFavicon.png'));
app.use(bodyParser.urlencoded({extended: true}));

dotenv.config({path: '.env'});				//	Loads environment variables file

const lkb = {
	path: {
		root: __dirname,
		public: 'public',
		galleries: 'galleries'
	},
	navXmlFile: 'nav.xml'
}
lkb.path.full = path.join(lkb.path.root, lkb.path.public, lkb.path.galleries);


//	ROUTES	//
app.get('/', function(req, res) {
	console.log("...GET request on /...");
	loadGalleryXml('home', galleryXml => {
		// console.log("*******************************\n", galleryXml);
		console.log("...rendering /...");
		res.render('index', {galleryXml: galleryXml});
	});
});

app.get('/c', (req, res) => {
	console.log("...GET request on /c...");
	let categoryName = req.query.category;
	loadCategoryXml(categoryName, categoryXml => {
		console.log("*******************************\n", categoryXml);
		res.render('index', {categoryXml: categoryXml});
	});
});

app.get('/g', (req, res) => {
	console.log("...GET request on /g...");
	let galleryName = req.query.gallery;
	let photo = req.query.photo ? req.query.photo : undefined;
	loadGalleryXml(galleryName, galleryXml => {
		// console.log("*******************************\n", galleryXml);
		// console.log({galleryXml: galleryXml, photo: photo});
		res.render('index', {galleryXml: galleryXml, photo: photo});
	});
});

function loadCategoryXml(categoryName, callback) {
	console.log("...loading category XML...");
	loadNavXml({}, (parsedXml) => {
		callback(JSON.stringify(parsedXml));
	});
}


function loadGalleryNames() {
	console.log("...loading gallery names...");
	lkb.galleries = [];
	let galleries = fs.readdirSync(lkb.path.full).map(name => path.join(lkb.path.full, name)).filter(checkIfFolder);
		galleries.forEach(gallery => {
			lkb.galleries.push(path.basename(gallery).toLowerCase());
		});
}

function loadGalleryXml(galleryName, callback) {
	console.log("...loading gallery XML...");
	let xmlPath = path.join(lkb.path.full, galleryName, galleryName + '.xml');
	fs.readFile(xmlPath, 'utf8', (err, data) => {
		if(err) {
			console.log(err);
		} else {
			// data = JSON.stringify(JSON.parse(xml2json.toJson(data)), null, 2);
			xml2js.parseString(data, {trim: true}, (err, parsedXml) => {
				if(err) {
					console.log(err);
				} else {
					// console.log(util.inspect(parsedXml, false, null))
					parsedXml = addPhotoPaths(parsedXml);											//	Add public folder filepaths to photo filenames
					parsedXml.document.gallery[0].photo.sort(compare);			//	Sort photos in 'position' order
					loadNavXml(parsedXml, (parsedXml) => {
						callback(JSON.stringify(parsedXml));
					});
				}
			});
		}
	});
}

function loadNavXml(parsedXml, callback) {
	console.log("...loading nav XML...");
	let xmlPath = path.join(lkb.path.full, lkb.navXmlFile);
	fs.readFile(xmlPath, 'utf8', (err, data) => {
		if(err) {
			console.log(err);
		} else {
			// data = JSON.stringify(JSON.parse(xml2json.toJson(data)), null, 2);
			xml2js.parseString(data, {trim: true}, (err, parsedNavXml) => {
				if(err) {
					console.log(err);
				} else {
					// console.log(parsedNavXml)
					// console.log(JSON.stringify(parsedNavXml));
					parsedXml.navXml = parsedNavXml;
					callback(parsedXml);
				}
			});
		}
	});
}

function addPhotoPaths(parsedXml) {
	console.log("...adding photo paths...");
	parsedXml.document.gallery[0].photo.forEach((photo, index) => {
		photo.path = path.join(lkb.path.galleries, parsedXml.document.gallery[0].$.folder, photo._);
		photo.thumbPath = path.join(lkb.path.galleries, parsedXml.document.gallery[0].$.folder, 'thumbs', photo._);
		photo.name = photo._.slice(0, -4);
	});
	return parsedXml;
}

function compare(a,b) {
  if (a.$.position < b.$.position)
    return -1;
  if (a.$.position > b.$.position)
    return 1;
  return 0;
}

function checkIfFolder(target) {
	// console.log(`...checking if ${target} is a folder...`);
	return fs.lstatSync(target).isDirectory();
}



function setup() {
	console.log("...setting up...");
	loadGalleryNames();
	console.log(`...gallery list: ${lkb.galleries}`);
}




//	Start server
app.listen(process.env.PORT, process.env.IP, function() {
	console.log("...starting server...");
	setup();
	console.log("...server started...");
});
