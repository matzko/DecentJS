Decent JS: A Good-Enough JavaScript Library
===========================================

Decent JS includes several libraries:

## DecentJS Core

## Autosuggest

## Faux Selects

Faux selects allows you to imitate `<select>` elements in order to customize styling across browsers.

Use like so:

```javascript
DecentJS(Decent.gebid('id-of-select')).fauxSelect();
```

This will generate HTML for the faux select element and insert it before the actual select element:

```html
<div tabindex="0" class="faux-select-wrapper">
	<ul class="faux-select faux-unfocused faux-unopened" id="faux-select-gender-select">
		<li class="faux-option" data-value="">Gender:</li>
		<li class="faux-option" data-value="1">male</li>
		<li class="faux-option" data-value="2">female</li>
	</ul>
	<span class="faux-selection-indicator">Gender:</span>
</div>
<select class="faux-select-original" id="gender-select" name="gender">
	<option value="">Gender:</option>
	<option value="1">male</option>
	<option value="2">female</option>
</select>
```

You can then use CSS to style the appearance of your faux select list.  Here is some example CSS, which provides basic styling:

```css
.faux-select-wrapper {
	position:relative;
	z-index:960;
}

.faux-selection-indicator {
	background-color:#fff;
	border:1px solid #ccc;
	display:block;
	line-height:1em;
	padding:.5em 1em .5em .5em;
	position:absolute;
	top:0;
	left:0;
	width:5em;
	z-index:980;
}

.faux-selection-indicator:after {
	content:"\25BE";
	display:block;
	padding:.5em;
	position:absolute;
	right:0;
	top:0;
}

.faux-select {
	background-color:#fff;
	border:1px solid #ccc;
	color:#000;
	cursor:default;
	display:block;
	margin:0;
	max-height:20em;
	overflow-y:scroll;
	padding:0;
	position:absolute;
	top:2em;
	left:0;
	z-index:970;
}

.faux-unopened {
	display:none;
}

.faux-select li {
	background-color:#fff;
	display:block;
	line-height:1em;
	list-style-type:none;
	padding:.5em;
	width:5em;
}

.faux-select li.faux-selected {
	z-index:999;
}

.faux-opened li:hover,
.faux-opened li.faux-selected {
	background-color:#000;
	color:#fff;
}

.faux-unopened .faux-option {
	position:absolute;
}

select.faux-select-original {
	display:none !important;
}

/* Show the client-provided select elements for small-screen devices. */
@media only screen and (max-width: 33.00em) {
	select.faux-select-original {
		display:block !important;
	}
	.faux-select-wrapper {
		display:none;
	}
}
```

## Testing

You can execute the jasmine test like so:

```shell
grunt jasmine
```
