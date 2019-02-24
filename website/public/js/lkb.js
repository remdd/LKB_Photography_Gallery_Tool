//	ADD GOOGLE ANALYTICS ******VIRTUAL PAGEVIEWS******

//	Main object
const lkb = {
	//	Record current client view state
	state: {
		view: 'gallery',
		gal: undefined,
		img: undefined,
		$packery: undefined,
	},
	//	Map property is populated with site map object from server
	map: {
		galleries: {},
		nav: {},
	},

	setState(newState) {
		console.log("...setting new state:");
		if(newState.view === 'home') {
			newState.view = 'thumbs';
			newState.gal = 'home';
		}
		console.log(newState);
		if(newState.gal && !this.map.galleries[newState.gal].loaded) {
			this.preloadImages(newState.gal);
		}
		if(this.state !== newState) {
			let fadeNavWidget = this.state.view === 'image' && newState.view === 'image' ? false : true;
			console.log(fadeNavWidget);
			this.state = newState;
			console.log(this.state);
			this.updateNavWidget(fadeNavWidget);
			this.updateMainDiv();
		}
	},

	addThumbs() {
		console.log("...removing thumbs...");
		$('#thumbs li').remove();
		console.log("...adding thumbs...");
		let gal = this.map.galleries[this.state.gal];
		$('#thumbs').attr('data-gal', this.state.gal);
		$('.thumbSizer').removeClass((index, className) => {
			return (className.match(/(^|\s)col\S+/g) || []).join(' ');
		});
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
			this.showThumbs();
		});
	},

	setUpPackery() {
		console.log("...setting up packery...");
		if($('#thumbs').packery()) {
			console.log("...destroying packery...");
			$('#thumbs').packery('destroy');
		}
		$('#thumbs').packery({
			itemSelector: '.thumb',
			columnWidth: '.thumbSizer',
			percentPosition: true,
			gutter: '.thumbGutter'
		});
	},

	showThumbs() {
		console.log("...showing thumbs...");

		$('#mainDiv').fadeIn('fast');
		$('#thumbs').show();
		this.setUpPackery();

		$('.thumb').css({
			'animation-play-state': 'running'
		});
		// this.refreshScrollbar()
	},

	updateMainDiv() {
		console.log("...updating main div...");
		$('#mainDiv').fadeOut('fast', () => {
			$('.mainDivContent').hide();
			if(this.state.view === 'thumbs' || this.state.view === 'home') {
				this.addThumbs();
			} else if(this.state.view === 'image') {
				this.showImg();
			}
		});
	},

	showImg() {
		console.log("...showing image...");

		let photo = this.map.galleries[this.state.gal].photo[this.state.img];
		console.log(photo);
		$('#fullImg').show();
		$('#fullImg img').attr('src', photo.path);
		$('#fullImg').imagesLoaded(() => {
			$('#mainDiv').fadeIn('fast');
			// this.refreshScrollbar();
		});
	},

	nextImg() {
		console.log("...moving to next image:");
		let nextImg = this.state.img + 1 >= this.map.galleries[this.state.gal].photo.length ? 0 : this.state.img + 1;
		this.setState(this.createState(null, null, nextImg));
	},

	prevImg() {
		console.log("...moving to prev image:");
		let prevImg = this.state.img - 1 < 0 ? this.map.galleries[this.state.gal].photo.length - 1 : this.state.img - 1;
		this.setState(this.createState(null, null, prevImg));
	},

	createState(view, gal, img) {
		// console.log("...creating state...");
		return {
			'view': view ? view : this.state.view,
			'gal': gal ? gal : this.state.gal,
			'img': img ? img : 0,
		}
	},

	updateNavWidget(fadeNavWidget) {
		if(fadeNavWidget) {
			$('.navWidget').fadeOut('fast', () => {
				$('.navWidget').removeClass('notShown');
				$('.no-total').text(this.map.galleries[this.state.gal].photo.length);
				$('.no-current').text(this.state.img + 1);
				if(this.state.view === 'home' || this.state.view === 'thumbs') {
					$('.fullNav').hide();
					$('.gridNav').show();
				} else if(this.state.view === 'image') {
					$('.fullNav').show();
					$('.gridNav').hide();
				} else {
					//	Contact, About etc
					$('.fullNav').hide();
					$('.gridNav').hide();
				}
				$('.navWidget').fadeIn('fast');
			});
		} else {
			$('.no-current').text(this.state.img + 1);
		}
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
		$('#mainDiv').get(0).scrollTop = 0;
	},

	setUpMenuLinks() {
		console.log("...setting up menu links...");
		$('.menuLink').each(function() {
			$(this).click(function() {
				lkb.setState(lkb.createState('thumbs', $(this).attr('data-link'), null));
			});
		});
	},
}












//	Main function
$(() => {

	lkb.setState(lkb.createState('home', 'home', null, 'zoom'));
	lkb.setUpMenuLinks();

	//	Listeners
	$('.toggleGrid').click(() => {
		lkb.setState(lkb.createState('image'), null, 0);
	});
	$('.toggleFull').click(() => {
		lkb.setState(lkb.createState('thumbs'));
	});
	$('.prevBtn, .fullNav.left').click(() => {
		lkb.prevImg();
	});
	$('.nextBtn, .fullNav.right').click(() => {
		lkb.nextImg();
	});
});


