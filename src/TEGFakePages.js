/* TEGFakePages
 * Add pagination to a form.
 *
 * Copyright 2020, PMG / The Production Management Group, Ltd.
 * Released under the MIT license.
 *
 * The Engage Group <engage@engageyourcause.com>
 */
function TEGFakePages(Options) {
	var TEGFakePages = this;

	TEGFakePages.options = {
		// find the form
		formSelector: 'form',

		// track the current page number
		currentPageNumber     : 1, // enable the form to start in the middle after a reload
		currentPageClass      : 'current',
		pageStartSelector     : '.step', // start of a fake page
		pageExcludeSelector   : '.step-exclude', // don't include in fake page structure
		pageItemClass         : 'step-item',
		pageItemParentSelector: '', // find the parent element of the start of the page
		pageIDPrefix          : 'step',
		errorSelector         : 'error',
		submitSelector        : '[type="submit"]',

		// generating breadcrumb navigation
		breadcrumbs          : jQuery('<div class="row"></div>'), // if not empty, create breadcrumbs
		/* Any HTML element in a breadcrumbItem* object will
		 * be filled with the HTML content of the item
		 * defined by pageStartSelector. With the default
		 * settings for example:
		 *
		 * <h1 class='.step'>Donation Info<span class="desktopView">rmation</span></h1>
		 *
		 * will generate the breadcrumb
		 *
		 * <div class="col title">Donation Info<span class="desktopView">rmation</span></h1>
		 *
		 *
		 * If the item defined by pageStartSelector has the
		 * attribute data-breadcrumb, then the value of that
		 * attribute will be rendered in the breadcrumb item.
		 * With the default settings for example:
		 *
		 * <h1 class='.step' data-breadcrumb="Donation Info">Donation Information</h1>
		 *
		 * will generate the breadcrumb
		 *
		 * <div class="col title">Donation Info</h1>
		 */
		// @formatter:off
		breadcrumbItemMobile : jQuery('<div class="row"></div>')
			.append('<div class="col-2 previous">&nbsp;</div>')
			.append('<div class="col title" />')
			.append('<div class="col-2 next">&nbsp;</div>'),
		// @formatter:on
		breadcrumbItemTablet : jQuery('<div class="col title"></div>'),
		breadcrumbItemDesktop: jQuery('<div class="col title"></div>'),

		// page button navigation
		pageButtons     : jQuery('<div class="step-nav"/>'),
		backButton      : jQuery('<button class="step-back">Back</button>'),
		continueButton  : jQuery('<button class="step-next">Continue</button>'),

		/* Some customizations might need to re-render each
		 * time the page appears. This object allows a custom
		 * installation to define those callbacks.
		 */
		pageCallbacks: {
			'1': {
				beforeShow: function(pageNumber, pageObject) {
					/* take some action before the page
					 * appears and/or skip to the next page
					 * by returning false
					 */

					if (console) {
						console.log('beforeLoad default\n' +
						            'pageNumber = ' + pageNumber + '\n' +
						            'pageObject = ' + jQuery(pageObject).class + '\n');
					}
					return true;
				},
				beforeHide: function(pageNumber, pageObject) {
					/* take some action before the page
					 * disappears and/or prevent the user
					 * from leaving the page by returning false
					 */

					if (console) {
						console.log('beforeHide default\n' +
						            'pageNumber = ' + pageNumber + '\n' +
						            'pageObject = ' + jQuery(pageObject).prop('nodeName') + '\n' +
						            '   ID      = ' + jQuery(pageObject).attr('id') + '\n' +
						            '   class      = ' + jQuery(pageObject).attr('class') + '\n');
					}
					return true;
				},
			},
		},

		// preferred window sizes can be set here
		windowSizeOptions: {
			/* mobileMaxWidth : 600,
			 * tabletMinWidth : 599,
			 * tabletMaxWidth : 961,
			 * desktopMinWidth: 968,
			 * tallMinHeight  : 820,
			 * afterWindowSize : function() {},
			 */
		},

		// allow code that runs after all of this
		afterLoad: function() {
			return false;
		}
	} // end TEGFakePages.options
	// override with options from new TEGFakePages() statement
	jQuery.extend(TEGFakePages.options, Options);

	// allow form specific overrides
	if (typeof TEGCustomPages !== 'undefined') {
		jQuery.extend(TEGFakePages.options, TEGCustomPages);
	}
	// get the donation form and hide it
	TEGFakePages.form = jQuery(TEGFakePages.options.formSelector).hide();

	// only continue initializing if the donation form exists
	if (TEGFakePages.form.length === 0) {

		if (console) {
			console.log('TEGFakePages error: Form not found.');
		}
		return false;
	}

	// get the document
	TEGFakePages.document = jQuery(document);
	// get the body
	TEGFakePages.body = TEGFakePages.document.find('body');
	// get list of all fields
	TEGFakePages.fields = TEGFakePages.document.find('input').add('select').add('textarea');
	// parse query string arguments
	TEGFakePages.args = {};
	window.location.search.slice(1).split('&').forEach(function(arg) {

		if (arg) {
			var nv      = arg.split('='),
			    argName = nv[0];

			// scrub html
			if (nv[1]) {
				TEGFakePages.args[argName] = decodeURIComponent(nv[1]).replace(/</g, '');
			}
		}
	}); // end query string processing

	// try to initialize TEGUtilities.windowSize
	if (typeof jQuery.windowSize === 'object') {
		jQuery.windowSize.init(TEGFakePages.options.windowSizeOptions);

	} else {

		if (console) {
			console.log('TEGFakePages Error: Refusing to load without TEGUtilities.');
		}
		return false;
	}

	TEGFakePages.currentPageNumber = TEGFakePages.options.currentPageNumber;
	// build page structure and assign length of that array to lastPageNumber
	TEGFakePages.lastPageNumber = jQuery(TEGFakePages.options.pageStartSelector)
		.each(function(index) {
			// Each step starts with a .step and goes to the next .step or end of form
			var thisItem  = jQuery(this),
			    thisPage  = jQuery('<section/>')
				    .addClass(TEGFakePages.options.pageItemClass)
				    .attr('id', TEGFakePages.options.pageIDPrefix + index),
			    container = thisItem.closest(TEGFakePages.options.pageItemParentSelector);
			// Check for nested structure from a CMS.
			if (container.length > 0) {
				// if there's parent structure, start there instead.
				thisPage.insertBefore(container);
				container
					.nextUntil(TEGFakePages.options.pageItemParentSelector +
					           ':has(' +
					           TEGFakePages.options.pageStartSelector +
					           '), ' +
					           TEGFakePages.options.pageItemParentSelector +
					           ':has(' +
					           TEGFakePages.options.pageExcludeSelector +
					           ')'
					)
					.addBack()
					.appendTo(thisPage);

			} else {
				// If there's no parent structure, just start at the current item.
				thisPage.insertBefore(thisItem);
				thisItem
					.nextUntil(TEGFakePages.options.pageStartSelector + ', ' +
					           TEGFakePages.options.pageExcludeSelector)
					.addBack()
					.appendTo(thisPage);
			}

			// are we making breadrumbs?
			if (TEGFakePages.options.breadcrumbs.length > 0) {
				var thisCrumb,
				    thisTitle;

				// select the correct breadcrumb item structure
				if (jQuery.windowSize.isMobile &&
				    TEGFakePages.options.breadcrumbItemMobile.length > 0)
				{
					thisCrumb = TEGFakePages.options.breadcrumbItemMobile.clone();

				} else {
					if (jQuery.windowSize.isTablet &&
					    TEGFakePages.options.breadcrumbItemTablet.length > 0)
					{
						thisCrumb = TEGFakePages.options.breadcrumbItemTablet.clone();

					} else {
						if (jQuery.windowSize.isDesktop &&
						    TEGFakePages.options.breadcrumbItemDesktop.length > 0)
						{
							thisCrumb = TEGFakePages.options.breadcrumbItemDesktop.clone();
						}
					}
				}

				// initialize the title
				if (thisItem.attr('data-breadcrumb') !== undefined) {
					thisTitle = thisItem.attr('data-breadcrumb');

				} else {
					thisTitle = thisItem.html();
				}

				// allow previous and next buttons
				thisCrumb
					.find('.previous')
					.click(function(event) {
						event.preventDefault();
						TEGFakePages.previousPage(event);
					});
				thisCrumb
					.find('.next')
					.click(function(event) {
						TEGFakePages.nextPage(event);
					});
				thisCrumb
					.attr('data-step', index + 1)
					.click(function(event) {
						event.preventDefault();
						var thisStep = jQuery(this);

						/* Make the user click the page buttons to
						 * submit the form for EN native validation.
						 */
						if (thisStep.attr('data-visited') === 'true') {
							TEGFakePages.goPage(+thisStep.attr('data-step'));
						}
					});
				// set the breadcrumb content
				var titleItem = thisCrumb;

				// check for the 'title' class
				if (!thisCrumb.is('.title')) {
					titleItem = thisCrumb.find('.title');
				}
				titleItem.html(thisTitle);

				TEGFakePages
					.options
					.breadcrumbs
					.append(thisCrumb)
					.prependTo(TEGFakePages.form);
			} // end breadcrumbs

			// if we're adding page buttons
			if (TEGFakePages.options.pageButtons.length > 0) {

				// if first page
				if (index === 0) {
					// first page gets only the continue button
					thisPage
						.append(
							TEGFakePages
								.options
								.pageButtons
								.clone()
								.append(
									TEGFakePages
										.options
										.continueButton
										.clone()
										.click(function(event) {
											TEGFakePages.nextPage(event);
										})
								)
						); // end thisPage.append()

					// end if first page
				} else {
					if (thisPage.find(TEGFakePages.options.submitSelector).length > 0) {
						// last page gets back button added to submit button
						thisPage
							.append(
								TEGFakePages
									.options
									.pageButtons
									.clone()
									.append(
										thisPage.find(TEGFakePages.options.submitSelector)
									)
									.append(
										TEGFakePages
											.options
											.backButton
											.clone()
											.click(function(event) {
												event.preventDefault();
												TEGFakePages.previousPage(event);
											})
									) // end .append() to pageButtons
							); // end .append() to page

						// end if last page with EN submit button
					} else {
						/* All other pages get back and continue buttons.
						 * Note: continue is first so it can appear above
						 * the back button on mobile.
						 */
						thisPage
							.append(
								TEGFakePages
									.options
									.pageButtons
									.clone()
									.append(
										TEGFakePages
											.options
											.continueButton
											.clone()
											.click(function(event) {
												TEGFakePages.nextPage(event);
											})
									)
									.append(
										TEGFakePages
											.options
											.backButton
											.clone()
											.click(function(event) {
												event.preventDefault();
												TEGFakePages.previousPage(event);
											})
									)
							); // end thisPage.append()
					} // end if adding buttons
				} // end if first page
			} // end if pageButtons has content
		}) // end each()
		.length; // end assign number of pages to options.lastPageNumber
	// create a list of all the new pages
	TEGFakePages.pageObjects = TEGFakePages.form.find('[id^="' + TEGFakePages.options.pageIDPrefix + '"]');
	// reference to current page
	TEGFakePages.currentPageObject = TEGFakePages.pageObjects
	                                             .eq(TEGFakePages.currentPageNumber - 1)
	                                             .addClass(TEGFakePages.options.currentPageClass);
	/* Start at the specified page number and use
	 * an "internal" variable for the page counter.
	 */

	TEGFakePages.goPage = function(page, runValidation) {
		var validate = false; // default to no validation

		// set validate from parameter
		if (typeof runValidation !== 'undefined') {
			validate = runValidation;
		}

		// don't go to a page that doesn't exist
		if (page > TEGFakePages.options.lastPageNumber) {
			return false;
		}

		/* don't validate if:
		 * initial page load
		 * going backward
		 * validate is false
		 */
		if (page > TEGFakePages.currentPageNumber && validate) {

			// if the current page doesn't pass
			if (!TEGFakePages.parsley.validate({group: TEGFakePages.options.pageIDPrefix + TEGFakePages.currentPageNumber})) {
				return false;
			}
		}

		// if there are any errors from Engaging Networks field validation
		if (TEGFakePages.currentPageObject.find(TEGFakePages.options.errorSelector).is(':visible')) {
			return false;
		}

		// if the beforeHide() callback exists
		if (TEGFakePages.options.pageCallbacks.hasOwnProperty(TEGFakePages.currentPageNumber) &&
		    TEGFakePages.options.pageCallbacks[TEGFakePages.currentPageNumber].hasOwnProperty('beforeHide'))
		{

			// and the callback returns false
			if (!TEGFakePages
				.options
				.pageCallbacks[TEGFakePages.currentPageNumber]
				.beforeHide(TEGFakePages.currentPageNumber, TEGFakePages.currentPageObject))
			{
				return false;
			} // end if not cleared to leave
		} // end if callback exists

		// if the beforeShow() callback exists
		if (TEGFakePages.options.pageCallbacks.hasOwnProperty(page) &&
		    TEGFakePages.options.pageCallbacks[page].hasOwnProperty('beforeShow'))
		{

			// and the callback returns false
			if (!TEGFakePages
				.options
				.pageCallbacks[page]
				.beforeShow(page, TEGFakePages.body.find('section#' + TEGFakePages.options.pageIDPrefix + page)))
			{
				// then skip to the new page with no validation
				TEGFakePages.goPage(TEGFakePages.currentPageNumber + 1, false);
				// and don't let this instance of the recursion continue
				return false;
			} // end if callback fails
		} // endif callback exists

		TEGFakePages.currentPageNumber = +page;

		// set new step number
		// set current page pointer
		TEGFakePages.pageObjects.removeClass('current');
		TEGFakePages.currentPageObject = TEGFakePages.pageObjects.eq(TEGFakePages.currentPageNumber - 1);
		// mark the current page for CSS styles
		TEGFakePages.pageObjects.removeClass(TEGFakePages.options.currentPageClass);
		TEGFakePages.currentPageObject.addClass(TEGFakePages.options.currentPageClass);
		// clear any remnant error notices
		TEGFakePages.currentPageObject
		            .find(TEGFakePages.options.errorSelector)
		            .hide();

		// highlight correct breadcrumb and mark as visited
		TEGFakePages
			.options
			.breadcrumbs
			.find('[data-step]')
			.each(function() {
				var thisCrumb = jQuery(this);

				thisCrumb
					.removeClass('current past');
				if (+thisCrumb.attr('data-step') < TEGFakePages.currentPageNumber) {
					thisCrumb
						.addClass('past');

				} else {
					if (+thisCrumb.attr('data-step') === TEGFakePages.currentPageNumber) {
						thisCrumb
							.addClass('current')
							.attr('data-visited', 'true');
					}
				}
			});

		// show the top of the form page on mobile phones
		if (jQuery.windowSize.isMobile) {

			// if breadcrumbs exist scroll there
			if (TEGFakePages.options.breadcrumbs.length > 0) {
				jQuery('html, body').animate({scrollTop: TEGFakePages.options.breadcrumbs.offset().top}, 500);

			} else {
				// otherwise scroll to the top
				jQuery('html, body').animate({scrollTop: 0}, 500);

			} // end if breadcrumbs exist
		} // end if phone
	}; // end goPage()

	TEGFakePages.nextPage = function(event) {

		if (console) {
			console.log('nextPage\n' +
			            'event.currentTarget.id = ' + event.currentTarget.id + '\n');
		}

		// prevent submit action
		event.preventDefault();
		event.stopImmediatePropagation();

		// only go forward if not last step
		if (TEGFakePages.currentPageNumber < TEGFakePages.lastPageNumber) {
			TEGFakePages.goPage(TEGFakePages.currentPageNumber + 1);
		} // end if last step
	}; // end nextPage()
	TEGFakePages.previousPage = function(event) {

		if (console) {
			console.log('previousPage\n' +
			            'event.currentTarget.id = ' + event.currentTarget.id + '\n');
		}

		// prevent submit action
		event.preventDefault();
		event.stopImmediatePropagation();

		// only go backward if not first step
		if (TEGFakePages.currentPageNumber > 1) {
			TEGFakePages.goPage(TEGFakePages.currentPageNumber - 1, false);
		} // end if first step
	}; // end previousPage()

	// go to the first page
	TEGFakePages.goPage(TEGFakePages.currentPageNumber);
	// tell the breadcrumbs we've seen the first page
	jQuery('[data-step="1"]').attr('data-visited', 'true');
	// run custom additional code
	TEGFakePages.options.afterLoad(TEGFakePages.options);
	// we're done setting up, show the form
	TEGFakePages.form.show();
} // end TEGFakePages