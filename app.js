var rls 						= require('readline-sync'),
		fs 							= require('fs'),
		util 						=	require('util'),
		cp 							=	require('child_process'),
		easyimage 			= require('easyimage'),
		express 				= require('express'),
		bodyParser 			= require('body-parser'),
		opn 						=	require('opn'),
		xmljs 					=	require('xml-js'),
		path						=	require('path');

var stdout = process.stdout;

//	Gallery application structure object
const lkb = {
	path: {
		root: __dirname,
		public: 'public',
		galleries: 'galleries'
	},
	folderNameRegex: RegExp(/^[a-zA-Z0-9-_]{0,20}$/),
	galleries: []
}
lkb.path.full = path.join(lkb.path.root, lkb.path.public, lkb.path.galleries);

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(lkb.path.public));
app.set('view engine', 'ejs');
var server;

const PORT = 6105;

//	Gallery tool user interface menu object
lkb.menu = {
	main: function() {
		stdout.write("\n\n----------------------------------------------");
		stdout.write("\nWelcome to the LKB Photography gallery editor!");
		stdout.write("\n----------------------------------------------");
		stdout.write("\nEnter '1' to create a new gallery.");
		stdout.write("\nEnter '2' to edit an existing gallery.");
		stdout.write("\nEnter '3' to edit the photos displayed on the homepage.");
		stdout.write("\nEnter '0' to exit.\n");
		//	Get user choice
		let choice = this.getChoice(4, true);
		// try {
			switch(choice) {
				case 0:
					this.exit();
					break;
				case 1:
					this.createNewGallery();
					break;
				case 2:
					this.editGallery();
					break;
				case 3:
					this.editHomepage();
					break;
				default:
					throw 'Invalid choice!';
					break;
			// }
		// } catch(err) {
		// 	stdout.write('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
		// 	stdout.write(err);
		// 	this.main();
		}
	},
	//	User input functions
	getChoice: function(numberOfOptions, startFromZero, message) {
		//	Return validated user input for menu selections
		let choice;
		if(message) {
			choice = parseInt(rls.question('\n' + message));
		} else {
			choice = parseInt(rls.question('\nEnter your choice: '));
		}
		if(startFromZero) {
			while(!Number.isInteger(choice) || choice < 0 || choice >= numberOfOptions) {
				choice = parseInt(rls.question('\nChoice not recognised! Please try again: '));
			}
		} else {
			while(!Number.isInteger(choice) || choice <= 0 || choice > numberOfOptions) {
				choice = parseInt(rls.question('\nChoice not recognised! Please try again: '));
			}
		}
		return choice;
	},
	enterToContinue: function(customMessage) {
		//	Pause menu flow until user hits enter 
		if(!customMessage || typeof customMessage !== 'string') {
			rls.question('\nHit enter to continue...   ');
		} else {
			rls.question(customMessage);
		}
	},
	//	Main menu functions
	editGallery: function(name) {
		stdout.write('\nEditing existing gallery...');
		this.selectExistingFolder(name);
	},
	editHomepage: function() {
		stdout.write('\nEditing homepage...');
		this.main();
	},
	exit: function() {
		stdout.write('\nBye!\n\n')
		process.exit(0);
	},
	createNewGallery: function() {
		stdout.write('\nCreating new gallery...');
		var newGallery = {}
		newGallery.name = this.getNewFolderName().toLowerCase();
		newGallery.path = path.join(lkb.path.full, newGallery.name);
		this.createNewFolder(newGallery);
		this.readJpgsInFolder(newGallery, true);
		this.processJpgs(newGallery);
		this.setDisplayName(newGallery);
		this.createNewXml(newGallery);
		let choice = this.getChoice(2, false, `\nEnter '1' to view and edit layout of the "${newGallery.name}" gallery, or '2' to return to the main menu: `);
		if(choice === 1) {
			this.editGallery(newGallery.name);
		} else if(choice === 2) {
			this.main();
		}
	},
	//	Gallery functions
	getNewFolderName: function() {
		this.loadGalleryFolders();
		let name, validName = false;
		while(!validName) {
			name = rls.question('\nEnter your new folder name: ');
			if(name.length === 0) {
				stdout.write('\nYou must enter a new folder name!');
			} else if(!lkb.folderNameRegex.test(name)) {
				stdout.write('\n\nFolder names can only contain alphanumeric characters and - or _ symbols, with no spaces.');
			} else if(lkb.galleries.indexOf(name.toLowerCase()) > -1) {
				stdout.write('\nA folder with that name already exists!');
			} else {
				validName = true;
			}
		}
		return name;
	},
	createNewFolder: function(newGallery) {
		stdout.write(`\nCreating folder for new gallery "${newGallery.name}"...`);
		try {
			fs.mkdirSync(newGallery.path)
			stdout.write('\n...creating "thumbs" subfolder...');
			fs.mkdirSync(path.join(newGallery.path, 'thumbs'));
			stdout.write(`\n..."${newGallery.name}" folder successfully created at "${newGallery.path}".\n`);
		} catch(err) {
			stdout.write(err);
		}
	},
	readJpgsInFolder: function(gallery, copyPhotosAlert) {
		gallery.rawJpgs = [];
		console.log(gallery);
		while(gallery.rawJpgs.length === 0) {
			try {
				if(copyPhotosAlert) {
					stdout.write('\nBefore continuing, please copy the photos to be displayed in this new gallery into this new folder.');
					stdout.write("\nPhotos must be in '.jpg' format.");
					stdout.write('\nHit enter when all photos have been copied to the new folder...');
					this.enterToContinue();
				}
				let files = fs.readdirSync(gallery.path);
				files.forEach(file => {
					if(file.slice(-4).toLowerCase() === '.jpg') {
						gallery.rawJpgs.push(file);
					}
				});
				if(gallery.rawJpgs.length === 0) {
					stdout.write('\nNo photos were detected in the folder!\n');
					let choice = this.getChoice(2, false, "Enter '1' to try again, or '2' to return to the main menu: ");
					if(choice === 2) {
						this.main();
					}
				}
			} catch(err) {
				stdout.write(err);
			}
		}
	},
	processJpgs: function(gallery) {
		this.checkForImageMagick();
		gallery.jpgFiles = [];
		gallery.rawJpgs.forEach((jpgFile, index) => {
			let newFileName = gallery.name + '_' + index + '.jpg';
			let newFilePath = path.join(gallery.path, newFileName);
			fs.renameSync(path.join(gallery.path, jpgFile), newFilePath);
			if(process.platform === 'win32') {
				cp.execSync('magick mogrify -geometry 1250x1250 ' + newFilePath);
			} else if(process.platform === 'linux') {
				cp.execSync('mogrify -geometry 1250x1250 ' + newFilePath);
			}
			fs.copyFileSync(newFilePath, path.join(gallery.path, 'thumbs', newFileName));
			if(process.platform === 'win32') {
				cp.execSync('magick mogrify -geometry 400x ' + path.join(gallery.path, 'thumbs', newFileName));
			} else if(process.platform === 'linux') {
				cp.execSync('mogrify -geometry 400x ' + path.join(gallery.path, 'thumbs', newFileName));
			}
			gallery.jpgFiles.push(newFileName);
		});
		stdout.write(`\n${gallery.jpgFiles.length} Images in "${gallery.name}" have been formatted and thumbnails have been created.\n`);
	},
	setDisplayName: function(gallery) {
		let displayName = rls.question(`\nEnter a new display name for the "${gallery.name}" gallery: `);
		while(displayName.length === 0) {
			stdout.write('\nYou must give the gallery a display name!');
			displayName = rls.question(`\nEnter a new display name for the "${gallery.name}" gallery: `);
		}
		gallery.displayName = displayName;
	},
	createNewXml: function(gallery) {
		stdout.write("\nCreating layout file...");
		//	XML syntax
		if(!gallery.cols) { 
			gallery.cols = 3;
		}
		let content = this.insertXMLHeader(gallery);
		gallery.jpgFiles.forEach((fileName, index) => {
			content += `\t\t<photo position="${index}" displayed="true">${fileName}</photo>\n`;
		});
		content += '\t</gallery>\n' + '</document>\n';
		this.saveXmlFile(gallery, content);
	},
	updateXml: function(gallery) {
		stdout.write("\nUpdating layout file...");
		let content = this.insertXMLHeader(gallery);
		gallery.path = path.join(lkb.path.full, gallery.name);
		gallery.photos.forEach((photo, index) => {
			content += `\t\t<photo position="${photo.position}" displayed="${photo.displayed}">${photo.filename}</photo>\n`;
		});
		content += '\t</gallery>\n' + '</document>\n';
		this.saveXmlFile(gallery, content);
	},
	saveXmlFile: function(gallery, xmlString) {
		console.log("\n\n\n\n\n")
		console.log(gallery);
		console.log("\n\n\n\n\n")
		console.log(xmlString);
		console.log("\n\n\n\n\n")
		try {
			fs.writeFileSync(path.join(gallery.path, gallery.name.toLowerCase() + '.xml'), xmlString);		
			stdout.write(`\nLayout file "${gallery.name.toLowerCase()}.xml" has been saved for the "${gallery.name}" gallery.`);
		} catch(err) {
			stdout.write('Error saving file!');
			stdout.write(err);
		}
	},
	insertXMLHeader: function(gallery) {
		return '<?xml version="1.0" encoding="UTF-8"?>\n' + '<document>\n' + `\t<gallery folder="${gallery.name}" displayname="${gallery.displayName}" columns="${gallery.cols}">\n`;
	},
	checkForImageMagick: function() {
		// console.log(process.platform);
		let output;
		if(process.platform === 'win32') {
			output = cp.execSync('magick -version');
		} else if(process.platform === 'linux') {
			output = cp.execSync('identify -version')
		}
		// stdout.write(output.toString('utf8'));
		if(output.toString('utf8').slice(0,7) != 'Version') {
			stdout.write("\n\nImageMagick is not installed!");
			stdout.write("\nTo process photos using this tool, you must install the ImageMagick command line tool from https://imagemagick.org.");
			this.enterToContinue();
			this.main();
		} else {
			stdout.write("ImageMagick detected...");
		}
	},
	selectExistingFolder: function(name) {
		this.loadGalleryFolders();
		if(lkb.galleries.length === 0) {
			stdout.write(`\nThere are not currently any galleries!\n`)
			this.main();
		} else {
			if(!name) {
				stdout.write(`\nCurrent galleries:\n`);
				lkb.galleries.forEach((gallery, index) => {
					stdout.write(`\n  ${index+1}: ${gallery}`);
				});
				let choice = this.getChoice(lkb.galleries.length+1, true, "\nEnter the number of the gallery to continue, or '0' to return to the menu: ");
				if(choice === 0) {
					this.main();
				} else {
					name = lkb.galleries[choice-1];
				}
			} else {
				if(lkb.galleries.indexOf(name) === -1) {
					stdout.write(`\nThe "${name}" gallery does not exist!`);
					this.main();
				}
			}
			this.showGallery(name);
		}
	},
	loadGalleryFolders: function() {
		lkb.galleries = [];
		let galleries = fs.readdirSync(lkb.path.full).map(name => path.join(lkb.path.full, name)).filter(this.checkIfFolder);
		galleries.forEach(gallery => {
			lkb.galleries.push(path.basename(gallery).toLowerCase());
		});
	},
	showGallery: function(name) {
		stdout.write(`\n\nShowing ${name}`);
		lkb.server.showGallery(name);
	},
	checkIfFolder: function(target) {
		return fs.lstatSync(target).isDirectory();
	},
	parseXmlFile: function(gallery, callback) {
		let filepath = path.join(lkb.path.full, gallery.name, gallery.name.toLowerCase() + '.xml');
		let filedata = fs.readFileSync(filepath, 'utf8');
		console.log("\n__________________filedata:\n")
		console.log(filedata);
		gallery.xml = filedata.replace(/(\r\n|\n|\r|\t)/gm,"");
		console.log(gallery.xml);
		callback();
	}
}

//	Server
lkb.server = {
	start: function(callback) {
		app.get('/g', (req, res) => {
			let gallery = {
				parent: lkb.path.galleries,
				name: req.query.name
			};
			lkb.menu.parseXmlFile(gallery, () => {
				res.render('newgallery', {gallery: gallery});
			});
		});
		app.post('/g', (req, res) => {
			console.log("\n\nRequest received!");
			console.log(req.body);
			lkb.menu.updateXml(req.body);
			res.sendStatus(200);
		});
		app.get('/exit', (req, res) => {
			console.log("Exiting...");
			this.stop(() => {
				res.sendStatus(200);
				lkb.menu.main();
			});
		});
		if(server) {
			server.close();
		}
		server = app.listen(PORT, 'localhost', () => {
			stdout.write(`\nServer started on port ${PORT}...\n`);
			if(callback && typeof callback === 'function') {
				callback();
			}
		});
	},
	stop: function(callback) {
		console.log("Stopping server...");
		if(callback && typeof callback === 'function') {
			callback();
		}
	},
	showGallery: function(name, callback) {
		stdout.write(`\nShowing gallery: ${name}`);
		opn(`http://localhost:${PORT}/g?name=${name}`);
		if(callback && typeof callback === 'function') {
			callback();
		}
	}
}

//	Launch
function start() {
	lkb.server.start(() => {
		lkb.menu.main();
	});
}

start();


