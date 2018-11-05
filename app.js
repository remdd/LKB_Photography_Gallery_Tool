var rls 						= require('readline-sync'),
		fs 							= require('fs'),
		util 						=	require('util'),
		cp 							=	require('child_process'),
		easyimage 			= require('easyimage'),
		express 				= require('express'),
		bodyParser 			= require('body-parser'),
		path						=	require('path');

var stdout = process.stdout;

var publicFolder = 'public';
var galleryFolder = 'galleries';

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(publicFolder));
app.set('view engine', 'ejs');

const PORT = 6105;

var folderNameRegex = RegExp(/^[a-zA-Z0-9-_]{0,20}$/);

function mainMenu() {
	stdout.write("\n\n----------------------------------------------\n");
	stdout.write("Welcome to the LKB Photography gallery editor!\n");
	stdout.write("----------------------------------------------\n");
	stdout.write("Enter '1' to create a new gallery.\n");
	stdout.write("Enter '2' to edit an existing gallery.\n");
	stdout.write("Enter '3' to edit the photos displayed on the homepage.\n");
	stdout.write("Enter '0' to exit.\n\n");
	//	Get user choice
	var choice = getChoice(4, true);
	switch(choice) {
		case 0:
			exitApp();
			break;
		case 1:
			addNewGallery();
			break;
		case 2:
			editGallery();
			break;
		case 3:
			editHomepage();
			break;
		default:
			throw 'Invalid choice!';
			break;
	}
}

function getChoice(numberOfOptions, startFromZero, message) {
	var input;
	if(message) {
		input = parseInt(rls.question('\n' + message));
	} else {
		input = parseInt(rls.question('\nEnter your choice: '));
	}
	if(startFromZero) {
		while(!Number.isInteger(input) || input < 0 || input >= numberOfOptions) {
			input = parseInt(rls.question('\nChoice not recognised! Please try again: '));
		}
	} else {
		while(!Number.isInteger(input) || input <= 0 || input > numberOfOptions) {
			input = parseInt(rls.question('\nChoice not recognised! Please try again: '));
		}
	}
	return input;
}

function addNewGallery() {
	stdout.write("\nPlease give your new gallery a unique folder name.\n");
	stdout.write("Folder names must not include spaces, but should be descriptive - for example 'AnnaVonHauswolff'.\n");
	//	Get new folder name
	var galleryObj = {};
	while(!galleryObj.folderName) {
		galleryObj.folderName = getFolderName();
	}
	stdout.write(JSON.stringify(galleryObj));
	galleryObj.folderPath = path.join(__dirname, publicFolder, galleryFolder, galleryObj.folderName);
	createFolder(galleryObj);
}

function enterToContinue() {
	rls.question('\nHit enter to continue...   ');
}

function getFolderName() {
	let folderName = rls.question('\nEnter your new folder name: ');
	if(folderName.length === 0) {
		stdout.write('\nYou must provide a folder name!\n');
		return false;
	} else if(!folderNameRegex.test(folderName)) {
		stdout.write('\nFolder names can only contain alphanumeric characters and - or _ symbols, with no spaces.\n');
		return false;
	} else {
		return folderName;
	}
}

function getDisplayName(folderName) {
	let displayName = rls.question(`\nEnter a full display name for the "${folderName}" gallery: `);
	if(displayName.length === 0) {
		stdout.write('\nYou must give the gallery a display name!\n');
		return false;
	} else {
		return displayName;
	}
}

function createFolder(galleryObj) {
	stdout.write(`\nCreating folder: "${galleryObj.folderPath}"\n`);
	if(fs.existsSync(galleryObj.folderPath)) {
		stdout.write("\nThat folder already exists!\n");
		stdout.write(`Do you want to edit the existing "${galleryObj.folderName}" gallery, or create a new gallery with a different name?\n`);
		var choice = getChoice(2, false, "Enter '1' to edit the existing gallery, or '2' to choose a different name: ");
		switch(choice) {
			case 1:
				editGallery(galleryObj.folderName);
				break;
			case 2:
				addNewGallery();
				break;
			default:
				throw 'Invalid choice!';
				break;
		}
	} else {
		stdout.write(galleryObj.folderPath);
		fs.mkdir(galleryObj.folderPath, (err) => {
			if(err) {
				stdout.write("\nThat folder name is not valid!\n");
				addNewGallery();
			} else {
				stdout.write('\n...creating "thumbs" subfolder...\n');
				fs.mkdir(path.join(galleryObj.folderPath, 'thumbs'), (err) => {
					stdout.write('\n..."thumbs" subfolder created...');
					if(err) {
						throw err;
					} else {
						stdout.write(`\n"${galleryObj.folderName}" folder successfully created at "${galleryObj.folderPath}".\n`);
						while(!galleryObj.displayName) {
							galleryObj.displayName = getDisplayName(galleryObj.folderName);
						}
						stdout.write("Before continuing, please copy the photos to be displayed in this new gallery into this new folder.\n");
						stdout.write("Photos must be in '.jpg' format.\n");
						enterToContinue();
						readJpgsInFolder(galleryObj);
					}
				});
			}
		});
	}
}

function readJpgsInFolder(galleryObj) {
	fs.readdir(galleryObj.folderPath, (err, files) => {
		if(err) {
			stdout.write(err);
			throw(err);
		} else {
			galleryObj.rawJpgFiles = [];
			files.forEach((file) => {
				if(file.slice(-4).toLowerCase() === '.jpg') {
					galleryObj.rawJpgFiles.push(file);
				}
			});
			if(galleryObj.rawJpgFiles.length === 0) {
				stdout.write(`\nNo jpg images were detected in the "${galleryObj.folderName}" folder.\n`);
				choice = getChoice(2, false, "Press '1' to try again, or '2' to return to the main menu: ");
				switch(choice) {
					case 1:
						readJpgsInFolder(galleryObj);
						break;
					case 2:
						mainMenu();
						break;
					default:
						throw 'Invalid choice!';
						break;
				}
			} else {
				processJpgs(galleryObj);
			}
		}
	});
}

function processJpgs(galleryObj) {
	console.log(process.platform);
	var output;
	if(process.platform === 'win32') {
		output = cp.execSync('magick -version');
	} else if(process.platform === 'linux') {
		output = cp.execSync('identify -version')
	}
	stdout.write(output.toString('utf8'));
	if(output.toString('utf8').slice(0,7) != 'Version') {
		stdout.write("ImageMagick is not installed!");
		mainMenu();
	} else {
		galleryObj.jpgFiles = [];
		galleryObj.rawJpgFiles.forEach((jpgFile, index) => {
			let newFileName = galleryObj.folderName + '_' + index + '.jpg';
			let newFilePath = path.join(galleryObj.folderPath, newFileName);
			fs.renameSync(path.join(galleryObj.folderPath, jpgFile), newFilePath);
			if(process.platform === 'win32') {
				cp.execSync('magick mogrify -geometry 1250x1250 ' + newFilePath);
			} else if(process.platform === 'linux') {
				cp.execSync('mogrify -geometry 1250x1250 ' + newFilePath);
			}
			fs.copyFileSync(newFilePath, path.join(galleryObj.folderPath, 'thumbs', newFileName));
			if(process.platform === 'win32') {
				cp.execSync('magick mogrify -geometry 400x ' + path.join(galleryObj.folderPath, 'thumbs', newFileName));
			} else if(process.platform === 'linux') {
				cp.execSync('mogrify -geometry 400x ' + path.join(galleryObj.folderPath, 'thumbs', newFileName));
			}
			galleryObj.jpgFiles.push(newFileName);
		});
		stdout.write(`\nImages in "${galleryObj.folderName}" have been formatted and thumbnails have been created.\n`);
		initializeXml(galleryObj);
	}
}

function initializeXml(galleryObj) {
	let xmlFile = galleryObj.folderName + '.xml';
	var content = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<document>\n' +
		`\t<gallery folder="${galleryObj.folderName}" fullname="${galleryObj.fullName}">\n`;
	galleryObj.jpgFiles.forEach((fileName, index) => {
		content += `\t\t<photo position="${index}">${fileName}</photo>\n`;
	});
	content += '\t</gallery>\n' + '</document>\n';

	fs.writeFile(path.join(galleryObj.folderPath, xmlFile), content, (err) => {
		if(err) {
			stdout.write(err);
			throw(err);
		} else {
			stdout.write(`\nAn XML file has been initialized for the "${galleryObj.folderName}" gallery.\n`);
			stdout.write(`Press '1' to view and edit layout of the "${galleryObj.folderName}" gallery, or '2' to return to the main menu.\n`);
			let choice = rls.question('What do you want to do?   >   ');
			stdout.write(choice);
			switch(choice) {
				case '1':
					editGallery(galleryObj.folderName);
					break;
				case '2':
					mainMenu();
					break;
				default:
					stdout.write('Error!');
					process.exit(0);
					break;
			}
		}
	});
}

function editGallery(galleryName) {
	while(!galleryName || galleryName.length === 0) {
		stdout.write(`\nThe following galleries were found in "${publicFolder}/${galleryFolder}":\n\n`);
		var galleryNames = listDirectories(path.join(__dirname, publicFolder, galleryFolder));
		galleryNames.forEach((gallery, index) => {
			stdout.write(`  ${index + 1}: ${gallery}\n`);
		});
		stdout.write(`\nEnter the number of the gallery to edit, or '0' to return to the main menu:   >   `);
		let choice = getChoice(galleryNames.length + 1, true);
		if(choice === 0) {
			mainMenu();
		} else {
			galleryName = galleryNames[choice - 1];
		}
	}
	stdout.write(`\nEditing "${galleryName}" gallery...`);
	// enterToContinue();
	// mainMenu();




}

function checkIfFolder(target) {
	return fs.lstatSync(target).isDirectory();
}

function listDirectories(parent) {
	//	Iterates contents of parent and adds full paths of child directories to 'folderPaths' array
	let folderPaths = fs.readdirSync(parent).map(name => path.join(parent, name)).filter(checkIfFolder);
	//	Iterates 'folderPaths' array and returns array containing folder names only
	return folderPaths.map(folderPath => path.basename(folderPath));
}

function showGallery(galleryName) {

}

function editHomepage() {
	stdout.write('\nEditing homepage gallery!\n');
	mainMenu();
}

function exitApp() {
	stdout.write('Bye!\n\n')
	process.exit(0);
}

app.get('/g', (req, res) => {
	let gallery = req.query.name;
	console.log(gallery);
	res.render('preview', {gallery: gallery});
});


app.listen(PORT, 'localhost', () => {
	stdout.write(`\nServer started on port ${PORT}...\n`);
});

console.log("DSFSDFSDFSDF");

mainMenu();
