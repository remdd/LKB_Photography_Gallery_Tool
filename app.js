var rls 						= require('readline-sync'),
		fs 							= require('fs'),
		util 						=	require('util'),
		cp 							=	require('child_process'),
		easyimage 			= require('easyimage'),
		path						=	require('path');

var stdout = process.stdout;

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
	var choice = getChoice(4);
	switch(choice) {
		case 1:
			addNewGallery();
			break;
		case 2:
			editGallery();
			break;
		case 3:
			editHomepage();
			break;
		case 4:
			exitApp();
			break;
		default:
			throw 'Invalid choice!';
			break;
	}
}

function getChoice(numberOfOptions, message) {
	var input;
	if(message) {
		input = parseInt(rls.question('\n' + message));
	} else {
		input = parseInt(rls.question('\nEnter your choice: '));
	}
	while(!Number.isInteger(input) || input <= 0 || input > numberOfOptions) {
		input = parseInt(rls.question('\nChoice not recognised! Please try again: '));
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
	galleryObj.folderPath = path.join(__dirname, galleryObj.folderName);
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
		var choice = getChoice(2, "Enter '1' to edit the existing gallery, or '2' to choose a different name: ");
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
				choice = getChoice(2, "Press '1' to try again, or '2' to return to the main menu: ");
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
	var output = cp.execSync('magick -version');
	// stdout.write(output.toString('utf8'));
	if(output.toString('utf8').slice(0,7) != 'Version') {
		stdout.write("ImageMagick is not installed!");
		enterToContinue();
		mainMenu();
	} else {
		galleryObj.jpgFiles = [];
		galleryObj.rawJpgFiles.forEach((jpgFile, index) => {
			let newFileName = galleryObj.folderName + '_' + index + '.jpg';
			let newFilePath = path.join(galleryObj.folderPath, newFileName);
			fs.renameSync(path.join(galleryObj.folderPath, jpgFile), newFilePath);
			cp.execSync('magick mogrify -geometry 1250x1250 ' + newFilePath);
			fs.copyFileSync(newFilePath, path.join(galleryObj.folderPath, 'thumbs', newFileName));
			cp.execSync('magick mogrify -geometry 400x ' + path.join(galleryObj.folderPath, 'thumbs', newFileName));
			galleryObj.jpgFiles.push(newFileName);
		});
		delete galleryObj.rawJpgFiles;
		initializeXml(galleryObj);
	}
}

function initializeXml(galleryObj) {
	let xmlFile = galleryObj.folderName + '.xml';
	var content = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<document>\n' +
		`\t<gallery folderName="${galleryObj.folderName}" displayName="${galleryObj.displayName}">\n`;
	galleryObj.jpgFiles.forEach((fileName, index) => {
		content += `\t\t<photo position="${index}">${fileName}</photo>\n`;
	});
	content += '\t</gallery>\n' + '</document>\n';

	fs.writeFile(path.join(galleryObj.folderPath, xmlFile), content, (err) => {
		if(err) {
			throw err;
			break;
		} else {
			stdout.write(`\nThe "${galleryObj.displayName}" gallery has been created with ${galleryObj.jpgFiles.length} photos!\n`);
			enterToContinue();
			mainMenu();
		}
	})
}

function editGallery(folderName) {
	stdout.write('\nEditing existing gallery!\n');
	mainMenu();
}

function editHomepage() {
	stdout.write('\nEditing homepage gallery!\n');
	mainMenu();
}

function exitApp() {
	stdout.write('Bye!\n\n')
	process.exit(0);
}



mainMenu();
