### TEG Fake Pages

Collects portions of page content into &quot;pages&quot; and generates navigaton to show those pages sequentially. The library also provides hooks to perform per-page validation and halt navigation if necessary.

## Requires

* jQuery 3.5.1
* jQuery Debounce by Dimitry Filatov
* TEG jQuery Utilities v2

## Provided

* TQPages.js

  Creates additional HTML structure and adds JavaScript powered navigation between pages.


* TQPages.css

  Baseline styles necessary to make the page swapping work.

## Installation

Link the styles and JavaScript in the `<head>` element of the page. 

```
<link rel="stylesheet" href="https://foo.bar.com/path/to/files/TEGFakePages.css" />
<script src="https://foo.bar.com/path/to/files/jquery-3.5.0.min.js" type="text/javascript"></script>
<script src="https://foo.bar.com/path/to/files/TEGUtilities.js" type="text/javascript"></script>
<script src="https://foo.bar.com/path/to/files/TEGFakePages.js" type="text/javascript"></script>
```

Initialize the pagination in a `script` element or `.js` file.

```
<script>
   window.thesePages = new TEGFakePages()
</script>
```