//	Global variables;
function loadGalleryMaker(gallery) {
	console.log("Loading gallery maker...");
	console.log(gallery);
	//	Configure thumb list as packery
	setUpPackery();
}

//	Packery functions
function setUpPackery() {
	//	Declare Packery container & contents
	thumbsPackery = $('#thumbs').packery({
		itemSelector: '.thumb',
		columnWidth: '.thumbSizer',
		percentPosition: true,
		gutter: '.thumbGutter'
	});
	//	Reassign packery positions to thumbnails whenever layout is dragged
	// gallery.on('layoutComplete', updateLayout);
	thumbsPackery.on('dragItemPositioned', updatePositionNumbers);
	setUpThumbs();

	//	3 / 4 column switch listener
	$('.colBtn').on('change', function() {
		console.log(".colBtn changed!");
		if($('#colBtn3').prop('checked')) {
			setColumns(3);
		} else if($('#colBtn4').prop('checked')) {
			setColumns(4);
		};
		console.log(thumbsPackery);
	});
}
//	Set thumbs in thumb list as draggable using jQuery UI draggable
function setUpThumbs() {
	var $galleryThumbs = $('#thumbs .thumb').draggable();
	thumbsPackery.packery('bindUIDraggableEvents', $galleryThumbs);
	$('#thumbs .thumb').each((index, element) => {
		//	?
	});
	updatePositionNumbers();
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

//	Assign packery position to each thumbnail

function updateLayout() {
	console.log("Updating layout...");
}

function updatePositionNumbers() {
	//	Get the x and y offset of each thumbnail
	let x_offsets = [];
	let y_offsets = [];
	$('#thumbs .thumb').each((index, thumb) => {
		x_offsets.push($(thumb).offset().left);
		y_offsets.push($(thumb).offset().top);
	});
	//	Reduce each array to unique values
	x_offsets = [...new Set(x_offsets)];
	y_offsets = [...new Set(y_offsets)];
	//	
	$('#thumbs .thumb').each((index, thumb) => {
		let col = x_offsets.indexOf($(thumb).offset().left);
		let row = y_offsets.indexOf($(thumb).offset().top);
		$(thumb).find('.positionLabel span').text(col + ', ' + row);
	});
}


//	Utility functions
function unescapeHTML(input) {
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function compare(a, b) {
	if(a.position < b.position) {
		return -1;
	}
	if(a.position > b.position) {
		return 1;
	}
	return 0;
}
