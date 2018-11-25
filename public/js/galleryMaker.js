$(function() {

	//	Configure thumb list as packery
	var gallery;
	setUpPackery();

	function setUpPackery() {
		gallery = $('#thumbs').packery({
			itemSelector: '.thumb',
			columnWidth: '.thumbSizer',
			percentPosition: true,
			gutter: '.thumbGutter'
		});
	}


	//	Set thumbs in thumb list as draggable using jQuery UI draggable
	var $galleryThumbs = $('#thumbs .thumb').draggable();
	gallery.packery('bindUIDraggableEvents', $galleryThumbs);
	orderItems();

	//	'Save gallery' button handler
	$('#saveForm').on('submit', function(e) {
		console.log("Save form submitted...");
		e.preventDefault();

		if($('.thumb').length > 0) {
			//	Add thumbs to array and record packery position for each
			var thumbFiles = [];
			$('.thumb').each(function(index, thumb) {
				console.log(thumb);
				var thumb = {
					'filename': $(thumb).attr('data-filename'),
					'position': $(thumb).attr('data-position')
				}
				thumbFiles.push(thumb);
			});

			//	Attach thumb array to response object
			var formData = $(this).serializeArray();
			formData.push({'name': 'thumbFiles', 'value': JSON.stringify(thumbFiles)});
			console.log(formData);

			//	Post response object to server
			$.post('/savegallery', formData, function(data) {
				console.log(data);
				return false;
			});
		}
	});

	//	Load images to thumbs on directory selection
	$('#fileInput').on('change', function() {
		console.log("Loading images...");
		console.log($('#fileInput')[0].value);
		$('#loadImagesForm')[0].submit();
		setColumns(3);
	});

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

	$('.colBtn').on('change', function() {
		if($('#colBtn3').prop('checked')) {
			setColumns(3);
		} else if($('#colBtn4').prop('checked')) {
			setColumns(4);
		};
		console.log(gallery);
		setUpPackery();
	});


	//	Assign packery position to each thumbnail
	function orderItems() {
		var thumbs = gallery.packery('getItemElements');
		$(thumbs).each(function(index, thumb) {
			$(thumb).attr('data-position', index);
			$(thumb).find('.positionLabel').text(index);
		});
	}
	//	Reassign packery positions to thumbnails whenever layout is dragged
	gallery.on('layoutComplete', orderItems);
	gallery.on('dragItemPositioned', orderItems);

});

