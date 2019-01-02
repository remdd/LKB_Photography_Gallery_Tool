var lkb = {
	currentGallery: '',
	displayMode: 'grid',
	img: {
		current: 0,
		total: 0
	}
}

$(() => {
	console.log("Connected!");
	console.log(galleryXml);
	loadGallery(galleryXml);

	//	Perfect-scrollbar
	const thumbDiv = document.getElementsByClassName('thumbDiv')[0];
	const ps = new PerfectScrollbar(thumbDiv);

	//	Listeners
	$('.toggleGrid').click(() => {
		showImgNav('full');
	});
	$('.toggleFull').click(() => {
		showImgNav('grid');
	});

});

function loadGallery(galleryXml) {
	preloadImages();
	addImages();
	$('#thumbs').imagesLoaded(() => {
		$('.thumb').css({
			'animation-play-state': 'running'
		});
		showImgNav();
		setUpPackery();
		$('i .hidden').hide();
		$('i .hidden').removeClass('hidden');
	});
}


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
			$('.thumb').last().css({
				'animation-delay': animDelay,
				'animation-play-state': 'paused'
			});
		}
	});
	$('.thumb').last().one('animationend', () => {
		showFooter();
	});
}

function hideImgNav() {
	$('.imgNav').fadeOut('fast');
}

function showImgNav(displayMode) {
	if(displayMode) {
		lkb.displayMode = displayMode;
	}
	if(lkb.displayMode === 'grid') {
		$('.toggleFull').fadeOut('fast', () => {
			$('.toggleGrid').fadeIn('slow');
		});
	} else if(lkb.displayMode === 'full') {
		$('.toggleGrid').fadeOut('fast', () => {
			$('.toggleFull').fadeIn('slow');
		});
	}
	$('.no-current').text(lkb.img.current);
	$('.no-total').text(lkb.img.total);
	$('.imgNav').fadeIn('slow');
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
  if (parseInt(a.$.position) < parseInt(b.$.position))
    return -1;
  if (parseInt(a.$.position) > parseInt(b.$.position))
    return 1;
  return 0;
}
