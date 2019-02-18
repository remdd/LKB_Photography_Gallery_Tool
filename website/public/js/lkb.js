//	ADD GOOGLE ANALYTICS ******VIRTUAL PAGEVIEWS******

//	Perfect-scrollbar
var ps;

//	Main object
const lkb = {
	//	Record current client view state
	state: {
		view: 'gallery',
		gal: undefined,
		img: undefined,
		imgNav: undefined,
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
					this.showImg(newState);
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
			};
		}
	},

	showGridImgNav() {
		console.log("...showing grid imgNav...");
		if(!$('.gridNav').is(':visible')) {
			$('.fullNav').fadeOut('fast', () => {
				this.updateImgNavNumbers();
				$('.fullNav').fadeIn('fast');
			});
		}
	},

	showZoomImgNav() {
		console.log("...showing zoom imgNav...");
		if(!$('.zoomNav').is(':visible')) {
			$('.fullNav').fadeOut('fast', () => {
				this.updateImgNavNumbers();
				$('.fullNav').fadeIn('fast');
			});
		}
	},

	updateImgNavNumbers() {
		console.log("...updating image nav numbers...");
		$('.no-current').text(this.state.img + 1);
		$('.no-total').text(this.map.galleries[this.state.gal].photo.length + 1);
	},

	setUpPackery() {
		console.log("...setting up packery...");
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
			this.setState(this.createState('image', null, num));
		});
		$('#thumbs').imagesLoaded(() => {
			console.log("...images loaded...");
			this.setUpPackery();
			this.showThumbs();
		});
	},

	showImg(newState) {
		console.log("...showing image...");
		$('#mainDiv').fadeOut('fast', () => {
			let photo = this.map.galleries[this.state.gal].photo[this.state.img];
			console.log(photo);
			$('.mainPane').hide();
			$('#fullImg').show();
			$('#fullImg img').attr('src', photo.path);
			$('#fullImg').imagesLoaded(() => {
				$('#mainDiv').fadeIn('fast');
				this.showZoomImgNav();
				this.refreshScrollbar();
			});
		});
	},

	createState(view, gal, img, imgNav) {
		console.log("...creating state...");
		return {
			'view': view ? view : this.state.view,
			'gal': gal ? gal : this.state.gal,
			'img': img ? img : this.state.img,
			'imgNav': imgNav ? imgNav : this.state.imgNav,
		}
	},

	showThumbs() {
		console.log("...showing thumbs...");
		$('.thumb').css({
			'animation-play-state': 'running'
		});
		$('.notShown').hide();
		$('.notShown').removeClass('notShown');
		this.showGridImgNav();
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

	refreshScrollbar() {
		console.log("...refreshing scrollbar...");
		$('.thumbDiv').get(0).scrollTop = 0;
		ps.update();
	},
}












//	Main function
$(() => {

	lkb.setState(lkb.createState('home', 'home', null, 'zoom'));

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


