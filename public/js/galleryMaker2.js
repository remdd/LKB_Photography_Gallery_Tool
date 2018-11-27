//	Global variables;
function loadGalleryMaker(gallery) {
	console.log("Loading gallery maker...");
	console.log(gallery);
	//	Configure thumb list as packery
	setUpPackery();
}

var $thumbsPackery, $unusedPackery;



//	Packery functions
function setUpPackery() {
	// if(typeof $thumbsPackery !== 'undefined') {
	// 	$thumbsPackery.packery('destroy');
	// }
	// if(typeof $unusedPackery !== 'undefined') {
	// 	$unusedPackery.packery('destroy');
	// }
	//	Declare Packery container & contents
	$thumbsPackery = $('#thumbs').packery({
		itemSelector: '.thumb',
		columnWidth: '.thumbSizer',
		percentPosition: true,
		gutter: '.thumbGutter'
	});
	//	Reassign packery positions to thumbnails whenever layout is dragged
	$thumbsPackery.on('dragItemPositioned', () => {
		console.log("Dragged!");
		setTimeout(refreshLayout, 1);
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
		// setTimeout(refreshLayout, 1);
	});

	setUpThumbs();
	// setInterval(refreshLayout, 1000);
}

function addToggleListeners() {
	$('.thumb').off('click');
	$('.thumb').on('click', function() {
		toggleThumb(this);
	});
}

function toggleThumb(thumb) {
	console.log(thumb);
	console.log("Toggling");
	if($(thumb).parent().hasClass('removed')) {
		$(thumb).parent().removeClass('removed');
		$thumbsPackery.append($(thumb).parent()).packery('appended', $(thumb).parent());
		setUpThumbs();
		setTimeout(updatePositions, 1);
	} else {
		$(thumb).parent().addClass('removed');
		var clone = $(thumb).parent().clone();
		$thumbsPackery.packery('remove', $(thumb).parent());
		clone.appendTo('#unusedThumbs');
		setUpThumbs();
		setTimeout(updatePositions, 1);
	}
}

//	Listeners

//	Set thumbs in thumb list as draggable using jQuery UI draggable
function setUpThumbs() {
	var $galleryThumbs = $('#thumbs .thumb').draggable();
	$thumbsPackery.packery('unbindUIDraggableEvents', $galleryThumbs);
	$thumbsPackery.packery('bindUIDraggableEvents', $galleryThumbs);
	var $unusedThumbs = $('#unusedThumbs .thumb').draggable();
	$unusedPackery.packery('unbindUIDraggableEvents', $unusedThumbs);
	$unusedPackery.packery('bindUIDraggableEvents', $unusedThumbs);
	updatePositions();
	addToggleListeners();
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
}

//	Call after any movement of thumbnails
function updatePositions() {
	console.log("Updating positions...");
	//	Iterate thumbnails again...
	var thumbnails = $('#thumbs .thumb');
	thumbnails.sort(compareRowThenCol);
	thumbnails.each((index, thumb) => {
		$(thumb).find('.positionLabel span').text(index);
	});
	$('.thumb.removed').each((index, thumb) => {
		$(thumb).find('.positionLabel span').text('-');
	});
}

function refreshLayout(unused) {
	console.log("Refreshing layout...");
	$thumbsPackery.packery();
	$unusedPackery.packery();
	updatePositions();
}


//	3 / 4 column switch listener
$('.colBtn').on('change', function() {
	console.log(".colBtn changed!");
	if($('#colBtn3').prop('checked')) {
		setColumns(3);
	} else if($('#colBtn4').prop('checked')) {
		setColumns(4);
	};
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
