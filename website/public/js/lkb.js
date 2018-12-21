$(() => {
	console.log("Connected!");
	console.log(galleryXml);

	preloadImages();
	addImages();
	$('#thumbs').imagesLoaded(() => {
		setUpPackery();
	});
});

function preloadImages() {
	galleryXml.document.gallery.photo.forEach((photo, index) => {
		if(photo.displayed === 'true') {
			$('<img/>')[0].src = photo.path;
			$('<img/>')[0].src = photo.thumbPath;
			console.log(photo);
		}
	});
}

function addImages() {
	$('.thumbSizer').addClass('col' + galleryXml.document.gallery.columns);
	galleryXml.document.gallery.photo.forEach((photo, index) => {
		if(photo.displayed === 'true') {
			let thumb = 
				'<li class="thumb hidden col' + parseInt(galleryXml.document.gallery.columns) + '">' +
				'<img src="' + photo.thumbPath + '"/></li>'
			let animDelay = (index * 60) + 'ms';
			console.log(animDelay);
			$('#thumbs').append(thumb);
			$('.thumb').last().css('animation-delay', animDelay);
		}
	});
	$('.thumb').last().one('animationend', () => {
		showFooter();
	});
}

function setUpPackery() {
	$thumbsPackery = $('#thumbs').packery({
		itemSelector: '.thumb',
		columnWidth: '.thumbSizer',
		percentPosition: true,
		gutter: '.thumbGutter'
	});
}

function hideFooter() {
	$('#footer').fadeOut('fast');
}

function showFooter() {
	$('#footer').fadeIn('fast');
}

