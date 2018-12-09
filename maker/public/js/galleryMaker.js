//	Global variables
var $thumbsPackery, $unusedPackery;
var gallery;

//	Init function
function loadGalleryMaker(loadedGallery) {
	console.log("Loading gallery maker...");
	gallery = loadedGallery;
	//	Configure thumb list as packery
	setUpPackery();
}


//	Packery functions
function setUpPackery() {
	$thumbsPackery = $('#thumbs').packery({
		itemSelector: '.thumb',
		columnWidth: '.thumbSizer',
		percentPosition: true,
		gutter: '.thumbGutter'
	});
	//	Reassign packery positions to thumbnails whenever layout is dragged
	$thumbsPackery.on('dragItemPositioned', () => {
		console.log("Dragged!");
		updatePositions();
	});

	//	Declare unused thumb Packery container & contents
	$unusedPackery = $('#unusedThumbs').packery({
		itemSelector: '.thumb',
		columnWidth: '.thumbSizer',
		percentPosition: true,
		gutter: '.thumbGutter'
	});
	//	Reassign packery positions to thumbnails whenever layout is dragged
	$unusedPackery.on('dragItemPositioned', () => {
		console.log("Dragged!");
		updatePositions();
	});

	$('#toggleIconBtn').click(() => {
		$('.positionLabel').toggle();
		$('.toggleBtn').toggle();
		if($('.toggleBtn').is(':visible')) {
			$('#toggleIconBtn').text('Hide icons');
		} else {
			$('#toggleIconBtn').text('Show icons');
		}
	})

	//	3 / 4 column switch listener
	$('.colBtn').on('change', function() {
		console.log(".colBtn changed!");
		if($('#colBtn3').prop('checked')) {
			setColumns(3);
			gallery.cols = 3;
		} else if($('#colBtn4').prop('checked')) {
			setColumns(4);
			gallery.cols = 4;
		};
	});

	$('#saveGalleryBtn').click(e => {
		e.preventDefault();
		gallery.displayName = $('#displayName').val();
		gallery.photos = [];
		$('.thumb').each((index, thumb) => {
			let photo = {
				position: $(thumb).attr('data-position'),
				displayed: $(thumb).hasClass('removed') ? 'false' : 'true',
				filename: $(thumb).attr('data-filename')
			}
			gallery.photos.push(photo);
		});
		let url = '/g?name=' + gallery.name;
		let errorTimeout = setTimeout(() => {
			showPopup('saveError');
		}, 2000);
		$.post(url, gallery, (res) => {
			if(res === 'OK') {
				clearTimeout(errorTimeout);
				showPopup('saveSuccess');
			} else {
				showPopup('saveError');
			}
		});
	});

	$('#exitBtn').click(e => {
		exit();
	});

	$('#popupExitBtn').click(e => {
		exit();
	});

	$('#popupContinueBtn').click(e => {
		$('#popup').fadeOut();
	});


	$('#hideUnusedThumbs').click(e => {
		$('#unusedThumbs').toggle();
		if($('#unusedThumbs').is(':visible')) {
			$('#hideUnusedThumbs').text('Hide unused photos');
		} else {
			$('#hideUnusedThumbs').text('Show unused photos');
		}
		updatePositions();
	});

	setUpThumbs();
}

function showPopup(message) {
	if(message === 'saveSuccess') {
		$('#popupTitle').text('Gallery saved!');
		$('#popupText').text('Would you like to continue editing or exit and return to the menu?');
	} else if(message === 'saveError') {
		$('#popupTitle').text('Something went wrong...');
		$('#popupText').text("Please try to remember exactly what you did, don't touch anything and contact your tech support Flopsy to ask him (nicely) for some help!");
	}
	$('#popup').fadeIn();
}

function exit() {
	let url = '/exit';
	$.get(url, (res) => {
		if(res === 'OK') {
			window.close();
		} else {
			//		??? handle this somehow
		}
	});
}

//	Set thumbs in thumb list as draggable using jQuery UI draggable
function setUpThumbs() {
	var $galleryThumbs = $('#thumbs .thumb').draggable();
	$thumbsPackery.packery('unbindUIDraggableEvents', $galleryThumbs);
	$thumbsPackery.packery('bindUIDraggableEvents', $galleryThumbs);
	var $unusedThumbs = $('#unusedThumbs .thumb').draggable();
	$unusedPackery.packery('unbindUIDraggableEvents', $unusedThumbs);
	$unusedPackery.packery('bindUIDraggableEvents', $unusedThumbs);
	addToggleListeners();
	updatePositions();
}

//	Call after any movement of thumbnails to update references
function updatePositions() {
	console.log("Updating positions...");
	//	Iterate thumbnails again...
	var thumbnails = $('#thumbs .thumb');
	thumbnails.sort(compareRowThenCol);
	thumbnails.each((index, thumb) => {
		$(thumb).attr('data-position', index);
		$(thumb).find('.positionLabel span').text(index);
	});
	$('#unusedThumbs .thumb').each((index, thumb) => {
		$(thumb).attr('data-position', "-1");
		$(thumb).find('.positionLabel span').text('-');
	});
	setTimeout(refreshLayout, 1);
}


//	Refresh positions of packery elements
function refreshLayout() {
	console.log("Refreshing layout...");
	$thumbsPackery.packery();
	$unusedPackery.packery();
}


function addToggleListeners() {
	$('.toggleBtn').off('click');
	$('.toggleBtn').on('click', function() {
		toggleThumb($(this).parent());
	});
}


function toggleThumb($thumb) {
	console.log($thumb);
	console.log("Toggling");
	if($thumb.hasClass('removed')) {
		$thumb.removeClass('removed');
		$thumb2 = $thumb.clone();
		$unusedPackery.packery('remove', $thumb);
		$thumbsPackery.append($thumb2).packery('appended', $thumb2);
		setUpThumbs();
	} else {
		$thumb.addClass('removed');
		$thumb2 = $thumb.clone();
		$thumbsPackery.packery('remove', $thumb);
		$unusedPackery.append($thumb2).packery('appended', $thumb2);
		setUpThumbs();
	}
}


//	Change number of columns
function setColumns(cols) {
	console.log("Setting cols... " + cols);
	if(cols === 3) {
		$('.thumb, .thumbSizer').removeClass('col4');
		$('.thumb, .thumbSizer').addClass('col3');
	} else if(cols === 4) {
		$('.thumb, .thumbSizer').removeClass('col3');
		$('.thumb, .thumbSizer').addClass('col4');
	}
	updatePositions();
}


//	Send exit command to server if browser tab is closed improperly
window.addEventListener('beforeunload', e => {
	e.preventDefault();
	console.log("Closing!");
	exit();
});


//	Utility functions
function unescapeHTML(input) {
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function comparePosition(a, b) {
	if(a.position < b.position) {
		return -1;
	}
	if(a.position > b.position) {
		return 1;
	}
	return 0;
}

function compareRowThenCol(x, y) {
	let a = $(x), b = $(y);
	if(a.offset().top < b.offset().top) {
		return -1;
	}
	if(a.offset().top > b.offset().top) {
		return 1;
	}
	if(a.offset().left < b.offset().left) {
		return -1;
	}
	if(a.offset().left > b.offset().left) {
		return 1;
	}
}
