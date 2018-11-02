var rls 						= require('readline-sync'),
		rl 							=	require('readline'),
		fs 							= require('fs'),
		util 						=	require('util'),
		cp 							=	require('child_process'),
		easyimage 			= require('easyimage'),
		express 				= require('express'),
		bodyParser 			= require('body-parser'),
		path						=	require('path');

var stdout = process.stdout;

var app = express();
const PORT = 6100;
app.use(bodyParser.urlencoded({extended: true}));

var publicFolder = 'public';
var galleryFolder = 'galleries';
app.use(express.static(publicFolder));

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
	let choice = rls.question('What do you want to do?   >   ');
	switch(choice) {
		case '1':
			addNewGallery();
			break;
		case '2':
			editGallery();
			break;
		case '3':
			editHomepage();
			break;
		case '0':
			exitApp();
			break;
		default:
			stdout.write("\n\nOption not recognised - please try again.\n\n");
			mainMenu();
			break;
	}
}

function addNewGallery() {
	stdout.write("\nFirst you must give your new gallery a unique folder name.\n");
	stdout.write("Folder names must not include spaces, but should be descriptive - for example 'AnnaVonHauswolff'.\n");
	//	Get new folder name
	// let galleryObj = {};
	var folderName = getFolderName();
	var displayName = getDisplayName(folderName);
	var folderPath = path.join(__dirname, publicFolder, galleryFolder, folderName);
	createFolder(folderName, folderPath, displayName, function() {
		readJpgsInFolder(folderName, folderPath, function() {
			stdout.write('ASDASASDASDASDASD');
		});
	});
}

function enterToContinue() {
	rls.question('\nHit enter to continue...   ');
}

function getFolderName() {
	var folderName = '';
	folderName = rls.question('\nEnter your new folder name:   >   ');
	if(folderName.length === 0) {
		stdout.write('\nYou must provide a folder name!\n');
		getFolderName();
	} else if(!folderNameRegex.test(folderName)) {
		stdout.write('\nFolder names can only contain alphanumeric characters and - or _ symbols, with no spaces.\n');
		getFolderName();
	} else {
		return folderName;
	}
}

function getDisplayName(folderName) {
	let displayName = rls.question(`\nEnter a full display name for the "${folderName}" gallery:   >   `);
	if(displayName.length === 0) {
		stdout.write('\nYou must give the gallery a display name!\n');
		getDisplayName(folderName);
	} else {
		return displayName;
	}
}

function createFolder(folderName, folderPath, displayName, callback) {
	stdout.write(`\nCreating folder: "${folderPath}"\n`);
	if(fs.existsSync(folderPath)) {
		stdout.write("\nThat folder already exists!\n");
		stdout.write(`Do you want to edit the existing "${folderName}" gallery, or create a new gallery with a different name?\n`);
		stdout.write('Enter "1" to edit the existing gallery, or 2 to choose a different name:   >   ');
		let choice = getChoice(2);
		switch(choice) {
			case '1':
				editGallery(folderName);
				break;
			case '2':
				addNewGallery();
				break;
			default:
				stdout.write('Error!');
				process.exit(0);
		}
	} else {
		stdout.write(folderPath);
		fs.mkdir(folderPath, (err) => {
			if(err) {
				stdout.write("\nThat folder name is not valid!\n");
				addNewGallery();
			} else {
				stdout.write('\n...creating "thumbs" subfolder...\n');
				fs.mkdir(path.join(folderPath, 'thumbs'), (err) => {
					stdout.write('\n..."thumbs" subfolder created...');
					if(err) {
						stdout.write(err);
						throw(err);				
					} else {
						stdout.write(`\n"${folderName}" folder successfully created at "${folderPath}".\n`);
						stdout.write("Before continuing, please copy the photos to be displayed in this new gallery into this new folder.\n");
						stdout.write("Photos must be in '.jpg' format.\n");
						enterToContinue();
						callback();
					}
				});
			}
		});
	}
}

function readJpgsInFolder(folderName, folderPath) {
	fs.readdir(folderPath, (err, files) => {
		if(err) {
			stdout.write(err);
			throw(err);
		} else {
			var jpgFiles = [];
			files.forEach((file) => {
				if(file.slice(-4).toLowerCase() === '.jpg') {
					jpgFiles.push(file);
				}
			});
			if(jpgFiles.length === 0) {
				stdout.write(`\nNo jpg images were detected in the "${publicFolder}/${galleryFolder}/${folderName}" folder.\n`);
				stdout.write(`\nPress '1' to try again, or '2' to return to the main menu:   >   `);
				choice = getChoice(2);
				switch(choice) {
					case '1':
						readJpgsInFolder(folderName, folderPath);
						break;
					case '2':
						mainMenu();
						break;
					default:
						stdout.write('Error!');
						process.exit(0);
				}
			} else {
				processJpgs(folderName, folderPath, jpgFiles);
			}
		}
	});
}

function getChoice(numberOfOptions) {
	let choice = rls.question('');
	if(choice > 0 && choice <= numberOfOptions) {
		return choice;
	} else {
		stdout.write("\nChoice not recognised - please try again:   >   ");
		getChoice(numberOfOptions);
	}
}

function processJpgs(folderName, folderPath, jpgFiles) {
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
		var newFiles = [];
		jpgFiles.forEach((jpgFile, index) => {
			let newFileName = folderName + '_' + index + '.jpg';
			let newFilePath = path.join(folderPath, newFileName);
			fs.renameSync(path.join(folderPath, jpgFile), newFilePath);
			if(process.platform === 'win32') {
				cp.execSync('magick mogrify -geometry 1250x1250 ' + newFilePath);
			} else if(process.platform === 'linux') {
				cp.execSync('mogrify -geometry 1250x1250 ' + newFilePath);
			}
			fs.copyFileSync(newFilePath, path.join(folderPath, 'thumbs', newFileName));
			if(process.platform === 'win32') {
				cp.execSync('magick mogrify -geometry 400x ' + path.join(folderPath, 'thumbs', newFileName));
			} else if(process.platform === 'linux') {
				cp.execSync('mogrify -geometry 400x ' + path.join(folderPath, 'thumbs', newFileName));
			}
			newFiles.push(newFileName);
		});
		stdout.write(`\nImages in "${folderName}" have been formatted and thumbnails have been created.\n`);
		initializeXml(folderName, folderPath, newFiles);
	}
}

function initializeXml(folderName, folderPath, jpgFiles, fullName) {
	let xmlFile = folderName + '.xml';
	var content = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<document>\n' +
		`\t<gallery folder="${folderName}" fullname="${fullName}">\n`;
	jpgFiles.forEach((fileName, index) => {
		content += `\t\t<photo position="${index}">${fileName}</photo>\n`;
	});
	content += '\t</gallery>\n' + '</document>\n';

	fs.writeFile(path.join(folderPath, xmlFile), content, (err) => {
		if(err) {
			stdout.write(err);
			throw(err);
		} else {
			stdout.write(`\nAn XML file has been initialized for the "${folderName}" gallery.\n`);
			stdout.write(`Press '1' to view and edit layout of the "${folderName}" gallery, or '2' to return to the main menu.\n`);
			let choice = rls.question('What do you want to do?   >   ');
			stdout.write(choice);
			switch(choice) {
				case '1':
					editGallery(folderName);
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
		stdout.write(`\nEnter the number of the gallery to edit:   >   `);
		let choice = getChoice(galleryNames.length);
		galleryName = galleryNames[choice - 1];
		stdout.write(`\nEditing "${galleryName}" gallery...`);
	}
	mainMenu();
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

function editHomepage() {
	stdout.write('\nEditing homepage gallery!\n');
	mainMenu();
}

function exitApp() {
	stdout.write('\nBye!\n\n')
	process.exit(0);
}



function startServer() {

}



mainMenu();
