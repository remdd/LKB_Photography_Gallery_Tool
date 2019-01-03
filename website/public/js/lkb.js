var lkb = {
	displayMode: 'grid',
	img: {
		current: 0,
		total: 0
	}
}

//	Perfect-scrollbar
var ps;

//	Main function
$(() => {
	console.log("Connected!");
	loadGallery(galleryXml);

	//	Perfect-scrollbar
	const thumbDiv = document.getElementsByClassName('thumbDiv')[0];
	ps = new PerfectScrollbar(thumbDiv);

	//	Listeners
	$('.toggleGrid').click(() => {
		lkb.displayMode = 'full';
		lkb.img.current = 0;
		showMainPane();
	});
	$('.toggleFull').click(() => {
		lkb.displayMode = 'grid';
		showMainPane();
	});
	$('.prevBtn').click(() => {
		showPrevImg();
	})
	$('.nextBtn').click(() => {
		showNextImg();
	})
});

function showMainPane() {
	hideImgNav();
	if(lkb.displayMode === 'grid') {
		$('#mainDiv').fadeOut('fast', () => {
			$('.mainPane').hide();
			$('#thumbs').show();
			$('#mainDiv').fadeIn('slow');
			showImgNav();
		});
	} else if(lkb.displayMode === 'full') {
		$('#mainDiv').fadeOut('fast', () => {
			refreshScrollbar();
			$('.mainPane').hide();
			$('#fullImg').show();
			$('#fullImg img').attr('src', lkb.photos[lkb.img.current].path);
			$('#fullImg').imagesLoaded(() => {
				$('#mainDiv').fadeIn('slow');
				showImgNav();
			});
		});
	}
}

function refreshScrollbar() {
	$('.thumbDiv').get(0).scrollTop = 0;
	ps.update();
}

function showPrevImg() {
	lkb.img.current = lkb.img.current - 1 < 0 ? lkb.img.total -1 : lkb.img.current - 1;
	showMainPane();
}

function showNextImg() {
	lkb.img.current = lkb.img.current + 1 >= lkb.img.total ? 0 : lkb.img.current + 1;
	showMainPane();
}

function loadGallery(galleryXml) {
	lkb.xml = galleryXml.document.gallery[0];
	//	Filter xml to remove non-displayed photos
	lkb.photos = lkb.xml.photo.filter(photo => {
		if(photo.$.displayed === 'true') {
			return true;
		} else {
			return false;
		}
	});
	console.log(lkb.photos);
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
	lkb.photos.sort(compare);
	lkb.photos.forEach((photo, index) => {
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
	lkb.photos.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			let thumb = 
				'<li class="thumb hidden col' + parseInt(lkb.xml.$.columns) + 
				'" data-imgNo="' + index + '">' +
				'<img src="' + photo.thumbPath + '"/></li>'
			let animDelay = (index * 60) + 'ms';
			$('#thumbs').append(thumb);
			$('.thumb').last().css({
				'animation-delay': animDelay,
				'animation-play-state': 'paused'
			});
		}
	});
	$('.thumb').click(e => {
		lkb.img.current = parseInt($(e.target).parent().attr('data-imgNo'));
		lkb.displayMode = 'full';
		showMainPane();
	});
	$('.thumb').last().one('animationend', () => {
		showImgNav();
	});
}

function hideImgNav() {
	$('.imgNav').fadeOut('fast');
}

function showImgNav() {
	if(lkb.displayMode === 'grid') {
		$('.fullNav').hide();
		$('.gridNav').show();
	} else if(lkb.displayMode === 'full') {
		$('.gridNav').hide();
		$('.fullNav').show();
	}
	$('.no-current').text(lkb.img.current + 1);
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
