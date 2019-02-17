//	ADD GOOGLE ANALYTICS ******VIRTUAL PAGEVIEWS******

const lkb = {
	//	Track current client view state
	state: {
		view: 'gallery',
		gal: undefined,
		img: undefined,
	},
	//	Map property is populated with site map object from server
	map: {
		galleries: {},
		nav: {},
	},


	setState(newState) {
		console.log("...setting state...");
		console.log(newState);
		if(newState.gal && !this.map.galleries[newState.gal].loaded) {
			this.preloadImages(newState.gal);
		}
		if(this.state !== newState) {
			this.state = newState;
			switch(this.state.view) {
				case 'home':
					console.log("...setting state to 'home'...");
					this.addThumbs();
					break;
				case 'thumbs':
					console.log("...setting state to 'thumbs'...");
					this.addThumbs();
					break;
				case 'image':
					console.log("...setting state to 'image'...");
					break;
				case 'category':
					console.log("...setting state to 'category'...");
					break;
				case 'contact':
					console.log("...setting state to 'contact'...");
					break;
				case 'about':
					console.log("...setting state to 'about'...");
					break;
				default:
					console.log("Invalid state!");
					break;
			}
		}
	},

	setUpPackery() {
		$thumbsPackery = $('#thumbs').packery({
			itemSelector: '.thumb',
			columnWidth: '.thumbSizer',
			percentPosition: true,
			gutter: '.thumbGutter'
		});
	},

	addThumbs() {
		console.log("...adding thumbs...");
		let gal = this.map.galleries[this.state.gal];
		console.log(gal);
		$('.thumbSizer').addClass('col' + gal.$.columns);
		gal.photo.forEach((photo, index) => {
			if(photo.$.displayed === 'true') {
				let thumb = 
					'<li class="thumb hidden col' + parseInt(gal.$.columns) + 
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
		$('#thumbs').imagesLoaded(() => {
			console.log("...images loaded...");
			this.setUpPackery();
			this.showThumbs();
		});
		// showImgNav();
	},

	showThumbs() {
		console.log("...showing thumbs...");
		$('.thumb').css({
			'animation-play-state': 'running'
		});
		// showImgNav();
		$('.notShown').hide();
		$('.notShown').removeClass('notShown');
	},

	preloadImages(galleryName) {
		console.log(`...preloading images for ${galleryName}...`);
		let photos = this.map.galleries[galleryName].photo;
		photos.forEach(photo => {
			$('<img/>')[0].src = photo.path;
			$('<img/>')[0].src = photo.thumbPath;
		});
		this.map.galleries[galleryName].loaded = true;
	},
}

//	Perfect-scrollbar
var ps;

//	Main function
$(() => {

	lkb.setState({
		view: 'home',
		gal: 'home',
	});

	//	Perfect-scrollbar
	const thumbDiv = document.getElementsByClassName('thumbDiv')[0];
	ps = new PerfectScrollbar(thumbDiv);

	//	Listeners
	$('.toggleGrid').click(() => {
		lkb.state.view = 'photo';
		lkb.state.img.current = 0;
		// updateState(true);
	});
	$('.toggleFull').click(() => {
		lkb.state.view = 'grid';
		// updateState(true);
	});
	$('.prevBtn, .fullNav.left').click(() => {
		// showPrevImg();
	});
	$('.nextBtn, .fullNav.right').click(() => {
		// showNextImg();
	});

	// showThumbnails();
});


