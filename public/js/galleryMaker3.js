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
	// //	Clear any previous Packery instances
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

	setUpThumbs();
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
		$(thumb).attr('data-position', 'none');
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
		$thumbsPackery.append($thumb).packery('appended', $thumb);
		setUpThumbs();
	} else {
		$thumb.addClass('removed');
		var clone = $thumb.clone();
		$thumbsPackery.packery('remove', $thumb);
		clone.appendTo('#unusedThumbs');
		setUpThumbs();
	}
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
