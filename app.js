var rls 						= require('readline-sync'),
		fs 							= require('fs'),
		util 						=	require('util'),
		cp 							=	require('child_process'),
		easyimage 			= require('easyimage'),
		express 				= require('express'),
		bodyParser 			= require('body-parser'),
		opn 						=	require('opn'),
		xmljs 					=	require('xml-js'),
		del 						=	require('del'),
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

var menu;

//	Gallery tool user interface menu object
Menu = function() {
	this.main = function() {
		stdout.write("\n\n----------------------------------------------");
		stdout.write("\nWelcome to the LKB Photography gallery editor!");
		stdout.write("\n----------------------------------------------");
		stdout.write("\nEnter '1' to create a new gallery.");
		stdout.write("\nEnter '2' to edit an existing gallery.");
		stdout.write("\nEnter '3' to edit the photos displayed on the homepage.");
		stdout.write("\nEnter '0' to exit.\n");
		//	Get user choice
		let choice = this.getChoice(4, true);
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
		}
	},
	//	User input functions
	this.getChoice = function(numberOfOptions, startFromZero, message) {
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
	this.enterToContinue = function(customMessage) {
		//	Pause menu flow until user hits enter 
		if(!customMessage || typeof customMessage !== 'string') {
			rls.question('\nHit enter to continue...   ');
		} else {
			rls.question(customMessage);
		}
	},
	//	Main menu functions
	this.editGallery = function(name) {
		stdout.write('\nEditing existing gallery...');
		this.selectExistingFolder(name);
	},
	this.editHomepage = function() {
		stdout.write('\nEditing homepage...');
		newMenu();
	},
	this.exit = function() {
		stdout.write('\nBye!\n\n')
		process.exit(0);
	},

	this.createNewGallery = function() {
		stdout.write('\nCreating new gallery...');
		let newGallery = {}
		while(!newGallery.name) {
			newGallery.name = this.getNewFolderName(newGallery);
		}
		if(newGallery.name === '0') {
			newMenu();
		} else {
			newGallery.name = newGallery.name.toLowerCase();
			newGallery.path = path.join(lkb.path.full, newGallery.name);
			this.createNewFolder(newGallery);

			let filesAdded;
			while(!filesAdded) {
				filesAdded = this.readJpgsInFolder(newGallery, true);
			}
			if(filesAdded === '0') {
				this.deleteGallery(newGallery);
				newMenu();
			} else {
				this.processJpgs(newGallery);
				while(!newGallery.displayName) {
					newGallery.displayName = this.setDisplayName(newGallery);
				}
				if(newGallery.displayName === '0') {
					this.deleteGallery(newGallery);
					newMenu();
				} else {
					this.createNewXml(newGallery);
					let choice = this.getChoice(2, true, `\nEnter '1' to view and edit layout of the '${newGallery.name}' gallery, or '0' to return to the main menu: `);
					if(choice === 1) {
						this.editGallery(newGallery.name);
					} else if(choice === 0) {
						newMenu();
					}
				}
			}
		}
	},


	this.readJpgsInFolder = function(gallery, copyPhotosAlert) {
		gallery.rawJpgs = [];
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
			let choice = this.getChoice(2, true, "Enter '1' to try again, or '0' to return to the main menu: ");
			if(choice === 0) {
				return '0';
			} else {
				return false;
			}
		} else {
			return true;
		}
	},


	this.deleteGallery = function(gallery) {
		stdout.write(`\nDeleting folder: ${gallery.path}`);
		del.sync([gallery.path]);
	}
	//	Gallery functions
	this.getNewFolderName = function(gallery) {
		this.loadGalleryFolders();
		// let validName = false;
		let name = rls.question(`\nEnter your new folder name, or '0' to return to the menu: `);
		if(name.length === 0) {
			stdout.write('\nYou must enter a new folder name!');
			return false;
		} else if(!lkb.folderNameRegex.test(name)) {
			stdout.write('\n\nFolder names can only contain alphanumeric characters and - or _ symbols, with no spaces.');
			return false;
		} else if(lkb.galleries.indexOf(name.toLowerCase()) > -1) {
			stdout.write('\nA folder with that name already exists!');
			return false;
		} else {
			return name;
		}
	},
	this.setDisplayName = function(gallery) {
		let displayName = rls.question(`\nEnter a new display name for the "${gallery.name}" gallery, or '0' to cancel and delete it: `);
		if(displayName.length === 0) {
			stdout.write('\nYou must give the gallery a display name!');
			return false;
		} else {
			return displayName;
		}
	},
	this.createNewFolder = function(newGallery) {
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

	this.processJpgs = function(gallery) {
		this.checkForImageMagick();
		gallery.jpgFiles = [];
		gallery.rawJpgs.forEach((jpgFile, index) => {
			let newFileName = gallery.name + '_' + index + '.jpg';
			let newFilePath = path.join(gallery.path, newFileName);
			stdout.write(`\nProcessing ${newFilePath}...`);
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
	this.createNewXml = function(gallery) {
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
	this.updateXml = function(gallery) {
		stdout.write("\nUpdating layout file...");
		let content = this.insertXMLHeader(gallery);
		gallery.path = path.join(lkb.path.full, gallery.name);
		gallery.photos.forEach((photo, index) => {
			content += `\t\t<photo position="${photo.position}" displayed="${photo.displayed}">${photo.filename}</photo>\n`;
		});
		content += '\t</gallery>\n' + '</document>\n';
		this.saveXmlFile(gallery, content);
	},
	this.saveXmlFile = function(gallery, xmlString) {
		try {
			fs.writeFileSync(path.join(gallery.path, gallery.name.toLowerCase() + '.xml'), xmlString);		
			stdout.write(`\nLayout file "${gallery.name.toLowerCase()}.xml" has been saved for the "${gallery.name}" gallery.`);
		} catch(err) {
			stdout.write('Error saving file!');
			stdout.write(err);
		}
	},
	this.insertXMLHeader = function(gallery) {
		return '<?xml version="1.0" encoding="UTF-8"?>\n' + '<document>\n' + `\t<gallery folder="${gallery.name}" displayname="${gallery.displayName}" columns="${gallery.cols}">\n`;
	},
	this.checkForImageMagick = function() {
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
			newMenu();
		} else {
			stdout.write("ImageMagick detected...");
		}
	},
	this.selectExistingFolder = function(name) {
		this.loadGalleryFolders();
		if(lkb.galleries.length === 0) {
			stdout.write(`\nThere are not currently any galleries!\n`);
			newMenu();
		} else {
			if(name) {
				if(lkb.galleries.indexOf(name) === -1) {
					stdout.write(`\nThe "${name}" gallery does not exist!`);
					newMenu();
				} else {
					this.showGallery(name);
				}
			} else {
				stdout.write(`\nCurrent galleries:\n`);
				lkb.galleries.forEach((gallery, index) => {
					stdout.write(`\n  ${index+1}: ${gallery}`);
				});
				let choice = this.getChoice(lkb.galleries.length+1, true, "\nEnter the number of the gallery to continue, or '0' to return to the menu: ");
				if(choice === 0) {
					newMenu();
				} else {
					name = lkb.galleries[choice-1];
					this.showGallery(name);
				}
			}
		}
	},
	this.loadGalleryFolders = function() {
		lkb.galleries = [];
		let galleries = fs.readdirSync(lkb.path.full).map(name => path.join(lkb.path.full, name)).filter(this.checkIfFolder);
		galleries.forEach(gallery => {
			lkb.galleries.push(path.basename(gallery).toLowerCase());
		});
	},
	this.showGallery = function(name) {
		lkb.server.displayGallery(name);
	},
	this.checkIfFolder = function(target) {
		return fs.lstatSync(target).isDirectory();
	},
	this.parseXmlFile = function(gallery, callback) {
		let filepath = path.join(lkb.path.full, gallery.name, gallery.name.toLowerCase() + '.xml');
		let filedata = fs.readFileSync(filepath, 'utf8');
		gallery.xml = filedata.replace(/(\r\n|\n|\r|\t)/gm,"");
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
			menu.parseXmlFile(gallery, () => {
				res.render('newgallery', {gallery: gallery});
			});
		});
		app.post('/g', (req, res) => {
			menu.updateXml(req.body);
			res.sendStatus(200);
		});
		app.get('/exit', (req, res) => {
			console.log("Exiting...");
			this.stop(() => {
				res.sendStatus(200);
				newMenu();
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
			process.on('SIGHUP', () => {
				stdout.write(`\nSIGHUP!!\n`);
			})
		});
	},
	stop: function(callback) {
		console.log("\nStopping server...");
		if(callback && typeof callback === 'function') {
			callback();
		}
	},
	displayGallery: function(name) {
		stdout.write(`\nShowing gallery: ${name}\n`);
		opn(`http://localhost:${PORT}/g?name=${name}`);
	}
}

function newMenu() {
	stdout.write("\n\n\n\n\n");
	menu = new Menu();
	menu.main();
}

//	Launch
function start() {
	lkb.server.start(() => {
		newMenu();
	});
}

start();


