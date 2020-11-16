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
		formSelector: 'form.en__component.en__component--page',

		// track the current page number
		currentPageNumber     : 1, // enable the form to start in the middle after a reload
		currentPageClass      : 'current',
		pageStartSelector     : '.step', // start of a fake page
		pageExcludeSelector   : '.step-exclude', // don't include in fake page structure
		pageItemClass         : 'step-item',
		pageItemParentSelector: '', // find the parent element of the start of the page
		pageIDPrefix          : 'step',
		errorSelector         : '.en__field__error',
		submitSelector        : '.en__submit > button',

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
		pageButtons   : jQuery('<div class="step-nav"/>'),
		backButton    : jQuery('<button class="step-back">Back</button>'),
		continueButton: jQuery('<button class="step-next">Continue</button>'),

		/* Some customizations might need to re-render each
		 * time the page appears. This object allows a custom
		 * installation to define that code.
		 *
		 * The '0' entry below runs for every page. It's a
		 * fair to middling example of how to use this.
		 */
		pageChange: {
			'0': {
				beforeShow: function(pageNumber, pageObject) {
					// clear errors before showing a new page
					pageObject.find(TEGFakePages.options.errorSelector).hide();
					return true;
				}, // end beforeShow()
				beforeHide: function(pageNumber, pageObject) {

					// Are we validating?
					if (TEGFakePages.options.runValidation === 'none') {
						// If not, just go.
						return true;

					} else {
						// Otherwise, don't leave if errors are visible.
						return pageObject.find(TEGFakePages.options.errorSelector).is(':visible');
					}
				}, // end beforeHide()
			}, // end page '0' callbacks
		}, // end pageChange()

		/* Allow per-page validation by the CMS or a custom
		 * browser-side solution.
		 *
		 * The value of runValidation should be a key for an
		 * entry in the runValidSetupTypes collection of
		 * functions. The associated function will be run
		 * after the page navigation is set up.
		 *
		 * Since we do so much work for Engaging Networks,
		 * we have a default set for them.
		 */
		runValidation     : 'engagingNetworks',
		runValidationTypes: {
			engagingNetworks: {
				nextButtonFunc: function() {
					TEGFakePages.newPageNumber = TEGFakePages.currentPageNumber + 1;
					return true;
				},
				setup         : function() {
					/* Alter EN's submission events to change virtual pages. If
					 * the form is incomplete, there will be empty fields and
					 * EN's code will call this function.
					 */
					window.enOnError = function() {
						// remove the error classes, if any
						TEGFakePages.currentPageObject.removeClass(TEGFakePages.options.sectionErrorClass);
						TEGFakePages.form.removeClass(TEGFakePages.options.formErrorClass);

						// highlight errors on the current page
						if (TEGFakePages.currentPageObject.find(TEGFakePages.options.errorSelector).length > 0) {
							TEGFakePages.currentPageObject.addClass(TEGFakePages.options.sectionErrorClass);
							TEGFakePages.form.addClass(TEGFakePages.options.formErrorClass);

						} else {

							// no errors on current page, check if we need to navigate to the next page
							if (TEGFakePages.currentPageNumber < TEGFakePages.lastPageNumber) {
								// make sure error markers are cleared before showing next page
								TEGFakePages
									.currentPageObject
									.siblings('section')
									.removeClass(TEGFakePages.options.sectionErrorClass)
									.find(TEGFakePages.options.errorSelector)
									.remove();
								TEGFakePages.goPage(TEGFakePages.newPageNumber, false);
							} // end if not last page
						}
					}; // end enOnError()
					window.enOnSubmit = function() {
						// remove the error classes, if any
						TEGFakePages.pageObjects.removeClass(TEGFakePages.options.sectionErrorClass);
						TEGFakePages.form.removeClass(TEGFakePages.options.formErrorClass);

						// are we done?
						if (TEGFakePages.currentPageNumber === 0 ||
						    (TEGFakePages.currentPageNumber === TEGFakePages.lastPageNumber))
						{
							return true;

						} else {
							TEGFakePages.goPage(TEGFakePages.newPageNumber);
							return false;
						} // end if we're done
					}; // end enOnSubmit()
				} // end setup()
			}, // end engagingNetworks
			none            : {
				nextButtonFunc: function(event) {
					TEGFakePages.nextPage(event);
				}, // end button()
				setup         : function() {
					/* If we're not running validation then
					 * just attach nextPage to the continue
					 * buttons.
					 */
				},
			}, // end none
			custom          : {
				nextButtonFunc: function(event) {
					// default does nothing
				}, // end button()
				setup         : function() {
					// Roll your own.
				}, // end setup()
			}, // end custom
		},
		sectionErrorClass : 'sectionError', // add this CSS class to a section (page) with errors visible
		formErrorClass    : 'formError', // add this CSS class to the form when there are errors visible

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
	}; // end TEGFakePages.options
	// override with options from new TEGFakePages() statement
	jQuery.extend(TEGFakePages.options, Options);

	// allow form specific overrides
	if (typeof TEGCustomPages !== 'undefined')
	{
		jQuery.extend(TEGFakePages.options, TEGCustomPages);
	}
	// get the form (or page content container) and hide it
	TEGFakePages.form = jQuery(TEGFakePages.options.formSelector);

	// only continue initializing if the page content exists
	if (TEGFakePages.form.length === 0) {
		return false;
	}

	// get the body
	TEGFakePages.body = jQuery('body');

	// try to initialize TEGUtilities.windowSize
	if (typeof jQuery.windowSize === 'object') {
		jQuery.windowSize.init(TEGFakePages.options.windowSizeOptions);

	} else {

		if (console) {
			console.log('TEG Fake Pages won\'t load without TEG jQuery Utilities.');
		} // end if console available
		return false;
	}

	TEGFakePages.currentPageNumber = TEGFakePages.options.currentPageNumber;
	TEGFakePages.newPageNumber = TEGFakePages.currentPageNumber; // we need to pass this into Engaging Network's validation functions
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

			// if we're adding breadcrumbs
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
					.click(TEGFakePages.previousPage);

				// Handle next page navigation according to validation settings
				if (TEGFakePages.options.runValidation === 'none') {
					thisCrumb
						.find('.next')
						.click(TEGFakePages.nextPage);

				} else {
					thisCrumb
						.find('.next')
						.click(function(event) {
							event.preventDefault();
							event.stopImmediatePropagation();
							TEGFakePages.form.submit();
						});
				} // end if CMS or custom validation

				thisCrumb
					.attr('data-step', index + 1)
					.click(function(event) {
						event.preventDefault();
						event.stopImmediatePropagation();
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
				var newButtons  = TEGFakePages.options
				                              .pageButtons
				                              .clone(),
				    newNext     = TEGFakePages.options
				                              .continueButton
				                              .clone()
				                              .on('click keydown', function(event) {
					                              TEGFakePages.options.runValidationTypes[TEGFakePages.options.runValidation].nextButtonFunc(event);
				                              }),
				    newPrevious = TEGFakePages.options
				                              .backButton
				                              .clone()
				                              .on('click keydown', function(event) {
					                              TEGFakePages.previousPage(event);
				                              });

				// if first page
				if (index === 0) {
					// first page gets only the continue button
					newButtons.append(newNext);

				} else {

					// otherwise, if last page
					if (thisPage.find(TEGFakePages.options.submitSelector).length > 0) {
						// last page gets back button added to submit button
						newButtons.append(thisPage.find(TEGFakePages.options.submitSelector))
						          .append(newPrevious);

					} else {
						/* All other pages get back and continue buttons.
						 * Note: continue is first so it can appear above
						 * the back button on mobile.
						 */
						newButtons.append(newNext)
						          .append(newPrevious);
					} // end if last page
				} // end if first page
				thisPage.append(newButtons);
			} // end if adding buttons
		}) // end pageStartSelector.each()
		.length; // end assign number of pages to lastPageNumber
	// create a list of all the new pages
	TEGFakePages.pageObjects = TEGFakePages.form.find('[id^="' + TEGFakePages.options.pageIDPrefix + '"]');
	// reference to current page
	TEGFakePages.currentPageObject = TEGFakePages.pageObjects
	                                             .eq(TEGFakePages.currentPageNumber - 1)
	                                             .addClass(TEGFakePages.options.currentPageClass);

	// Run the setup function for the validation
	TEGFakePages.options.runValidationTypes[TEGFakePages.options.runValidation].setup();

	/* Start at the specified page number and use
	 * an "internal" variable for the page counter.
	 */
	TEGFakePages.goPage = function(page, goPageRunValidation) {
		// We only need the validation steps if validation is globally enabled.
		goPageRunValidation = goPageRunValidation && (typeof TEGFakePages.options.runValidation === 'function');

		// don't go to a page that doesn't exist
		if (page > TEGFakePages.lastPageNumber) {
			return false;
		}

		/* Don't check validation if:
		 * initial page load
		 * going backward
		 * runValidation is false
		 */
		if (page > TEGFakePages.currentPageNumber &&
		    goPageRunValidation)
		{

			// if there are any errors from a CMS's field validation or custom validation
			if (TEGFakePages.currentPageObject.find(TEGFakePages.options.errorSelector).is(':visible')) {
				return false;
			}
		}

		// If beforeHide() exists for all pages, run it.
		if (TEGFakePages.options.pageChange.hasOwnProperty(TEGFakePages.currentPageNumber) &&
		    TEGFakePages.options.pageChange['0'].hasOwnProperty('beforeHide'))
		{
			TEGFakePages.options
				.pageChange['0'].beforeHide(TEGFakePages.currentPageNumber, TEGFakePages.currentPageObject);
		} // end if beforeHide() exists for all pages

		// if beforeHide() exists for current page
		if (TEGFakePages.options.pageChange.hasOwnProperty(TEGFakePages.currentPageNumber) &&
		    TEGFakePages.options.pageChange[TEGFakePages.currentPageNumber].hasOwnProperty('beforeHide'))
		{

			// and the function returns false
			if (!TEGFakePages
				.options
				.pageChange[TEGFakePages.currentPageNumber]
				.beforeHide(TEGFakePages.currentPageNumber, TEGFakePages.currentPageObject))
			{
				return false;
			} // end if not cleared to leave
		} // end if beforeHide() exists for current page

		// If beforeShow() exists for all pages, run it.
		if (TEGFakePages.options.pageChange.hasOwnProperty(TEGFakePages.currentPageNumber) &&
		    TEGFakePages.options.pageChange['0'].hasOwnProperty('beforeShow'))
		{
			TEGFakePages.options
				.pageChange['0'].beforeShow(TEGFakePages.currentPageNumber, TEGFakePages.currentPageObject);
		} // end if beforeShow() exists for all pages

		// If beforeShow() exists for current page
		if (TEGFakePages.options.pageChange.hasOwnProperty(page) &&
		    TEGFakePages.options.pageChange[page].hasOwnProperty('beforeShow'))
		{

			// and the function returns false
			if (!TEGFakePages
				.options
				.pageChange[page]
				.beforeShow(page, TEGFakePages.body.find('section#' + TEGFakePages.options.pageIDPrefix + page)))
			{
				// then skip to the new page with no validation
				TEGFakePages.goPage(TEGFakePages.currentPageNumber + 1, false);
				// and don't let this instance of the recursion continue
				return false;
			} // end if not cleared to leave
		} // endif beforeShow() exists for current page

		// set new step number
		TEGFakePages.currentPageNumber = +page;
		// set current page pointer
		TEGFakePages.pageObjects.removeClass('current');
		TEGFakePages.currentPageObject = TEGFakePages.pageObjects.eq(TEGFakePages.currentPageNumber - 1);
		// mark the current page for CSS styles
		TEGFakePages.pageObjects.removeClass(TEGFakePages.options.currentPageClass);
		TEGFakePages.currentPageObject.addClass(TEGFakePages.options.currentPageClass);

		// highlight correct breadcrumb and mark as visited
		if (TEGFakePages.options.breadcrumbs.length > 0) {
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
		} // end if breadcrumbs exist

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
	// navigate to the next page
	TEGFakePages.nextPage = function(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
		TEGFakePages.newPageNumber = TEGFakePages.currentPageNumber + 1;
		TEGFakePages.goPage(TEGFakePages.newPageNumber, false);
	}; // end nextPage()
	// navigate to the prvious page
	TEGFakePages.previousPage = function(event) {
		// Never validate if navigating backward.
		event.preventDefault();
		event.stopImmediatePropagation();

		// only go backward if not first step
		if (TEGFakePages.currentPageNumber > 1) {
			TEGFakePages.newPageNumber = TEGFakePages.currentPageNumber - 1;
			TEGFakePages.goPage(TEGFakePages.newPageNumber, false);
		} // end if first step
	}; // end previousPage()

	// navigate to the first page with an error showing
	TEGFakePages.errorPage = function() {

		for (var counter = 0; counter < TEGFakePages.pageObjects.length; counter++) {

			if (TEGFakePages.pageObjects.eq(counter).find(TEGFakePages.options.errorSelector + ':visible').length > 0) {
				// go page uses page numbers rather than array offsets
				TEGFakePages.goPage(counter + 1, false);
				break;
			} // end if this page has visible errors
		} // end loop through pages
	}; // end errorPage

	// go to the appropriate page
	if (TEGFakePages.form.find(TEGFakePages.options.errorSelector + ':visible').length > 0) {
		// if there are errors visible, go to the first with those errors
		TEGFakePages.errorPage();

	} else {
		// otherwise, go to the (ostensibly) first page
		TEGFakePages.goPage(TEGFakePages.currentPageNumber);
	}
	// tell the breadcrumbs (if any) that we've seen the first page viewed
	jQuery('[data-step="' + TEGFakePages.currentPageNumber + '"]').attr('data-visited', 'true');
	// run custom additional code
	TEGFakePages.options.afterLoad(TEGFakePages.options);
} // end TEGFakePages