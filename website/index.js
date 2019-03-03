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

var Promise = require("es6-promise").Promise;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(logger('common'));
// app.use(favicon('public/img/CSFavicon.png'));
app.use(bodyParser.urlencoded({extended: true}));

dotenv.config({path: '.env'});				//	Loads environment variables file

//	Server config object
const config = {
	path: {
		root: __dirname,
		public: 'public',
		galleries: 'galleries'
	},
	navXmlFile: 'nav.xml'
}
config.path.full = path.join(config.path.root, config.path.public, config.path.galleries);



///////////////////////////////////
//	Build 'content map' object
///////////////////////////////////
var lkb = {
	galleries: {}
}

//	Main content mapping function (called on server start)
function mapSiteContent() {
	console.log("...mapping site content...");
	return new Promise((resolve, reject) => {
		// console.log(`\n\nInitial: ${JSON.stringify(lkb)}\n\n`);
		loadNavXml(lkb)
		.then(() => {
			return addGalleryObjects(lkb)
		})
		.then(() => {
			return loadGalleryContent(lkb)
		})
		.then(() => {
			lkb = JSON.stringify(lkb);
			console.log("...site content mapped!");
			// console.log(lkb);
			resolve(lkb);
		})
		.catch(err => {
			console.log("Failed!", err);
		});
	});
}	

function loadNavXml(lkb) {
	console.log("...loading nav XML...");
	return new Promise((resolve, reject) => {
		let xmlPath = path.join(config.path.full, config.navXmlFile);
		fs.readFile(xmlPath, 'utf8', (err, data) => {
			if(err) {
				reject(Error(err));
			} else {
				xml2js.parseString(data, {trim: true}, (err, parsedNavXml) => {
					if(err) {
					reject(Error(err));
					} else {
						lkb.nav = parsedNavXml;
						lkb.nav = lkb.nav.nav;
						console.log("\nResolving loadNavXml");
						console.log(`${JSON.stringify(lkb.nav)}\n`);
						resolve(lkb);
					}
				});
			}
		});
	});
}

function addGalleryObjects(lkb) {
	console.log("...adding gallery objects...");
	return new Promise((resolve, reject) => {
		fs.readdir(config.path.full, (err, data) => {
			if(err) {
				reject(Error(err));
			} else {
				data = data.map(name => path.join(config.path.full, name)).filter(checkIfFolder);
				data.forEach(galleryName => {
					lkb.galleries[(path.basename(galleryName).toLowerCase())] = {};
				});
				console.log("\nResolving addGalleryObjects");
				// console.log(`${JSON.stringify(lkb)}\n`);
				resolve(lkb);
			}
		})
	});
}

function loadGalleryContent(lkb) {
	console.log("...loading gallery content...");
	return new Promise((resolve, reject) => {
		let promises = [];
		Object.keys(lkb.galleries).forEach((galleryName, index) => {
			promises.push(loadGalleryXml(lkb, galleryName));
		});
		Promise.all(promises).then(() => {
			resolve(lkb);
		});
	});
}

function loadGalleryXml(lkb, galleryName) {
	return new Promise((resolve, reject) => {
		let xmlPath = path.join(config.path.full, galleryName, galleryName + '.xml');
		fs.readFile(xmlPath, 'utf8', (err, data) => {
			if(err) {
				reject(Error(err));
			} else {
				xml2js.parseString(data, {trim: true}, (err, parsedXml) => {
					//	Remove any photos without 'displayed': 'true'
					parsedXml.document.gallery[0].photo = parsedXml.document.gallery[0].photo.filter(photo => {
						return photo.$.displayed === "true";
					});
					// console.log(JSON.stringify(parsedXml.document.gallery[0].photo) + '\n');
					if(err) {
						reject(Error(err));
					} else {
						//	Add public folder filepaths to photo filenames
						parsedXml = addPhotoPaths(parsedXml);
						//	Sort photos in 'position' order
						parsedXml.document.gallery[0].photo.sort(compare);
						lkb.galleries[galleryName] = parsedXml.document.gallery[0];
						// console.log(`Resolving loadGalleryXml for ${galleryName} : ${lkb.galleries[galleryName].$.displayname}`);
						resolve(parsedXml);
					}
				});
			}
		});
	})
}

function addPhotoPaths(parsedXml) {
	// console.log("...adding photo paths...");
	parsedXml.document.gallery[0].photo.forEach((photo, index) => {
		photo.path = path.join(config.path.galleries, parsedXml.document.gallery[0].$.folder, photo._);
		photo.thumbPath = path.join(config.path.galleries, parsedXml.document.gallery[0].$.folder, 'thumbs', photo._);
		photo.name = photo._.slice(0, -4);
	});
	return parsedXml;
}







function loadCategoryXml(categoryName, callback) {
	console.log("...loading category XML...");
	loadNavXml({}, (parsedXml) => {
		callback(JSON.stringify(parsedXml));
	});
}



///////////////////////////////////
//	Utility functions
///////////////////////////////////

function compare(a,b) {
  if (parseInt(a.$.position) < parseInt(b.$.position))
    return -1;
  if (parseInt(a.$.position) > parseInt(b.$.position))
    return 1;
  return 0;
}

function checkIfFolder(target) {
	// console.log(`...checking if ${target} is a folder...`);
	return fs.lstatSync(target).isDirectory();
}

///////////////////////////////////
//	Routes
///////////////////////////////////

app.get('/', function(req, res) {
	console.log("...GET request on /...");
	if(req.query.view) {
		lkb = JSON.parse(lkb);
		lkb.query = {
			view: req.query.view
		};
		console.log(req.query);
		if(req.query.cat) {
			lkb.query.cat = req.query.cat;
		} else if(req.query.gal) {
			lkb.query.gal = req.query.gal;
		}
		if(req.query.img) {
			lkb.query.imgName = req.query.img;
		}
		console.log(`\n*****************\n${JSON.stringify(lkb.query)}`);
		lkb = JSON.stringify(lkb);
	}
	//	Create lkb object containing map of all site content to be passed to client 
	res.render('index', {lkb: lkb});
});

//	Start server
function startServer() {
	console.log("...starting server...");
	mapSiteContent()
	.then((response) => {
		// console.log(`${JSON.stringify(lkb, null, 2)}\n`);
		app.listen(process.env.PORT, process.env.IP, () => {
			console.log("\n\n...server started...");
		});
	});
}

startServer();

