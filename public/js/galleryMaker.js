var gallery;

function loadGalleryMaker() {
	console.log("Gallery maker loaded...");

	//	Configure thumb list as packery
	setUpPackery();

	$('.colBtn').on('change', function() {
		if($('#colBtn3').prop('checked')) {
			setColumns(3);
		} else if($('#colBtn4').prop('checked')) {
			setColumns(4);
		};
		console.log(gallery);
		setUpPackery();
	});

}

//	Packery functions
function setUpPackery() {
	gallery = $('#thumbs').packery({
		itemSelector: '.thumb',
		columnWidth: '.thumbSizer',
		percentPosition: true,
		gutter: '.thumbGutter'
	});
	gallery.on()
	//	Reassign packery positions to thumbnails whenever layout is dragged
	gallery.on('layoutComplete', orderItems);
	gallery.on('dragItemPositioned', orderItems);
	setUpThumbs();
	$('#thumbs .thumb').on('start', () => {
		console.log("£ASDSDFASDFA");
	});
	$('#thumbs .thumb').trigger('start');
	$('#thumbs .thumb').trigger('drag');
	$('#thumbs .thumb').trigger('stop');
	orderItems();
}
//	Set thumbs in thumb list as draggable using jQuery UI draggable
function setUpThumbs() {
	var $galleryThumbs = $('#thumbs .thumb').draggable();
	gallery.packery('bindUIDraggableEvents', $galleryThumbs);
	$('#thumbs .thumb').each((index, element) => {
		//	?
	});
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
	orderItems();
}
//	Assign packery position to each thumbnail
function orderItems() {
	console.log("Ordering thumbnails...");
	var thumbs = gallery.packery('getItemElements');
	$(thumbs).each(function(index, thumb) {
		$(thumb).attr('data-position', index);
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
