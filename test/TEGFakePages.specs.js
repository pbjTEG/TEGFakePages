describe('TEGFakePages', function() {

	beforeAll(function() {
		window.testEvent = new Event('test event');
		window.fakePageOptions = {
			formSelector          : 'form[action="#"]',
			currentPageNumber     : 2,
			pageItemParentSelector: '.itemParent',
			submitSelector        : 'input[type="submit"]',
			runValidation         : 'custom',
			runValidationTypes    : {
				custom: {
					nextButtonFunc: function(event) {
						if (event.type !== 'test event') {
							event.preventDefault();
							event.stopImmediatePropagation();
						}
						testForm.nextPage(event);
						return 'custom.nextButtonFunc()';
					},
					setup         : function() {
						return 'custom.setup()';
					},
				},
			},
			windowSizeOptions     : {
				mobileMaxWidth : 1,
				tabletMinWidth : 2,
				tabletMaxWidth : 3,
				desktopMinWidth: 4,
				tallMinHeight  : 5,
				// allow customizable callback
				afterWindowSize: function() {
					return 'afterWindowSize() has run';
				}, // end afterWindowSize()
			},
			errorSelector         : '.testError',
			breadcrumbs           : jQuery('<div id="breadcrumbs" class="row"></div>'),
			breadcrumbItemDesktop : jQuery('<div class="col title breadcrumbItem"></div>'),
			pageChange :{
				'1': {
					beforeHide: (pageNumber, pageObject, fakePages) => {
						// skip page two if green
						if (document.querySelector('#radio213').checked) {
							setTimeout(() => {fakePages.nextPage.call(fakePages)}, 100);
						}
						return true;
					},
				}
			},
			afterLoad             : function() {
				return 'afterLoad() has run';
			}
		};
		spyOn(window.fakePageOptions, 'afterLoad').and.callThrough();
		spyOn(window.fakePageOptions.runValidationTypes.custom, 'nextButtonFunc').and.callThrough();
		spyOn(window.fakePageOptions.runValidationTypes.custom, 'setup').and.callThrough();
		spyOn(window.fakePageOptions.windowSizeOptions, 'afterWindowSize').and.callThrough();

		window.testForm = new TEGFakePages(window.fakePageOptions);
		window.launchCurrentPage = window.testForm.currentPageObject.attr('id');
	});

	describe('form', function() {
		it('should exist', function() {
			expect(window.testForm.form.length).toBe(1);
		}); // end form should exist
	}); // end describe('form')

	describe('currentPageNumber', function() {
		it('should be 2', function() {
			window.testForm.goPage(2, false);
			expect(window.testForm.currentPageNumber).toBe(2);
		}); // end currentPageNumber should be 2
	}); // end describe('currentPageNumber')

	describe('newPageNumber', function() {
		it('should be 2', function() {
			window.testForm.goPage(2, false);
			window.testForm.nextPage(window.testEvent);
			expect(window.testForm.newPageNumber).toBe(3);
		}); // end newPageNumber should be 2
	}); // end describe('newPageNumber')

	describe('lastPageNumber', function() {
		it('should be 3', function() {
			expect(window.testForm.lastPageNumber).toBe(3);
		}); // end lastPageNumber should be 3
	}); // end describe('lastPageNumber')

	describe('pageObjects', function() {
		it('should have three objects', function() {
			// noinspection JSUnresolvedVariable
			expect(window.testForm.pageObjects.length).toBe(3);
		}); // end pageObjects should be 3
	}); // end describe('pageObjects')

	describe('currentPageObject at launch', function() {
		it('should be page two', function() {
			expect(window.launchCurrentPage).toBe('step1');
		}); // end currentPage should be 2
	}); // end describe('currentPage')

	describe('Last Page', function() {
		it('should have two buttons', function() {
			expect(testForm.pageObjects.eq(2).find('button, input[type="submit"]').length).toBe(2);
		}); // end Last Page shoud have two buttons
	}); // end describe('Last Page')

	describe('afterLoad', function() {
		it('should be called', function() {
			expect(window.testForm.options.afterLoad).toHaveBeenCalled();
		}); // end afterLoad should be called
		it('should be custom', function() {
			expect(window.testForm.options.afterLoad()).toBe('afterLoad() has run');
		}); // end afterLoad should be custom
	}); // end describe('afterLoad')

	describe('runValidation', function() {
		it('should be "custom"', function() {
			expect(window.testForm.options.runValidation).toBe('custom');
		}); // end runValidation should be custom
	}); // end describe('runValidation')

	describe('runValidationTypes', function() {
		it('setup() should be called and custom', function() {
			/* These need to be run in this order so that toHaveBeenCalled
			 * detects the call run during setup process.
			 */
			expect(window.testForm.options.runValidationTypes[window.testForm.options.runValidation].setup).toHaveBeenCalled();
			expect(window.testForm.options.runValidationTypes[window.testForm.options.runValidation].setup()).toBe('custom.setup()');
		}); // end setup should be called
		it('nextButtonFunc() should be called', function() {
			window.testForm.goPage(1, false);
			window.testForm.currentPageObject.find('.step-next')[0].click(window.testEvent);
			expect(window.testForm.options.runValidationTypes[window.testForm.options.runValidation].nextButtonFunc).toHaveBeenCalled();
		}); // end runValidation should be called
		it('nextButtonFunc() should be custom', function() {
			expect(window.testForm.options.runValidationTypes[window.testForm.options.runValidation].nextButtonFunc(window.testEvent)).toBe('custom.nextButtonFunc()');
		}); // end nextButtonFunc() should be custom
	}); // end describe('runValidation')

	describe('windowSize', function() {

		it('should initialize', function() {
			expect(jQuery.windowSize.options.afterWindowSize).toHaveBeenCalled();
			expect(jQuery.windowSize.options.afterWindowSize()).toBe('afterWindowSize() has run');
			expect(jQuery.windowSize.options.mobileMaxWidth).toBe(1);
			expect(jQuery.windowSize.options.tabletMinWidth).toBe(2);
			expect(jQuery.windowSize.options.tabletMaxWidth).toBe(3);
			expect(jQuery.windowSize.options.desktopMinWidth).toBe(4);
			expect(jQuery.windowSize.options.tallMinHeight).toBe(5);
		});
	}); // end describe('windowSize')

	describe('Breadcrumbs', function() {
		it('should exist', function() {
			expect(jQuery('#breadcrumbs').length).toBe(1);
			expect(jQuery('.breadcrumbItem').length).toBe(3);
		}); // end Breadcrumbs should exist
		it('should match pages', function() {
			window.testForm.goPage(2, false);
			let breadcrumbItems = jQuery('.breadcrumbItem');
			expect(breadcrumbItems.eq(0).is('.past')).toBe(true);
			expect(breadcrumbItems.eq(1).is('.current')).toBe(true);
			expect(breadcrumbItems.eq(2).is(':not(.past)')).toBe(true);
			expect(breadcrumbItems.eq(2).is(':not(.current)')).toBe(true);
		}); // end Breadcrumbs should match pages
	}); // end describe('Breadcrumbs')

	describe('nextPage()', function() {
		it('should go to next page', function() {
			window.testForm.goPage(1, false);
			window.testForm.nextPage(window.testEvent);
			expect(window.testForm.currentPageNumber).toBe(2);
			expect(window.testForm.newPageNumber).toBe(2);
			expect(window.testForm.currentPageObject.attr('id')).toBe('step1');
		}); // end nextPage() should go to next page
	}); // end describe('nextPage()')

	describe('previousPage()', function() {
		it('should go to previous page', function() {
			window.testForm.goPage(3, false);
			window.testForm.previousPage(window.testEvent);
			expect(window.testForm.currentPageNumber).toBe(2);
			expect(window.testForm.newPageNumber).toBe(2);
			expect(window.testForm.currentPageObject.attr('id')).toBe('step1');
		}); // end previousPage() should go to next page
	}); // end describe('previousPage()')

	describe('errorPage()', function() {
		it('should find the page with errors', function() {
			window.testForm.pageObjects.eq(2).append('<span class="testError">test error</span>');
			window.testForm.goPage(1, false);
			window.testForm.errorPage();
			expect(window.testForm.currentPageNumber).toBe(3);
			expect(window.testForm.currentPageObject.attr('id')).toBe('step2');
		}); // end errorPage() should find the page with errors
	}); // end describe('errorPage()')

	describe('pageChange callbacks', function () {
		it('should contain a custom entry', function () {
			expect(typeof window.testForm.options.pageChange?.['1']?.beforeHide).toBe('function');
		});
		it('should contain the default "0" entry', function () {
			expect(typeof window.testForm.options.pageChange?.['0']?.beforeHide).toBe('function');
			expect(typeof window.testForm.options.pageChange?.['0']?.beforeShow).toBe('function');
		});

		describe('funcionality', function () {
			beforeAll(() => {
				spyOn(window.testForm.options.pageChange['1'], 'beforeHide').and.callThrough();
				spyOn(window.testForm.options.pageChange['0'], 'beforeHide').and.callThrough();
				spyOn(window.testForm.options.pageChange['0'], 'beforeShow').and.callThrough();
				window.testForm.goPage(1, false);
				document.querySelector('#radio213').click();
				document.querySelector('#step0 button.step-next').click();
			});
			it('should run the "0" entries', function () {
				expect(window.testForm.options.pageChange['0'].beforeHide).toHaveBeenCalled();
				expect(window.testForm.options.pageChange['0'].beforeShow).toHaveBeenCalled();
			});
			it('should run the "1" entry', function () {
				expect(window.testForm.options.pageChange['1'].beforeHide).toHaveBeenCalled();
				expect(window.testForm.currentPageNumber).toBe(2);
				expect(window.testForm.currentPageObject.is('#step1')).toBeTrue();
			});
		});
	});
}); // end describe('TEGFakePages')
