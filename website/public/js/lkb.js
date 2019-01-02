var lkb = {
	displayMode: 'grid',
	img: {
		current: 0,
		total: 0
	}
}

$(() => {
	console.log("Connected!");
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
	lkb.xml = galleryXml.document.gallery[0];
	preloadImages();
	addImages();
	$('#thumbs').imagesLoaded(() => {
		$('.thumb').css({
			'animation-play-state': 'running'
		});
		showImgNav();
		setUpPackery();
		$('.notShown').hide();
		$('.notShown').removeClass('notShown');
	});
}


function preloadImages() {
	lkb.img.total = 0;
	lkb.xml.photo.sort(compare);
	lkb.xml.photo.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			lkb.img.total++;
			$('<img/>')[0].src = photo.path;
			$('<img/>')[0].src = photo.thumbPath;
		}
	});
}

function addImages() {
	$('.thumbSizer').addClass('col' + lkb.xml.$.columns);
	console.log(lkb.xml);
	lkb.xml.photo.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			let thumb = 
				'<li class="thumb hidden col' + parseInt(lkb.xml.$.columns) + '">' +
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
		showImgNav();
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
		$('.fullNav').fadeOut('fast', () => {
			$('.gridNav').fadeIn('slow');
		});
	} else if(lkb.displayMode === 'full') {
		$('.gridNav').fadeOut('fast', () => {
			$('.fullNav').fadeIn('slow');
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
