// RocketCake Slideshow implementation
// (c) by Nikolaus Gebhardt / Ambiera e.U.
// parameters:
// imageArr: Array of urls to the images to be shown
function wsp_slideshow(elementid, imageArr, animationMode, timeForFrame, timeForFade, adjustMode, linksArr, vcenterMode, navbuttonOptions, advancedOptions)
{	
	var maindiv = document.getElementById(elementid);
	if (!maindiv)
		return;
	
	if (linksArr && imageArr.length != linksArr.length)
		linksArr = null;
	
	
	var startPage = 0;
	if (advancedOptions && typeof advancedOptions.startPage != 'undefined')
	{
		// set a start page
		startPage = advancedOptions.startPage;
	}
				
	// dummy image for keeping aspect ratio of slideshow in height=auto mode
	
	if (imageArr.length > 0)
	{
		var dummyelem = document.createElement('img');
		dummyelem.src = imageArr[0];
		dummyelem.style.position = 'relative';
		dummyelem.style.display = 'block';
		dummyelem.style.width = '100%'; 
		try { dummyelem.style.opacity = "0.0"; } catch(e) {} // hide
		maindiv.appendChild(dummyelem);	
	}
			
	// load and place images
	
	this.images = new Array();
		
	for (var i=0; i<imageArr.length; ++i)
	{
		var imgelem = document.createElement('img');
		imgelem.src = imageArr[i];
		imgelem.style.position = 'absolute';
		imgelem.style.top = '0';
		imgelem.style.left = '0';
		
		switch(adjustMode)
		{
		case null:
			break;
		case 'width':
			imgelem.style.width = '100%'; 
			break;
		case 'height':
			imgelem.style.height = '100%'; 
			// left position is adjusted in adjustImageLeftToCenterItForAdjustToHeight()
			break;
		case 'cover':
			// done during animate and switching in adjustImageSizeForCover()
			break;
		}		
		
		// links
		
		if (linksArr)
		{
			imgelem.imgLink = linksArr[i];
			imgelem.style.cursor = 'pointer';
			imgelem.onclick = function() { window.location = this.imgLink; };
		}
		
		// add		
		
		imgelem.style.display = i == startPage ? 'block' : 'none';
		maindiv.appendChild(imgelem);
		
		this.images.push(imgelem);
	}
	
	// find if we have some pages to show too, in addition to the images
	// child pages are elements with the id 'idofslideshow_pageN'
	
	this.pages = new Array();
	var idToTest = elementid + '_page';
	
	for(var i=0 ;i<maindiv.children.length; ++i)
	{
		var page = maindiv.children[i];
		if (page && page.id && page.id.startsWith(idToTest))
		{
			this.pages.push(page);
			
			page.style.position = 'absolute';
			page.style.top = '0';
			page.style.left = '0';
			page.style.width = '100%'; 
			page.style.display = i == startPage ? 'block' : 'none';
		}
	}
	
	if (this.pages.length > 0 && this.pages.length != this.images.length)
	{
		console.log("Slideshow image count doesn't match page count");
		return; // pages must be either null or the same amount as images, something is wrong
	}
	
	// move pages after images
	
	for(var i=0 ;i<this.pages.length; ++i)
		maindiv.removeChild(this.pages[i]);
	for(var i=0 ;i<this.pages.length; ++i)
		maindiv.appendChild(this.pages[i]);
	
	
	// store data
	
	if (timeForFrame == null)
		timeForFrame = 1000;
		
	if (timeForFade == null)
		timeForFade = timeForFrame * 0.25;
	if (timeForFade > timeForFrame * 0.5)
		timeForFade = timeForFrame * 0.5;
		
	this.timeForFrame = timeForFrame;
	this.timeForFade = timeForFade;
	this.currentFrame = startPage;
	this.lastShownFrame = -1;
	this.thisFrameBegin = this.getTimeMs();
	this.animIsBackwards = false; // make move animation backwards for pressing the back button
	this.animationMode = animationMode;
	this.adjustMode = adjustMode;
	this.elementId = elementid;
	this.isFirstFrame = true;
	this.vCenterMode = vcenterMode;
	this.hCenterImagesManually = adjustMode == 'height' && true; // when adjust mode is height, we also center the images horizontally manually
	this.PageIndicatorButtons = [];
	this.LastSetActivePageIndicator = -1;
	
	this.adjustImageSizeForCover();
	this.adjustImageLeftToCenterItForAdjustToHeight();
	
	// set timer for adjusting image sizes in cover mode
	
	var me = this;
	
	if (adjustMode == 'cover')
		setInterval(function(){ me.adjustImageSizeForCover(); }, 50);
	if (this.hCenterImagesManually)
		setInterval(function(){ me.adjustImageLeftToCenterItForAdjustToHeight(); }, 50);	
	
	// start timer to fade in and out images
	
	if (imageArr.length < 2)
		return;
		
	mytimeout = setInterval(function(){ me.onFrame(); }, 50);
	
	
	// navigation buttons
	
	var usenavbuttons = navbuttonOptions != null;
	
	if (usenavbuttons)
	{
		for (var i=0; i<2; ++i)
		{
			var navl = document.createElement("div");
			maindiv.appendChild(navl); // add to carousel container
			
			// button config			
			
			var cfg = navbuttonOptions;
			
			var buttonSize = (typeof cfg.buttonSize != "undefined") ? cfg.buttonSize : 50;
			var buttonFontSize = (typeof cfg.buttonFontSize != "undefined") ? cfg.buttonFontSize : 40;
			var buttonColor = (typeof cfg.buttonColor != "undefined") ? cfg.buttonColor : '#ffffff';
			var buttonHoverColor = (typeof cfg.buttonHoverColor != "undefined") ? cfg.buttonHoverColor :  '#555555';
			var buttonMargin = (typeof cfg.buttonMargin != "undefined") ? cfg.buttonMargin : 80;
			var buttonCharacterLeft = (typeof cfg.buttonCharacterLeft != "undefined") ? cfg.buttonCharacterLeft : '&#10094;';
			var buttonCharacterRight = (typeof cfg.buttonCharacterRight != "undefined") ? cfg.buttonCharacterRight : '&#10095;';
			var buttonBackgroundColor = (typeof cfg.buttonBackgroundColor != "undefined") ? cfg.buttonBackgroundColor : 'rgba(0, 0, 0, 0.5)';
			var buttonHoverBackgroundColor = (typeof cfg.buttonHoverBackgroundColor != "undefined") ? cfg.buttonHoverBackgroundColor : 'rgba(0, 0, 0, 0.5)';
			var buttonBorderRadius = (typeof cfg.buttonBorderRadius != "undefined") ? cfg.buttonBorderRadius : '50';
			var buttonFontFamily = (typeof cfg.buttonFontFamily != "undefined") ? cfg.buttonFontFamily : '';
			
			// create button
			
			var posstr = i == 0 ? ("left: " + buttonMargin + "px;") : ("right: " + buttonMargin + "px;");
			var buttonCss = '';
			
			navl.innerHTML = i == 0 ? buttonCharacterLeft : buttonCharacterRight;
			
			buttonCss += 'display: block; ';
			buttonCss += 'color: ' + buttonColor + '; ';
			buttonCss += 'background: ' + buttonBackgroundColor + '; ';
			buttonCss += 'position: absolute; ';
			buttonCss += 'padding: 0; ';
			buttonCss += 'text-align: center; ';
			buttonCss += posstr;
			buttonCss += 'top: calc(50% - ' + Math.floor(buttonSize/2) + 'px); ';
			buttonCss += 'margin: 0; ';
			buttonCss += 'font-size: ' + buttonFontSize + 'px; ';
			if (buttonFontFamily != '')
				buttonCss += 'font-family: ' + buttonFontFamily + '; ';
			buttonCss += 'width: ' + buttonSize + 'px; ';
			buttonCss += 'height: ' + buttonSize + 'px; ';
			buttonCss += 'cursor: pointer; ';
			buttonCss += 'margin: auto; '; // h center
			buttonCss += 'line-height: ' + buttonSize + 'px; '; // v center
			buttonCss += 'border-radius: ' + buttonBorderRadius + 'px; '; 
			buttonCss += 'user-select: none; ';
			
			navl.style.cssText = buttonCss;						
			navl.onmouseover  = function() { this.style.color = buttonHoverColor; this.style.background = buttonHoverBackgroundColor; };
			navl.onmouseout  = function() { this.style.color = buttonColor; this.style.background = buttonBackgroundColor; };
				
			if (i == 0)
				navl.onclick = function(event) 
				{ 
					me.gotoPreviousFrame();
				};
			else
				navl.onclick = function(event) 
				{ 
					me.gotoNextFrame();
				};

			navl.classList.add((i == 0) ? 'slideshowprevbutton' : 'slideshownextbutton');
		}
	}
	
	// page indicator
	
	if (advancedOptions && (typeof advancedOptions.enablePageIndicator != 'undefined') && advancedOptions.enablePageIndicator)
	{
		var indicator = document.createElement("div");
		maindiv.appendChild(indicator); // add to carousel container
		
		// indicator config
		
		var cfg = advancedOptions;
		
		var pageIndicatorPadding = (typeof cfg.pageIndicatorPadding != "undefined") ? cfg.pageIndicatorPadding : 10;
		var pageIndicatorButtonWidth = (typeof cfg.pageIndicatorButtonWidth != "undefined") ? cfg.pageIndicatorButtonWidth : 10;
		var pageIndicatorButtonHeight = (typeof cfg.pageIndicatorButtonHeight != "undefined") ? cfg.pageIndicatorButtonHeight : 10;
		var pageIndicatorButtonPadding = (typeof cfg.pageIndicatorButtonPadding != "undefined") ? cfg.pageIndicatorButtonPadding : 5;
		var pageIndicatorButtonColor = (typeof cfg.pageIndicatorButtonColor != "undefined") ? cfg.pageIndicatorButtonColor : '#555555';
		var pageIndicatorButtonActiveColor = (typeof cfg.pageIndicatorButtonActiveColor != "undefined") ? cfg.pageIndicatorButtonActiveColor : '#ffffff';
		var pageIndicatorButtonBorderRadius = (typeof cfg.pageIndicatorButtonBorderRadius != "undefined") ? cfg.pageIndicatorButtonBorderRadius : 5;
		var pageIndicatorButtonBorderWidth = (typeof cfg.pageIndicatorButtonBorderWidth != "undefined") ? cfg.pageIndicatorButtonBorderWidth : 0;
		var pageIndicatorButtonBorderColor = (typeof cfg.pageIndicatorButtonBorderColor != "undefined") ? cfg.pageIndicatorButtonBorderColor : '#cccccc';
		var pageIndicatorBackColor = (typeof cfg.pageIndicatorBackColor != "undefined") ? cfg.pageIndicatorBackColor : '#222222';
		var pageIndicatorBackBorderRadius = (typeof cfg.pageIndicatorBackBorderRadius != "undefined") ? cfg.pageIndicatorBackBorderRadius : 30;
		var pageIndicatorBackMargin = (typeof cfg.pageIndicatorBackMargin != "undefined") ? cfg.pageIndicatorBackMargin : 7;
		
		this.PageIndicatorButtonColor = pageIndicatorButtonColor;
		this.PageIndicatorButtonActiveColor = pageIndicatorButtonActiveColor;
		
		var posstr = "bottom: " + pageIndicatorPadding + "px;";
		var ctrlCss = '';
				
		var nPages = this.images.length;
		var ctrlWidth = (nPages * pageIndicatorButtonWidth) + ((nPages-1) * pageIndicatorButtonPadding) + (pageIndicatorBackMargin * 2);
		var ctrlHeight = pageIndicatorButtonHeight + (pageIndicatorBackMargin * 2);
		
		ctrlCss += 'display: block; ';
		ctrlCss += 'background: ' + pageIndicatorBackColor + '; ';
		ctrlCss += 'position: absolute; ';
		ctrlCss += 'padding: 0; ';
		ctrlCss += 'text-align: center; ';
		ctrlCss += posstr;
		ctrlCss += 'left: calc(50% - ' + Math.floor(ctrlWidth/2) + 'px); ';
		ctrlCss += 'margin: 0; ';
		ctrlCss += 'width: ' + ctrlWidth + 'px; ';
		ctrlCss += 'height: ' + ctrlHeight + 'px; ';
		//ctrlCss += 'cursor: pointer; ';
		ctrlCss += 'margin: auto; '; // h center
		ctrlCss += 'border-radius: ' + pageIndicatorBackBorderRadius + 'px; '; 
		ctrlCss += 'user-select: none; ';
		
		indicator.style.cssText = ctrlCss;		
		indicator.classList.add('slideshowPageIndicator');		
		
		// page buttons
		
		var nPos = pageIndicatorBackMargin;
		
		for (var i=0; i<nPages; ++i)
		{
			var pgbutton = document.createElement("div");
			indicator.appendChild(pgbutton); 
						
			var btnCss = '';
			btnCss += 'display: block; ';
			btnCss += 'background: ' + pageIndicatorBackColor + '; ';
			btnCss += 'position: absolute; ';
			btnCss += 'padding: 0; ';
			btnCss += 'text-align: center; ';
			btnCss += 'top: ' + pageIndicatorBackMargin + 'px; ';
			btnCss += 'left: ' + nPos + 'px; ';
			btnCss += 'margin: 0; ';
			btnCss += 'width: ' + pageIndicatorButtonWidth + 'px; ';
			btnCss += 'height: ' + pageIndicatorButtonHeight + 'px; ';
			btnCss += 'cursor: pointer; ';
			btnCss += 'border-radius: ' + pageIndicatorButtonBorderRadius + 'px; '; 
			btnCss += 'user-select: none; ';
			btnCss += 'border: ' + pageIndicatorButtonBorderWidth + 'px solid ' + pageIndicatorButtonBorderColor + '; '; 
			
			pgbutton.style.cssText = btnCss;		
			pgbutton.classList.add('slideshowPageIndicatorButton');		
			
			nPos += pageIndicatorButtonPadding + pageIndicatorButtonWidth;		
			
			var framenr = i;
			
			function makeGotoPageHandler(framenr)
			{
				return function(event) { me.gotoSpecificFrame(framenr); }
			}
			
			pgbutton.onclick = makeGotoPageHandler(framenr);	
			this.PageIndicatorButtons.push(pgbutton);
		}
		
		this.updatePageIndicatorColors();
	}
	
}


wsp_slideshow.prototype.calculateFade = function(now)
{
	// calculate animation values
	
	var fadeintime = now - this.thisFrameBegin;
	
	var currentImageAlpha = 1.0;
	var lastImageAlpha = 1.0;
		
	if (this.animationMode != 'none' && !this.isFirstFrame && fadeintime >= 0 && fadeintime <= this.timeForFade)
	{		
		if (fadeintime != 0)
			currentImageAlpha = fadeintime / this.timeForFade;
		else
			currentImageAlpha = 0;
			
		lastImageAlpha = 1.0 - currentImageAlpha;	
	}
	else
	{
		lastImageAlpha = 0;
		currentImageAlpha = 1;
	}
	
	// now do animation
	
	
	var currentImage = this.images[this.currentFrame];
	var lastShownImage = null;
	if (this.lastShownFrame != -1)
		lastShownImage = this.images[this.lastShownFrame];

	
	var currentPage = null;
	var lastShownPage = null;
	if (this.pages.length > 0)
	{
		currentPage = this.pages[this.currentFrame];
		if (this.lastShownFrame != -1)
			lastShownPage = this.pages[this.lastShownFrame];
	}
		
		
	if (this.animationMode == 'slide')
	{
		// animation mode: slide
		
		
		if (this.animIsBackwards && this.animationMode == 'slide')		
		{
			// slide backwards when the user clicked 'back'
			currentImage.style.left = (-100 + Math.floor(currentImageAlpha * 100)) + "%";		
			if (lastShownImage)
				lastShownImage.style.left = (0 + Math.floor(currentImageAlpha * 100)) + "%";
		}
		else
		{
			currentImage.style.left = (100 - Math.floor(currentImageAlpha * 100)) + "%";		
			if (lastShownImage)
				lastShownImage.style.left = (0 - Math.floor(currentImageAlpha * 100)) + "%";
		}
				
		// copy images position to page position
		if (currentPage)
			currentPage.style.left = currentImage.style.left;
		if (lastShownPage)
			lastShownPage.style.left = lastShownImage.style.left;		
		
		// add img.additionalLeftAdjustment if available, for vertically centered images (a small offset)
		if (currentImage.additionalLeftAdjustment)
		{
			var newleftval = 'calc( ' + currentImage.style.left + ' + ' + currentImage.additionalLeftAdjustment + 'px )';
			currentImage.style.left = newleftval;
			
			if (lastShownImage && lastShownImage.additionalLeftAdjustment)
			{
				newleftval = 'calc( ' + lastShownImage.style.left + ' + ' + lastShownImage.additionalLeftAdjustment + 'px )';
				lastShownImage.style.left = newleftval;
			}
		}
	
		// ensure that last image is not visible at all (if it overlaps)
		
		if ( lastImageAlpha == 0 )
		{
			if (lastShownImage)
				lastShownImage.style.left = "-20000px";
			
			if (lastShownPage)
				lastShownPage.style.left = "-20000px";
		}
	}
	else
	{
		// animation mode: fade or nothing
		
		this.setAlpha(currentImageAlpha, currentImage);
		this.setAlpha(lastImageAlpha, lastShownImage);	
		
		// same for pages
		
		this.setAlpha(currentImageAlpha, currentPage);
		this.setAlpha(lastImageAlpha, lastShownPage);	
	}
	
	// update indicator
	
	this.updatePageIndicatorColors();
}



wsp_slideshow.prototype.onFrame = function()
{
	var now = this.getTimeMs();
	var delta = now - this.thisFrameBegin;
	if (delta > this.timeForFrame)
	{
		// switch to next frame
		this.thisFrameBegin = now;
		this.gotoNextFrame();
	}
	else
	{
		this.calculateFade(now);
	}
}	


wsp_slideshow.prototype.setAlpha = function(alpha, img)
{
	if (img)
	{
		img.style.filter="Alpha(Opacity="+(alpha*100)+")";
		img.style.MozOpacity = alpha;
		img.style.opacity = alpha;
	}
}


// adjusts image size to remove gap in slideshow
wsp_slideshow.prototype.adjustImageLeftToCenterItForAdjustToHeight = function(img)
{
	if (this.adjustMode != 'height' || !this.hCenterImagesManually)
		return;
	
	var maindiv = document.getElementById(this.elementId);
	if (!maindiv)
		return;
		
	var h = maindiv.clientHeight;
	var w = maindiv.clientWidth;
	if (!h || !w)
		return;
		
	var idx = this.currentFrame;
	if (idx < 0 || this.images.length < idx)
		return;
		
	var img = this.images[idx];
	if (!img)
		return;
		
	if (img.width == 0 || img.height == 0)
		return;
	
	var imgSizeWidth = img.clientWidth;
	var diff = Math.floor((w - imgSizeWidth) / 2);
	img.style.left = "" + diff + "px";
	img.additionalLeftAdjustment = diff; // store it for the slide animation for later
}



// adjusts image size to remove gap in slideshow
wsp_slideshow.prototype.adjustImageSizeForCover = function(img)
{
	if (this.adjustMode != 'cover')
		return;
		
	var maindiv = document.getElementById(this.elementId);
	if (!maindiv)
		return;
		
	var h = maindiv.clientHeight;
	var w = maindiv.clientWidth;
	if (!h || !w)
		return;
		
	var idx = this.currentFrame;
	if (idx < 0 || this.images.length < idx)
		return;
		
	var img = this.images[idx];
	if (!img)
		return;
		
	if (img.width == 0 || img.height == 0)
		return;
	
	// set size
	
	var aspectW = w / img.width;
	
	var imgSizeWidth = w;
	var imgSizeHeight = img.height * aspectW;
	
	if (imgSizeHeight < h)
	{
		var aspectH = h / img.height;

		imgSizeWidth = img.width * aspectH;
		imgSizeHeight = h;
		
		// center horizontally (this only works if animation mode is 'fade')
		if (this.animationMode == 'fade')
		{
			var diff = Math.floor((w - imgSizeWidth) / 2);
			img.style.left = "" + diff + "px";
		}
	}
	
	// set
	
	img.style.width = Math.floor(imgSizeWidth) + 'px';
	img.style.height = Math.floor(imgSizeHeight) + 'px';
	
	// adjust to center vertically
	
	switch(this.vCenterMode)
	{
	case 'top': // nothing to do
		break;
	case 'center': 
		var diff = Math.floor((h - imgSizeHeight) / 2);
		img.style.top = "" + diff + "px";
		break;
	case 'bottom':
		var diff = Math.floor((h - imgSizeHeight));
		img.style.top = "" + diff + "px";
		break;
	}	
}


wsp_slideshow.prototype.getTimeMs = function()
{
	return (new Date()).getTime();
}



wsp_slideshow.prototype.gotoSpecificFrame = function(frameidx)
{
	if (this.currentFrame == frameidx)
		return;
	
	this.animIsBackwards = frameidx < this.currentFrame;
	
	// hide last shown image
	
	if (this.lastShownFrame != -1)
	{
		this.images[this.lastShownFrame].style.display = 'none';
		
		// also for pages
		if (this.pages.length > 0)
			this.pages[this.lastShownFrame].style.display = 'none';
	}
	
	// move to next frame
		
	this.lastShownFrame = this.currentFrame;
	this.currentFrame = frameidx;
	
	if (this.currentFrame >= this.images.length)
		this.currentFrame = 0;
	
	if (this.currentFrame < 0)
		this.currentFrame = this.images.length - 1;
		
	this.isFirstFrame = false;
	
	
	// show right images
		
	this.images[this.currentFrame].style.display = 'block';
	this.images[this.lastShownFrame].style.display = 'block';
	
	// also for pages
	if (this.pages.length > 0)
	{
		this.pages[this.currentFrame].style.display = 'block';
		this.pages[this.lastShownFrame].style.display = 'block';
	}
	
	// move animation
	
	this.thisFrameBegin = this.getTimeMs();
	this.calculateFade(this.thisFrameBegin);
}




wsp_slideshow.prototype.gotoNextFrame = function()
{
	this.gotoSpecificFrame(this.currentFrame + 1);
}



wsp_slideshow.prototype.gotoPreviousFrame = function()
{
	this.gotoSpecificFrame(this.currentFrame - 1);
}



wsp_slideshow.prototype.pauseResumeSlideshow = function()
{
	var longTime = 99999999990;
	
	if (this.timeForFrame == longTime)
	{
		this.timeForFrame = origTimeForFrame;
		this.thisFrameBegin = (new Date()).getTime();
	}
	else
	{
		origTimeForFrame = this.timeForFrame;
		this.timeForFrame = longTime;
		this.thisFrameBegin = (new Date()).getTime();
	}
}


wsp_slideshow.prototype.updatePageIndicatorColors = function()
{
	if (!this.PageIndicatorButtons.length || !this.PageIndicatorButtonActiveColor)
		return;
	
	if (this.LastSetActivePageIndicator == this.currentFrame)
		return;
		
	for (var i=0; i<this.PageIndicatorButtons.length; ++i)
	{
		var active = i == this.currentFrame;
		var btn = this.PageIndicatorButtons[i];
		
		btn.style.background = active ? this.PageIndicatorButtonActiveColor : this.PageIndicatorButtonColor;
	}
	
	this.LastSetActivePageIndicator = this.currentFrame;
}


