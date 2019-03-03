//	ADD GOOGLE ANALYTICS ******VIRTUAL PAGEVIEWS******

//	Main object
const lkb = {
	//	Record active view state
	state: {},
	//	Map property is populated with site map object from server on first load
	map: {
		galleries: {},
		nav: {},
	},
	config: {
		animDelay: 30,
	},

	setUpThumbPackery() {
		// console.log("...setting up thumb packery...");
		if($('#thumbs').packery()) {
			$('#thumbs').packery('destroy');
		}
		$('#thumbs').packery({
			itemSelector: '.thumb',
			columnWidth: '.thumbSizer',
			percentPosition: true,
			gutter: '.thumbGutter'
		});
	},

	setUpCatThumbPackery() {
		// console.log("...setting up cat thumb packery...");
		if($('#covers').packery()) {
			$('#covers').packery('destroy');
		}
		$('#covers').packery({
			itemSelector: '.catThumb',
			columnWidth: '.thumbSizer',
			percentPosition: true,
			gutter: '.thumbGutter'
		});
	},

	showThumbs() {
		// console.log("...showing thumbs...");
		$('#mainDiv').fadeIn('fast');
		$('#thumbs').show();
		this.setUpThumbPackery();

		$('.thumb').css({
			'animation-play-state': 'running'
		});
		// this.refreshScrollbar()
	},

	updateMainDiv() {
		// console.log("...updating main div...");
		$('#mainDiv').fadeOut('fast', () => {
			$('.mainDivContent').hide();
			if(this.state.view === 'thumbs' || this.state.view === 'home') {
				this.addThumbs();
			} else if(this.state.view === 'image') {
				this.showImg();
			} else if(this.state.view === 'category') {
				this.addCatThumbs();
			}
		});
	},

	showImg() {
		// console.log("...showing image...");
		let photo = this.map.galleries[this.state.gal].photo[this.state.img];
		$('#fullImg').show();
		$('#fullImg img').attr('src', '/' + photo.path);
		$('#fullImg').imagesLoaded(() => {
			$('#mainDiv').fadeIn('fast');
			// this.refreshScrollbar();
		});
	},

	nextImg() {
		// console.log("...moving to next image:");
		let nextImg = this.state.img + 1 >= this.map.galleries[this.state.gal].photo.length ? 0 : this.state.img + 1;
		this.setState({ view: 'image', img: nextImg });
	},

	prevImg() {
		// console.log("...moving to prev image:");
		let prevImg = this.state.img - 1 < 0 ? this.map.galleries[this.state.gal].photo.length - 1 : this.state.img - 1;
		this.setState({ view: 'image', img: prevImg });
	},

	updateNavWidget(fadeNavWidget) {
		if(this.state.view === 'image' || this.state.view === 'thumbs') {
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
				if(!$('.navWidget').is(':visible')) {
					$('.navWidget').fadeIn('fast');
				}
			}
		} else {
			$('.navWidget').fadeOut('fast');
		}
	},

	preloadImages(galleryName) {
		// console.log(`...preloading images for ${galleryName}...`);
		let photos = this.map.galleries[galleryName].photo;
		photos.forEach(photo => {
			$('<img/>')[0].src = photo.path;
			$('<img/>')[0].src = photo.thumbPath;
		});
		this.map.galleries[galleryName].loaded = true;
	},

	refreshScrollbar() {
		// console.log("...refreshing scrollbar...");
		$('#mainDiv').get(0).scrollTop = 0;
	},

	setUpMenuLinks() {
		// console.log("...setting up menu links...");
		$('nav.pane ul').empty();
		lkb.map.nav.link.map(link => {
			let $navLi = $('<li><span class="menuLink">' + link.$.linkText + '</span></li>');
			$navLi.find('span').attr('data-type', link.$.type);
			if(link.$.type === 'gallery') {
				$navLi.find('span').attr('data-gal', link.$.gal);
			} else if(link.$.type === 'category') {
				$navLi.find('span').attr('data-cat', link.$.cat);
			}
			$('nav.pane ul').append($navLi);
		});

		$('.menuLink').each(function() {
			$(this).click(function() {
				switch($(this).attr('data-type')) {
					case 'gallery':
						lkb.setState({
							view: 'thumbs',
							gal: $(this).attr('data-gal'),
						});
						break;
					case 'category':
						lkb.setState({
							view: 'category',
							cat: $(this).attr('data-cat'),
						});
						break;
					default:
						lkb.setState({
							view: $(this).attr('data-type'),
						});
						break;
				}
			});
		});
	},

	addThumbs() {
		// console.log("...removing thumbs...");
		$('#thumbs li').remove();
		// console.log("...adding thumbs...");
		let gal = this.map.galleries[this.state.gal];
		$('#thumbs').attr('data-gal', this.state.gal);
		$('#thumbs .thumbSizer').removeClass((index, className) => {
			return (className.match(/(^|\s)col\S+/g) || []).join(' ');
		});
		$('#thumbs .thumbSizer').addClass('col' + gal.$.columns);
		gal.photo.forEach((photo, index) => {
			if(photo.$.displayed === 'true') {
				let thumb = 
					'<li class="thumb hidden col' + parseInt(gal.$.columns) + 
					'" data-imgNo="' + index + 
					'" data-imgName="' + photo.name + '">' +
					'<img src="/' + photo.thumbPath + '"/></li>'
				let animDelay = (index * this.config.animDelay) + 'ms';
				$('#thumbs').append(thumb);
				$('.thumb').last().css({
					'animation-delay': animDelay,
					'animation-play-state': 'paused'
				});
			}
		});
		$('.thumb').click(e => {
			let num = parseInt($(e.target).parent().attr('data-imgNo'));
			this.setState({ view: 'image', img: num });
		});
		$('#thumbs').imagesLoaded(() => {
			// console.log("...images loaded...");
			this.showThumbs();
		});
	},

	addCatThumbs() {
		// console.log("...removing category thumbs...");
		$('#covers .catThumb').remove();
		// console.log("...adding category thumbs...");
		let cat = this.map.nav.link.find(link => link.$.cat === this.state.cat);
		$('#covers .thumbSizer, #covers .catThumb').removeClass((index, className) => {
			return (className.match(/(^|\s)col\S+/g) || []).join(' ');
		});
		$('#covers .thumbSizer').addClass('col' + cat.$.columns)
		cat.gallery.forEach((gallery, index) => {
			let $thumb = $(`<li class="catThumb col${cat.$.columns}" data-gal="${gallery.$.gal}"><div></div><span></span></li>`);
			let coverPath = `url('/galleries/${gallery.$.gal}/${gallery.$.cover}.jpg')`; 
			$thumb.find('div').css('background-image', coverPath);
			$thumb.find('span').text(`${gallery.$.description}`);
			let animDelay = (index * this.config.animDelay) + 'ms';
			$('#covers').append($thumb);
			$('.catThumb').last().css({
				'animation-delay': animDelay,
				'animation-play-state': 'paused'
			});
		});
		$('.catThumb').click(e => {
			this.setState({ view: 'thumbs', gal: $(e.target).attr('data-gal')});
			// console.log("Cat thumb!");
		});
		$('#thumbs').imagesLoaded(() => {
			// console.log("...images loaded..."); 
			this.showCatThumbs();
		});
	},

	showCatThumbs() {
		// console.log("...showing category thumbs...");
		$('#mainDiv').fadeIn('fast');
		$('#covers').show();
		this.setUpCatThumbPackery();
		$('.catThumb').css({
			'animation-play-state': 'running'
		});
	},

	saveState(replace) {
		// console.log("...saving state...");
		if(!this.popped) {
			// console.log("...not popped...");
			let url = undefined;
			if(this.state.view === 'home' || this.state.view === 'thumbs') {
				url = '/?view=' + this.state.view  + '&gal=' + this.state.gal;
			} else if(this.state.view === 'image') {
				url = '/?view=' + this.state.view  + '&gal=' + this.state.gal + '&img=' + this.map.galleries[this.state.gal].photo[this.state.img].name;
			} else if(this.state.view === 'category') {
				url = '/?view=' + this.state.view  + '&cat=' + this.state.cat;
			} else {
				url = this.state.view;
			}
			if(replace) {
				history.replaceState(this.state, null, url);
			} else {
				history.pushState(this.state, null, url);
			}
		}
		this.popped = false;
	},

	popState(event) {
		if(event.state) {
			// console.log("State popped!");
			this.popped = true;
			this.setState(event.state);
		}
	},

	findImgIndexByName(galName, imgName) {
		for(let i=0; i < this.map.galleries[galName].photo.length; i++) {
			if(this.map.galleries[galName].photo[i].name === imgName) {
				return i;
			}
		}
		return -1;
	},

	setState(newState, replace) {
		// console.log("...setting new state:");
		if(newState.view === 'home') {
			newState.view = 'thumbs';
			newState.gal = 'home';
		}
		if(newState.gal && !this.map.galleries[newState.gal].loaded) {
			this.preloadImages(newState.gal);
		}
		if(this.state !== newState) {
			let fadeNavWidget = this.state.view === 'image' && newState.view === 'image' ? false : true;
			Object.assign(this.state, newState);
			this.updateNavWidget(fadeNavWidget);
			this.updateMainDiv();
			this.saveState(replace);
		}
	},

}




//	First load
$(() => {
	console.log(lkb);

	lkb.setUpMenuLinks();

	//	If map received from server includes query object, view that - otherwise show homepage 
	let query = lkb.map.query ? lkb.map.query : {
		view: 'home',
		gal: 'home',
	}
	query.img = lkb.map.query && lkb.map.query.imgName ? lkb.findImgIndexByName(lkb.map.query.gal, lkb.map.query.imgName) : null;
	lkb.setState(query, true);

	//	Listeners
	$('.toggleGrid').click(() => {
		lkb.setState({
			view: 'image',
			img: 0,
		});
	});
	$('.toggleFull').click(() => {
		lkb.setState({
			view: 'thumbs',
		});
	});
	$('.prevBtn, .fullNav.left').click(() => {
		lkb.prevImg();
	});
	$('.nextBtn, .fullNav.right').click(() => {
		lkb.nextImg();
	});

	window.onpopstate = event => {
		// console.log(event.state);
		lkb.popState(event);
	}
});


