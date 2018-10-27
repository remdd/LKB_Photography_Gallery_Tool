var readline 		= require('readline'),
		fs 					= require('fs'),
		path				=	require('path');

var stdout = process.stdout;

function mainMenu() {
	stdout.write("\n\n----------------------------------------------\n");
	stdout.write("Welcome to the LKB Photography gallery editor!\n");
	stdout.write("----------------------------------------------\n");
	stdout.write("Enter '1' to create a new gallery.\n");
	stdout.write("Enter '2' to edit an existing gallery.\n");
	stdout.write("Enter '3' to edit the photos displayed on the homepage.\n");
	stdout.write("Enter '0' to exit.\n\n");
	let rl = readline.createInterface(process.stdin, process.stdout);
	rl.setPrompt('What do you want to do?   >   ');
	rl.prompt();
	rl.on('line', (choice) => {
		rl.close();
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
				stdout.write("\nOption not recognised - please try again.\n\n");
				mainMenu();
				break;
		}
	});
}

function addNewGallery() {
	stdout.write("\nTo continue, first give your new gallery a unique folder name.\n");
	stdout.write("Folder names must not include spaces, but should be descriptive - for example 'AnnaVonHauswolff'.\n");
	let rl = readline.createInterface(process.stdin, process.stdout);
	rl.setPrompt('Enter your new folder name:   >   ');
	rl.prompt();
	rl.on('line', (folderName) => {
		if(folderName.length === 0) {
			rl.prompt();
		} else {
			rl.close();
			let folderPath = path.join(__dirname, folderName);
			if(fs.existsSync(folderPath)) {
				stdout.write("\nThat folder already exists!\n");
				stdout.write(`Do you want to edit the existing "${folderName}" gallery, or create a new gallery with a different name?\n`)
				let rl = readline.createInterface(process.stdin, process.stdout);
				rl.setPrompt(`\nEnter '1' to edit the existing "${folderName} gallery, or '2' to create a new gallery:   >   `);
				rl.prompt();
				rl.on('line', (choice) => {
					switch(choice.toLowerCase()) {
						case '1':
							rl.close();
							editGallery(folderName);
							break;
						case '2':
							rl.close();
							addNewGallery();
							break;
						default:
							stdout.write("\nChoice not recognised - please enter either '1' or '2'   >   ");
							rl.prompt();
							break;
					}
				});
			} else {
				createFolder(folderName, folderPath);
			}
		}
	});
}

function createFolder(folderName, folderPath) {
	fs.mkdir(folderPath, (err) => {
		if(err) {
			stdout.write("\nThat folder name is not valid!\n");
			addNewGallery();
		} else {
			stdout.write(`\n"${folderName}" folder successfully created at "${folderPath}".\n`);
			stdout.write("Before continuing, please copy the photos to be displayed in this new gallery to this new folder.\n");
			stdout.write("Photos must be in '.jpg' format.\n");
			let rl = readline.createInterface(process.stdin, process.stdout);
			rl.setPrompt('Press enter when you are ready to continue...\n');
			rl.prompt();
			rl.on('line', () => {
				rl.close();
				readJpgsInFolder(folderName, folderPath);
			});
		}
	});
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
				stdout.write(`\nNo jpg images were detected in the "${folderName}" folder.`);
				let rl = readline.createInterface(process.stdin, process.stdout);
				rl.setPrompt("Press '1' to try again, or '2' to return to the main menu.\n");
				rl.prompt();
				rl.on('line', (choice) => {
					switch(choice.toLowerCase()) {
						case '1':
							rl.close();
							readJpgsInFolder(folderName, folderPath);
							break;
						case '2':
							rl.close();
							mainMenu();
							break;
						default:
							stdout.write("\nChoice not recognised - please enter either '1' or '2'   >   ");
							rl.prompt();
							break;
					}
				});
			} else {
				initializeXml(folderName, folderPath, jpgFiles);
			}
		}
	});
}

function initializeXml(folderName, folderPath, jpgFiles) {
	let xmlFile = folderName + '.xml';
	fs.writeFile(path.join(folderPath, xmlFile), 'Some content!', (err) => {
		if(err) {
			stdout.write(err);
			throw(err);
		} else {
			stdout.write("The XML file has been saved!");
		}
	})
}



function editGallery(galleryName) {
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
