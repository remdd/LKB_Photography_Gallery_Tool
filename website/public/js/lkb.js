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
	galleryXml.document.gallery[0].photo.sort(compare);
	galleryXml.document.gallery[0].photo.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			$('<img/>')[0].src = photo.path;
			$('<img/>')[0].src = photo.thumbPath;
		}
	});
}

function addImages() {
	$('.thumbSizer').addClass('col' + galleryXml.document.gallery[0].$.columns);
	console.log(galleryXml.document.gallery[0]);
	galleryXml.document.gallery[0].photo.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			let thumb = 
				'<li class="thumb hidden col' + parseInt(galleryXml.document.gallery[0].$.columns) + '">' +
				'<img src="' + photo.thumbPath + '"/></li>'
			let animDelay = (index * 60) + 'ms';
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

function compare(a,b) {
	console.log(a.$.position);
  if (parseInt(a.$.position) < parseInt(b.$.position))
    return -1;
  if (parseInt(a.$.position) > parseInt(b.$.position))
    return 1;
  return 0;
}
