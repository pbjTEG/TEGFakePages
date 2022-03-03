/* TEGFakePages
 * Add pagination to a form.
 *
 * Copyright 2020, PMG / The Production Management Group, Ltd.
 * Released under the MIT license.
 *
 * The Engage Group <engage@engageyourcause.com>
 */

class TEGFakePages {

	// Private Members
	#currentPageObject;
	#currentPageNumber = 0; // keeping track of where we are
	#lastPageNumber = 0; // last in the list; not previous to current
	#pageObjects;
	#newPageNumber;

	// Constants

	constructor(Options) {
		const __instance = this;

		__instance.options = {
			// find the form
			formSelector : 'form.en__component.en__component--page',

			// track the current page number
			currentPageNumber      : 1, // enable the form to start in the middle after a reload
			currentPageClass       : 'current',
			pageStartSelector      : '.step', // start of a fake page
			pageExcludeSelector    : '.step-exclude', // don't include in fake page structure
			pageItemClass          : 'step-item',
			pageItemParentSelector : '.en__component', // find the parent element of the start of the page
			pageIDPrefix           : 'step',
			errorSelector          : '.en__field__error',
			submitSelector         : '.en__submit > button',

			// generate fake pages rather than read them
			pageLength : 0, // default to reading them from the page

			// generating breadcrumb navigation
			breadcrumbs : jQuery('<div class="row"></div>'), // if not empty, create breadcrumbs
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
			 * If the item defined by pageStartSelector has the attribute data-breadcrumb, then the
			 * value of that attribute will be rendered in the breadcrumb item. With the default
			 * settings for example:
			 *
			 * <h1 class='.step' data-breadcrumb="Donation Info">Donation Information</h1>
			 *
			 * will generate the breadcrumb
			 *
			 * <div class="col title">Donation Info</h1>
			 *
			 * Anything with the CSS class '.previous' will have the previousPage() function
			 * attached. Anything with the CSS class '.next' will have the nextPage()
			 * function attached.
			 */
			breadcrumbItemMobile  :
					jQuery('<div class="row"></div>')
							.append('<div class="col-2 previous">&nbsp;</div>')
							.append('<div class="col title" />')
							.append('<div class="col-2 next">&nbsp;</div>'),
			breadcrumbItemTablet  : jQuery('<div class="col title"></div>'),
			breadcrumbItemDesktop : jQuery('<div class="col title"></div>'),

			// page button navigation
			pageButtons    : jQuery('<div class="step-nav"/>'),
			backButton     : jQuery('<button class="step-back">Back</button>'),
			continueButton : jQuery('<button class="step-next">Continue</button>'),

			// Allow configurable button placement
			// valid values are BUTTON_NONE (0), BUTTON_BEFORE (1), BUTTON_AFTER (2), and BUTTON_BOTH (3)
			buttonPlacement : TEGFakePages.BUTTON_AFTER,

			/* Some customizations might need to re-render each
			 * time the page appears. This object allows a custom
			 * installation to define that code.
			 *
			 * The '0' entry below runs for every page. It's a
			 * fair to middling example of how to use this. This
			 * default assumes we're working a donation form.
			 */
			pageChange : {
				'0' : {
					beforeShow : function(pageNumber, pageObject) {
						// clear errors before showing a new page
						pageObject.find(__instance.options.errorSelector).hide();
						return true;
					}, // end beforeShow()
					beforeHide : function(pageNumber, pageObject) {

						// Are we validating?
						if (__instance.options.runValidation === 'none') {
							// If not, just go.
							return true;

						} else {
							// Otherwise, don't leave if errors are visible.
							return pageObject.find(__instance.options.errorSelector).is(':visible');
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
			runValidation      : 'engagingNetworks',
			runValidationTypes : {
				engagingNetworks : {
					nextButtonFunc : function() {
						__instance.#newPageNumber = __instance.#currentPageNumber + 1;
						return true;
					},
					setup          : function() {
						/* Alter EN's submission events to change virtual pages. If
						 * the form is incomplete, there will be empty fields and
						 * EN's code will call this function.
						 */
						window.enOnError = function() {
							// remove the error classes, if any
							__instance.currentPageObject.removeClass(__instance.options.sectionErrorClass);
							__instance.form.removeClass(__instance.options.formErrorClass);

							// highlight errors on the current page
							if (__instance.currentPageObject.find(__instance.options.errorSelector).length > 0) {
								__instance.currentPageObject.addClass(__instance.options.sectionErrorClass);
								__instance.form.addClass(__instance.options.formErrorClass);

							} else {

								// no errors on current page, check if we need to navigate to the next page
								if (__instance.#currentPageNumber < __instance.#lastPageNumber) {
									// make sure error markers are cleared before showing next page
									__instance
											.currentPageObject
											.siblings('section')
											.removeClass(__instance.options.sectionErrorClass)
											.find(__instance.options.errorSelector)
											.remove();
									__instance.goPage(__instance.newPageNumber, false);
								} // end if not last page
							}
						}; // end enOnError()
						window.enOnSubmit = function() {
							// remove the error classes, if any
							__instance.#pageObjects.removeClass(__instance.options.sectionErrorClass);
							__instance.form.removeClass(__instance.options.formErrorClass);

							// are we done?
							if (__instance.#currentPageNumber === 0 ||
							    (__instance.#currentPageNumber === __instance.#lastPageNumber))
							{
								return true;

							} else {
								__instance.goPage(__instance.#newPageNumber);
								return false;
							} // end if we're done
						}; // end enOnSubmit()
					} // end setup()
				}, // end engagingNetworks
				none             : {
					nextButtonFunc : function(event) {
						__instance.nextPage(event);
					}, // end button()
					setup          : function() {
						/* If we're not running validation then
						 * just attach nextPage to the continue
						 * buttons.
						 */
					},
				}, // end none
				custom           : {
					nextButtonFunc : function(event) {
						// default does nothing
					}, // end button()
					setup          : function() {
						// Roll your own.
					}, // end setup()
				}, // end custom
			},
			sectionErrorClass  : 'sectionError', // add this CSS class to a section (page) with errors visible
			formErrorClass     : 'formError', // add this CSS class to the form when there are errors visible

			// preferred window sizes can be set here
			windowSizeOptions : {
				/* mobileMaxWidth : 600,
				 * tabletMinWidth : 599,
				 * tabletMaxWidth : 961,
				 * desktopMinWidth: 968,
				 * tallMinHeight  : 820,
				 * afterWindowSize : function() {},
				 */
			},

			// allow code that runs after all of this
			afterLoad : () => true,
		}; // end TEGFakePages.options
		// override with options from new TEGFakePages() statement
		jQuery.extend(__instance.options, Options);

		// get the form (or page content container) and hide it
		__instance.form = jQuery(__instance.options.formSelector);

		// only continue initializing if the page content exists
		if (__instance.form.length === 0) {
			return false;
		}

		// get the body
		__instance.body = jQuery('body');

		// try to initialize TEGUtilities.windowSize
		if (typeof jQuery.windowSize === 'object') {
			jQuery.windowSize.init(__instance.options.windowSizeOptions);

		} else {

			if (console) {
				console.log('TEG Fake Pages won\'t load without TEG jQuery Utilities.');
			} // end if console available
			return false;
		}

		__instance.#currentPageNumber = __instance.options.currentPageNumber;
		__instance.#newPageNumber = __instance.#currentPageNumber; // we need to pass this into Engaging Network's validation functions

		// Are we generating pages from the structure or from a count of elements?
		if (__instance.options.pageLength > 0) {
			// build from the count of a list of elements
			let thisList   = __instance.form.children(__instance.options.pageStartSelector),
			    thesePages = [];

			// split the full list into chunks of pageLength elements
			for (let counter = 0; counter < thisList.length; counter += __instance.options.pageLength) {
				thesePages.push(thisList.slice(counter, counter + __instance.options.pageLength)
				                        .wrapAll(jQuery('<section/>')
						                                 .addClass(__instance.options.pageItemClass)
						                                 .attr('id', __instance.options.pageIDPrefix + counter))
				);
			} // end loop through list of elements

			// save the number of pages
			__instance.#lastPageNumber = thesePages.length;

			/* If we're adding page buttons and
			 * there are buttons to add and
			 * there is any content to paginate.
			 */
			if (__instance.options.buttonPlacement !== TEGFakePages.BUTTON_NONE &&
			    __instance.options.pageButtons.length > 0 &&
			    __instance.#lastPageNumber > 0)
			{
				// So, should we update the option or create a private member?
				__instance.options.backButton.attr('data-fpbutton', 'back');
				__instance.options.continueButton.attr('data-fpbutton', 'next');

				__instance.options.pageButtons.on('click keydown', (event) => {
					const buttonAction = jQuery(event.target).attr('data-fpbutton') || 'none';

					if (buttonAction === 'back') {
						__instance.previousPage(event);
					}

					if (buttonAction === 'next') {
						__instance.options.runValidationTypes[__instance.options.runValidation].nextButtonFunc(event);
					}
				});

				__instance.options.pageButtons
				          .append(__instance.options.continueButton)
				          .append(__instance.options.backButton);

				// set buttons according to buttonPlacement
				// we know it's not 0, so. . .
				if (__instance.options.buttonPlacement === TEGFakePages.BUTTON_BEFORE ||
				    __instance.options.buttonPlacement === TEGFakePages.BUTTON_BOTH)
				{
					// before or both
					__instance.form.prepend(__instance.options.pageButtons.clone(true));
				}

				if (__instance.options.buttonPlacement === TEGFakePages.BUTTON_AFTER ||
				    __instance.options.buttonPlacement === TEGFakePages.BUTTON_BOTH)
				{
					// both or after
					__instance.form.append(__instance.options.pageButtons.clone(true));
				}
			} // end if adding buttons

		} else {
			// build from page structure
			__instance.#lastPageNumber = jQuery(__instance.options.pageStartSelector)
					.each(function(index) {
						const thisItem  = jQuery(this),
						      thisPage  = jQuery('<section/>')
								      .addClass(__instance.options.pageItemClass)
								      .attr('id', __instance.options.pageIDPrefix + index),
						      container = thisItem.closest(__instance.options.pageItemParentSelector);

						// Check for nested structure from a CMS.
						if (container.length > 0) {
							// if there's parent structure, start there instead.
							thisPage.insertBefore(container);
							container
									.nextUntil(__instance.options.pageItemParentSelector +
									           ':has(' +
									           __instance.options.pageStartSelector +
									           '), ' +
									           __instance.options.pageItemParentSelector +
									           ':has(' +
									           __instance.options.pageExcludeSelector +
									           ')'
									)
									.addBack()
									.appendTo(thisPage);

						} else {
							// If there's no parent structure, just start at the current item.
							thisPage.insertBefore(thisItem);
							thisItem
									.nextUntil(__instance.options.pageStartSelector + ', ' +
									           __instance.options.pageExcludeSelector)
									.addBack()
									.appendTo(thisPage);
						}

						// if we're adding breadcrumbs
						if (__instance.options.breadcrumbs.length > 0) {
							var thisCrumb,
							    thisTitle;

							// select the correct breadcrumb item structure
							if (jQuery.windowSize.isMobile &&
							    __instance.options.breadcrumbItemMobile.length > 0)
							{
								thisCrumb = __instance.options.breadcrumbItemMobile.clone();

							} else {
								if (jQuery.windowSize.isTablet &&
								    __instance.options.breadcrumbItemTablet.length > 0)
								{
									thisCrumb = __instance.options.breadcrumbItemTablet.clone();

								} else {
									if (jQuery.windowSize.isDesktop &&
									    __instance.options.breadcrumbItemDesktop.length > 0)
									{
										thisCrumb = __instance.options.breadcrumbItemDesktop.clone();
									} // end if desktop breadcrumbs
								} // end if tablet breadcrumbs
							} // end if mobile breadcrumbs

							// initialize the title
							if (thisItem.attr('data-breadcrumb') !== undefined) {
								thisTitle = thisItem.attr('data-breadcrumb');

							} else {
								thisTitle = thisItem.html();
							} // end if data-breadcrumb exists

							// add navigation functions
							if (thisCrumb.find('.previous, .next').length > 0) {
								// ostensibly for mobile but anything with .previous or .next
								thisCrumb.find('.previous')
								         .on('click keydown tap', function(event) {
									         // just in case the configuration attaches this to a button element
									         __instance.previousPage(event);
								         });
								thisCrumb.find('.next')
								         .on('click keydown tap', function(event) {

									         /* Make the user click the page buttons to
									          * submit the form for any page validation.
									          */
									         if (jQuery(this).attr('data-visited') === 'true') {
										         __instance.nextPage(event);
									         }
								         });
								thisCrumb
										.attr('data-step', index + 1);

							} else {
								// for views without .previous or .next
								thisCrumb
										.attr('data-step', index + 1)
										.on('click keydown tap', function(event) {
											event.preventDefault();
											event.stopImmediatePropagation();
											var thisStep = jQuery(this);

											/* Make the user click the page buttons to
											 * submit the form for EN native validation.
											 */
											if (thisStep.attr('data-visited') === 'true') {
												__instance.goPage(+thisStep.attr('data-step'));
											}
										});
							} // end if .previous or .next are present

							// set the breadcrumb content
							var titleItem = thisCrumb;

							// check for the 'title' class
							if (!thisCrumb.is('.title')) {
								titleItem = thisCrumb.find('.title');
							}
							titleItem.html(thisTitle);

							// noinspection JSVoidFunctionReturnValueUsed
							__instance
									.options
									.breadcrumbs
									.append(thisCrumb)
									.prependTo(__instance.form);
						} // end breadcrumbs

						// if we're adding page buttons
						if (__instance.options.buttonPlacement > TEGFakePages.BUTTON_NONE &&
						    __instance.options.pageButtons.length > 0)
						{
							var newButtons  = __instance.options
							                            .pageButtons
							                            .clone(),
							    newNext     = __instance.options
							                            .continueButton
							                            .clone()
							                            .on('click keydown', function(event) {
								                            __instance.options.runValidationTypes[__instance.options.runValidation].nextButtonFunc(event);
							                            }),
							    newPrevious = __instance.options
							                            .backButton
							                            .clone()
							                            .on('click keydown', function(event) {
								                            __instance.previousPage(event);
							                            });

							// if first page
							if (index === 0) {
								// first page gets only the continue button
								newButtons.append(newNext);

							} else {

								// otherwise, if last page
								if (thisPage.find(__instance.options.submitSelector).length > 0) {
									// last page gets back button added to submit button
									newButtons.append(thisPage.find(__instance.options.submitSelector))
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

							// set buttons according to buttonPlacement
							// we know it's not 0, so. . .
							if (__instance.options.buttonPlacement % 2 === 1) {
								// before or both
								thisPage.prepend(newButtons);
							}

							if (__instance.options.buttonPlacement === TEGFakePages.BUTTON_AFTER ||
							    __instance.options.buttonPlacement === TEGFakePages.BUTTON_BOTH)
							{
								// both or after
								thisPage.append(newButtons);
							}
						} // end if adding buttons
					})
					.length; // end pageStartSelector.each()
		} // end if building from list count or page content markers
		// create a list of all the new pages
		__instance.#pageObjects = __instance.form.find('[id^="' + __instance.options.pageIDPrefix + '"]');
		// reference to current page
		__instance.#currentPageObject = __instance.#pageObjects
		                                          .eq(__instance.#currentPageNumber - 1)
		                                          .addClass(__instance.options.currentPageClass);

		// Run the setup function for the validation
		__instance.options.runValidationTypes[__instance.options.runValidation].setup();

		// go to the appropriate page
		if (__instance.form.find(__instance.options.errorSelector + ':visible').length > 0) {
			// if there are errors visible, go to the first with those errors
			__instance.errorPage();

		} else {
			// otherwise, go to the (ostensibly) first page
			__instance.goPage(__instance.#currentPageNumber);

			// tell the breadcrumbs (if any) that we've seen the first page viewed
			jQuery('[data-step="' + __instance.#currentPageNumber + '"]').attr('data-visited', 'true');

			// run custom additional code
			__instance.options.afterLoad(__instance.options);
		} // end if errors are visible

	} // end constructor

	static get BUTTON_NONE() { return 0; }

	static get BUTTON_BEFORE() { return 1; }

	static get BUTTON_AFTER() { return 2; }

	static get BUTTON_BOTH() { return 3; }

	// Methods

	get currentPageObject() { return this.#currentPageObject; }

	get currentPageNumber() { return this.#currentPageNumber; }

	get pageObjects() { return this.#pageObjects; }

	get lastPageNumber() { return this.#lastPageNumber; }

	get newPageNumber() { return this.#newPageNumber; }

	/* Start at the specified page number and use
	 * an "internal" variable for the page counter.
	 */
	goPage(page, goPageRunValidation) {
		// We only need the validation steps if validation is globally enabled.
		goPageRunValidation = goPageRunValidation && (typeof this.options.runValidation === 'function');

		// don't go to a page that doesn't exist
		if (page > this.#lastPageNumber) {
			return false;
		}

		/* Don't check validation if:
		 * initial page load
		 * going backward
		 * runValidation is false
		 */
		if (page > this.#currentPageNumber &&
		    goPageRunValidation)
		{

			// if there are any errors from a CMS's field validation or custom validation
			if (this.#currentPageObject.find(this.options.errorSelector).is(':visible')) {
				// do not proceed
				return false;
			}
		}

		// If beforeHide() exists for all pages, run it.
		if (this.options.pageChange['0'].hasOwnProperty('beforeHide')) {
			this.options.pageChange['0'].beforeHide(this.#currentPageNumber, this.#currentPageObject);
		} // end if beforeHide() exists for all pages

		// if beforeHide() exists for current page
		if (this.options.pageChange.hasOwnProperty(this.#currentPageNumber) &&
		    this.options.pageChange[this.#currentPageNumber].hasOwnProperty('beforeHide'))
		{

			// and the function returns false
			if (!this
					.options
					.pageChange[this.#currentPageNumber]
					.beforeHide(this.#currentPageNumber, this.#currentPageObject))
			{
				// do not proceed
				return false;
			} // end if not cleared to leave
		} // end if beforeHide() exists for current page

		// If beforeShow() exists for all pages, run it.
		if (this.options.pageChange['0'].hasOwnProperty('beforeShow')) {
			this.options.pageChange['0'].beforeShow(page, this.#pageObjects.eq(page));
		} // end if beforeShow() exists for all pages

		// If beforeShow() exists for current page
		if (this.options.pageChange.hasOwnProperty(page) &&
		    this.options.pageChange[page].hasOwnProperty('beforeShow'))
		{

			// and the function returns false
			if (!this
					.options
					.pageChange[page]
					.beforeShow(page, this.body.find('section#' + this.options.pageIDPrefix + page)))
			{
				// then skip to the new page with no validation
				this.goPage(this.#currentPageNumber + 1, false);
				// and do not proceed
				return false;
			} // end if not cleared to leave
		} // endif beforeShow() exists for current page

		// set new step number
		this.#currentPageNumber = +page;
		// set current page pointer
		this.#pageObjects.removeClass('current');
		this.#currentPageObject = this.#pageObjects.eq(this.#currentPageNumber - 1);
		// mark the current page for CSS styles
		this.#pageObjects.removeClass(this.options.currentPageClass);
		this.#currentPageObject.addClass(this.options.currentPageClass);

		// highlight correct breadcrumb and mark as visited
		if (this.options.breadcrumbs.length > 0) {
			this
					.options
					.breadcrumbs
					.find('[data-step]')
					.each(function(index, item) {
						var thisCrumb = jQuery(item);

						thisCrumb
								.removeClass('current past');
						if (+thisCrumb.attr('data-step') < this.#currentPageNumber) {
							thisCrumb
									.addClass('past');

						} else {
							if (+thisCrumb.attr('data-step') === this.#currentPageNumber) {
								thisCrumb
										.addClass('current')
										.attr('data-visited', 'true');
							}
						}
					}.bind(this));
		} // end if breadcrumbs exist

		// show the top of the form page on mobile phones
		if (jQuery.windowSize.isMobile) {

			// if breadcrumbs exist scroll there
			if (this.options.breadcrumbs.length > 0) {
				jQuery('html, body').animate({scrollTop : this.options.breadcrumbs.offset().top}, 500);

			} else {
				// otherwise scroll to the top
				jQuery('html, body').animate({scrollTop : 0}, 500);

			} // end if breadcrumbs exist
		} // end if phone
	}; // end goPage()

	// navigate to the next page
	nextPage(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
		this.#newPageNumber = this.#currentPageNumber + 1;
		this.goPage(this.#newPageNumber, false);
	}; // end nextPage()

	// navigate to the prvious page
	previousPage(event) {
		// Never validate if navigating backward.
		event.preventDefault();
		event.stopImmediatePropagation();

		// only go backward if not first step
		if (this.#currentPageNumber > 1) {
			this.#newPageNumber = this.#currentPageNumber - 1;
			this.goPage(this.#newPageNumber, false);
		} // end if first step
	}; // end previousPage()

	// navigate to the first page with an error showing
	errorPage() {

		// loop through the pages looking for a CMS generated error message
		for (var counter = 0; counter < this.#pageObjects.length; counter++) {

			if (this.#pageObjects.eq(counter).find(this.options.errorSelector).length > 0) {
				// go page uses page numbers rather than array offsets
				this.goPage(counter + 1, false);
				break;
			} // end if this page has visible errors
		} // end loop through pages
	}; // end errorPage
} // end TEGFakePages
