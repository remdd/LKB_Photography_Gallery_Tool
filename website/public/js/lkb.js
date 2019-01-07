//	ADD GOOGLE ANALYTICS ******VIRTUAL PAGEVIEWS******



var lkb = {
	view: 'grid',
	img: {
		current: 0,
		total: 0,
		currentName: ''
	}
}

//	Perfect-scrollbar
var ps;

//	Main function
$(() => {

	if(categoryXml) {
		loadCategory(categoryXml);
	} else if(galleryXml) {
		loadGallery(galleryXml);
	}

	//	Perfect-scrollbar
	const thumbDiv = document.getElementsByClassName('thumbDiv')[0];
	ps = new PerfectScrollbar(thumbDiv);

	//	Listeners
	$('.toggleGrid').click(() => {
		lkb.view = 'photo';
		lkb.img.current = 0;
		updateState(true);
	});
	$('.toggleFull').click(() => {
		lkb.view = 'grid';
		updateState(true);
	});
	$('.prevBtn, .fullNav.left').click(() => {
		showPrevImg();
	});
	$('.nextBtn, .fullNav.right').click(() => {
		showNextImg();
	});

	//	First load
	if(typeof photo !== 'undefined') {
		viewPhoto(null, photo);
	} else {
		showThumbnails();
	}
});

function updateState(hideNav) {
	if(hideNav) {
		hideImgNav();
	}
	if(lkb.view === 'grid') {
		$('#mainDiv').fadeOut('fast', () => {
			$('.mainPane').hide();
			$('#thumbs').show();
			$('#mainDiv').show();
			showThumbnails();
			showImgNav();
		});
	} else if(lkb.view === 'photo') {
		$('#mainDiv').fadeOut('fast', () => {
			lkb.img.currentName = lkb.photos[lkb.img.current].name;
			$('.mainPane').hide();
			$('#fullImg').show();
			$('#fullImg img').attr('src', lkb.photos[lkb.img.current].path);
			$('#fullImg').imagesLoaded(() => {
				$('#mainDiv').fadeIn('fast');
				refreshScrollbar();
				if(hideNav) {
					showImgNav();
				} else {
					updateNav();
				}
			});
		});
	} else if(lkb.view === 'covers') {
		$('#mainDiv').fadeOut('fast', () => {
			refreshScrollbar();
			$('.mainPane').hide();
			$('#covers').show();
		});
	}
	saveState();
}

function refreshScrollbar() {
	$('.thumbDiv').get(0).scrollTop = 0;
	ps.update();
}

function showPrevImg() {
	let num = lkb.img.current - 1 < 0 ? lkb.img.total -1 : lkb.img.current - 1;
	viewPhoto(num);
}

function showNextImg() {
	let num = lkb.img.current + 1 >= lkb.img.total ? 0 : lkb.img.current + 1;
	viewPhoto(num);
}

function loadGallery(galleryXml, callback) {
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
		setUpPackery();
		if(callback && typeof callback === 'function') {
			callback();
		}
	});
}

function loadCategory(categoryXml, callback) {
	console.log(categoryXml);
}

function showThumbnails() {
	$('.thumb').css({
		'animation-play-state': 'running'
	});
	showImgNav();
	$('.notShown').hide();
	$('.notShown').removeClass('notShown');
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
	console.log("Adding images...");
	$('.thumbSizer').addClass('col' + lkb.xml.$.columns);
	console.log(lkb.xml);
	lkb.photos.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			let thumb = 
				'<li class="thumb hidden col' + parseInt(lkb.xml.$.columns) + 
				'" data-imgNo="' + index + 
				'" data-imgName="' + photo.name + '">' +
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
		let num = parseInt($(e.target).parent().attr('data-imgNo'));
		viewPhoto(num);
	});
	showImgNav();
}

function hideImgNav() {
	$('.imgNav').fadeOut('fast');
}

function viewPhoto(num, name) {
	if(name) {
		lkb.img.current = lkb.photos.findIndex(photo => photo.name === name);
	} else {
		lkb.img.current = num;
	}
	lkb.img.currentName = lkb.photos[lkb.img.current].name;
	if(lkb.view === 'photo') {
		updateState(false);
	} else {
		lkb.view = 'photo';
		updateState(true);
	}
}

function showImgNav() {
	if(lkb.view === 'grid') {
		$('.fullNav').hide();
		$('.gridNav').show();
	} else if(lkb.view === 'photo') {
		$('.gridNav').hide();
		$('.fullNav').show();
	}
	$('.no-current').text(lkb.img.current + 1);
	$('.no-total').text(lkb.img.total);
	$('.imgNav').fadeIn('fast');
}

function updateNav() {
	$('.no-current').text(lkb.img.current + 1);
	$('.no-total').text(lkb.img.total);
}

function saveState() {
	let stateString = '';
	if(lkb.view === 'grid') {
		stateString += 'g?gallery=' + lkb.xml.$.folder;
	} else if(lkb.view === 'category') {
		stateString += 'c?category=' + 'placeholder';
	}
	if(lkb.view === 'photo') {
		stateString += 'g?gallery=' + lkb.xml.$.folder + '&photo=' + lkb.img.currentName;
	}
	history.pushState({}, '', stateString);
}

window.onpopstate = function() {
	//	Refresh browser with current URL
	window.location.href = location.href;
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
