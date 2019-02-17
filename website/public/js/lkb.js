//	ADD GOOGLE ANALYTICS ******VIRTUAL PAGEVIEWS******

var config = {
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
		config.view = 'photo';
		config.img.current = 0;
		updateState(true);
	});
	$('.toggleFull').click(() => {
		config.view = 'grid';
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
	if(config.view === 'grid') {
		$('#mainDiv').fadeOut('fast', () => {
			$('.mainPane').hide();
			$('#thumbs').show();
			$('#mainDiv').show();
			showThumbnails();
			showImgNav();
		});
	} else if(config.view === 'photo') {
		$('#mainDiv').fadeOut('fast', () => {
			config.img.currentName = config.photos[config.img.current].name;
			$('.mainPane').hide();
			$('#fullImg').show();
			$('#fullImg img').attr('src', config.photos[config.img.current].path);
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
	} else if(config.view === 'covers') {
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
	let num = config.img.current - 1 < 0 ? config.img.total -1 : config.img.current - 1;
	viewPhoto(num);
}

function showNextImg() {
	let num = config.img.current + 1 >= config.img.total ? 0 : config.img.current + 1;
	viewPhoto(num);
}

function loadGallery(galleryXml, callback) {
	config.xml = galleryXml.document.gallery[0];
	//	Filter xml to remove non-displayed photos
	config.photos = config.xml.photo.filter(photo => {
		if(photo.$.displayed === 'true') {
			return true;
		} else {
			return false;
		}
	});
	console.log(config.photos);
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
	config.img.total = 0;
	config.photos.sort(compare);
	config.photos.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			config.img.total++;
			$('<img/>')[0].src = photo.path;
			$('<img/>')[0].src = photo.thumbPath;
		}
	});
}

function addImages() {
	console.log("Adding images...");
	$('.thumbSizer').addClass('col' + config.xml.$.columns);
	console.log(config.xml);
	config.photos.forEach((photo, index) => {
		if(photo.$.displayed === 'true') {
			let thumb = 
				'<li class="thumb hidden col' + parseInt(config.xml.$.columns) + 
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
		config.img.current = config.photos.findIndex(photo => photo.name === name);
	} else {
		config.img.current = num;
	}
	config.img.currentName = config.photos[config.img.current].name;
	if(config.view === 'photo') {
		updateState(false);
	} else {
		config.view = 'photo';
		updateState(true);
	}
}

function showImgNav() {
	if(config.view === 'grid') {
		$('.fullNav').hide();
		$('.gridNav').show();
	} else if(config.view === 'photo') {
		$('.gridNav').hide();
		$('.fullNav').show();
	}
	$('.no-current').text(config.img.current + 1);
	$('.no-total').text(config.img.total);
	$('.imgNav').fadeIn('fast');
}

function updateNav() {
	$('.no-current').text(config.img.current + 1);
	$('.no-total').text(config.img.total);
}

function saveState() {
	let stateString = '';
	if(config.view === 'grid') {
		stateString += 'g?gallery=' + config.xml.$.folder;
	} else if(config.view === 'category') {
		stateString += 'c?category=' + 'placeholder';
	}
	if(config.view === 'photo') {
		stateString += 'g?gallery=' + config.xml.$.folder + '&photo=' + config.img.currentName;
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
