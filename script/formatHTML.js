!function(){
"use strict";

(window.HTMLStudio=window.HTMLStudio||{}).formatHTML={};

var eventArray = ['afterprint','beforeprint','beforeunload','hashchange','languagechange','message','offline','online','pageshow','pagehide','popstate','storage','unload','copy','cut','paste','abort','blur','focus','canplay','canplaythrough','change','click','contextmenu','dblclick','drag','dragend','dragenter','dragexit','dragleave','dragover','dragstart','drop','durationchange','emptied','ended','input','invalid','keydown','keypress','keyup','load','loadeddata','loadedmetadata','loadend','loadstart','mousedown','mouseenter','mouseleave','mousemove','mouseout','mouseover','mouseup','pause','play','playing','progress','ratechange','reset','resize','scroll','seeked','seeking','select','show','stalled','submit','suspend','timeupdate','volumechange','waiting','selectstart','toggle','mozfullscreenchange','mozfullscreenerror','animationend','animationiteration','animationstart','transitionend','webkitanimationend','webkitanimationiteration','webkitanimationstart','webkittransitionend','error','wheel','rejectionhandled','unhandledrejection','cancel','close','cuechange','mousewheel','auxclick','pointercancel','pointerdown','pointerenter','pointerleave','pointermove','pointerout','pointerover','pointerup','beforecopy','beforecut','beforepaste','search','webkitfullscreenchange','webkitfullscreenerror','gotpointercapture','lostpointercapture','activate','beforeactivate','deactivate','beforedeactivate','mscontentzoom','msmanipulationstatechanged','ariarequest','command','msgesturechange','msgesturedoubletap','msgestureend','msgesturehold','msgesturestart','msgesturetap','msinertiastart'],
	attrArray = [['class'],['id'],['style'],['title'],['lang'],['dir'],['span',1,'colgroup'],['colspan',1,'td'],['colspan',1,'th'],['rowspan',1,'td'],['rowspan',1,'th'],['method','get','form'],['type','text','input'],['type','list','menu'],['type','text/javascript','script'],['type','text/css','style']],
	newLineRegex = /\n(?=.*?\n)/g,
	entityRegex = /[^\w \t\n~!@#$%^&*()`\-_=+{0}[\]|\/\\:;"'<,>.?]/,
	encodeEntities = function(node, bool) {
		if (node.parentNode.nodeName in {STYLE:0,SCRIPT:0}) return node.textContent;
		var textcontent = node.textContent
		textcontent = textcontent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		if (!bool) return textcontent;
		textcontent = textcontent.replace(/\u00a0/g, '&nbsp;');
		var match;
		while (match = textcontent.match(entityRegex)) {
			match = [match[0].charCodeAt(0)];
			match[1] = match[0].toString(16);
			textcontent = textcontent.replace(new RegExp('\\u' + ('0000' + match[1]).substring(match[1].length), 'g'), '&#' + match[0] + ';');
		}
		return textcontent;
	},
	trim = function(string) {
		return string.replace(/^[ \t\n]*/,'').replace(/[ \t\n]*$/,'');
	};

HTMLStudio.formatHTML.minify=function(encodeEntitiesBool, node){
	var html = node || document.getElementById('frame').contentWindow.document.documentElement,
		frag = document.createDocumentFragment(),
		string = '';

	function minify(node, parent) {
		var clone = node.cloneNode();
		parent.insertBefore(clone, parent.firstChild);
		for (var children = node.childNodes, i = children.length - 1; i >= 0; i--) {
			// Child is element node
			if (children[i].nodeType == 1) {
				// Repeat the cloning process for the child element
				var childClone = minify(children[i], clone);
				// Remove redundant attributes
				attrArray.forEach(function(attr) {
					if (childClone.getAttribute(attr[0]) == (attr[1] || '') && (!attr[2] || childClone.nodeName.toLowerCase() == attr[2])) childClone.removeAttribute(attr);
				});
				// Remove blank event listeners
				eventArray.forEach(function(attr) {
					if (childClone.getAttribute('on' + attr) == '') childClone.removeAttribute('on' + attr);
				});

			// Child is text node
			} else if (children[i].nodeType == 3) {
				// If the parent node is a <style> or a <script>, don't try to shorten the whitespace
				if (clone.nodeName == 'SCRIPT') {
					clone.insertBefore(children[i].cloneNode(), clone.firstChild);
					continue;
				} else if (clone.nodeName == 'STYLE') {
					var sheet = node.sheet,
						text = '';
					for (var n = sheet.cssRules.length - 1; n >= 0; n--) {
						if (sheet.cssRules[n].style.length == 0) continue;
						text =  '}' + text;
						for (var j = sheet.cssRules[n].style.length - 1, q = j; j >= 0; j--) {
							text = sheet.cssRules[n].style[j] + ':' + sheet.cssRules[n].style[sheet.cssRules[n].style[j]] + (j == q ? '' : ';') + text;
						}
						text = sheet.cssRules[n].selectorText + '{' + text;
					}
					clone.insertBefore(document.createTextNode(text), clone.firstChild);
					continue;
				}

				// `styles` checks the parent's white-space
				// `childClone` is the clone we are working with
				var styles = getComputedStyle(node), childClone = children[i].cloneNode();
				// Collapse new lines
				if (styles.whiteSpace in {normal:0,nowrap:0}) childClone.textContent = childClone.textContent.replace(/\n/g,' ');
				// Collapse tabs, spaces, etc.
				if (styles.whiteSpace in {normal:0,nowrap:0,'pre-line':0}) childClone.textContent = childClone.textContent.replace((children[i].textContent.trim() ? /^[^\S\n]|[^\S\n]$/ : /[^\S\n]+/g),' ');
				// If the textnode has no content, don't even add it to the parent
				if (childClone.textContent) clone.insertBefore(childClone, clone.firstChild);
			}
		}
		return clone;
	}

	function escape(node) {
		if (node.parentNode.nodeName in {STYLE:0,SCRIPT:0}) return node.textContent;
		var a = document.createElement('a');
		a.innerText = node.textContent;
		return a.innerHTML;
	}

	function stringify(node) {
		string += '<' + node.nodeName.toLowerCase();
		// Sorts attrs so that they are always revere-alphabetically ordered
		// Helps with comparing strings since attribute order won't be considered like this
		var attrs = Array.prototype.slice.call(node.attributes);
		attrs.sort(function(a,b) {
			return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
		});
		for (var i = attrs.length - 1; i >= 0; i--) {
			if (node.attributes[i].name == 'style') {
				string += ' style="' + node.attributes[i].value.trim().replace(/;$/,'').replace(/&/g,'&amp;').replace(/"/g,'&#34;') + '"';
				continue;
			} else if (node.attributes[i].name == 'class') {
				string += ' class="' + node.attributes[i].value.trim().replace(/\s+/g,' ') + '"';
				continue;
			}
			string += ' ' + node.attributes[i].name + (node.attributes[i].value == '' ? '' : '="' + node.attributes[i].value.replace(/&/g,'&amp;').replace(/"/g,'&#34;') + '"');
		}
		string += '>';

		if (/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i.test(node.nodeName)) return string;

		for (var children = node.childNodes, i = 0; i < children.length; i++) {
			if (children[i].nodeType == 1) stringify(children[i]);
			else if (children[i].nodeType == 3) string += encodeEntities(children[i], encodeEntitiesBool);
		}

		return string += '</' + node.nodeName.toLowerCase() + '>';
	}
	return stringify(minify(html, frag)).trim();
}

HTMLStudio.formatHTML.prettify=function(node,onlyChildren,encodeEntitiesBool,indentationStr){
	if (node && typeof node === 'object') {
		if (!node.ownerDocument || !(node instanceof node.ownerDocument.defaultView.Element || node instanceof Element)) {
			indentationStr = node.indentation;
			encodeEntitiesBool = node.encodeEntities;
			onlyChildren = node.onlyChildren;
			node = node.node;
		}
		if (!node) return HTMLStudio.formatHTML.prettify(document.getElementById('frame').contentWindow.document.documentElement, onlyChildren, encodeEntitiesBool, indentationStr);
		// Return normal outerHTML if there are no children
		if (!node.childNodes.length) return onlyChildren ? '' : node.outerHTML;
		// Find indentation based on the node's first child (if it's a text node)
		var indentation = indentationStr || '\t';
		if (node.firstChild.nodeType == 3 && !indentationStr) indentation = node.firstChild.textContent.match(/^(?:\t|    |  |)/)[0] || indentation;

		// Set up string to add on to
		var html = '';

		function stringify(node, indentLvl, isFirst) {
			// Stringify elements
			if (node.nodeType == 1) {
				// Special case for onlyChildren == true
				if (isFirst && onlyChildren) {
					// Return immediately for empty elements
					if (/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i.test(node.nodeName) || !node.childNodes.length) return false;

					// Iterate through the child nodes
					for (var i = 0; i < node.childNodes.length; i++) {
						stringify(node.childNodes[i], 0)
					}
					return true;
				}

				// Account for self-closing elements
				if (/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i.test(node.nodeName)) {
					var ws = node.parentNode.style ? node.parentNode.style.whiteSpace || getComputedStyle(node.parentNode).whiteSpace : 'normal';
					html += ((ws == 'normal' || ws == 'nowrap') && node.previousSibling && node.previousSibling.nodeType == 3 && !trim(node.previousSibling.textContent[node.previousSibling.textContent.length - 1] || '') ? '\n' : '') + ((ws == 'normal' || ws == 'nowrap') && node.previousSibling && node.previousSibling.nodeType == 3 && !trim(node.previousSibling.textContent[node.previousSibling.textContent.length - 1] || '') ? indentation.repeat(indentLvl) : ws == 'pre-line' && node.previousSibling && node.previousSibling.nodeType == 3 && /\n$/.test(node.previousSibling.textContent.replace(/[ \t]*$/,'')) ? indentation.repeat(indentLvl) : '') + '<' + node.nodeName.toLowerCase();
					// Put attributes in element tag
					for (var i = 0; i < node.attributes.length; i++) {
						if (node.attributes[i].name == 'class' && node.attributes[i].value.trim()) {
							html += ' class="' + node.attributes[i].value.trim().replace(/\s+/g,' ') + '"';
							continue;
						}
						// If the attribute has an actual value
						if (node.attributes[i].value) html += ' ' + node.attributes[i].name + '="' + node.attributes[i].value.replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '"';
						// If the attribute value is empty
						else html += ' ' + node.attributes[i].name;
					}
					html += '>';
					return node.previousSibling && node.previousSibling.nodeType == 3 && node.previousSibling.textContent;
				}

				// Continue for normal elements
				var ws = node.parentNode.style ? node.parentNode.style.whiteSpace || getComputedStyle(node.parentNode).whiteSpace : 'normal';
				html += ((ws == 'normal' || ws == 'nowrap') && node.previousSibling && node.previousSibling.nodeType == 3 && !trim(node.previousSibling.textContent[node.previousSibling.textContent.length - 1] || '') ? '\n' : '') + ((ws == 'normal' || ws == 'nowrap') && node.previousSibling && node.previousSibling.nodeType == 3 && !trim(node.previousSibling.textContent[node.previousSibling.textContent.length - 1] || '') ? indentation.repeat(indentLvl) : ws == 'pre-line' && node.previousSibling && node.previousSibling.nodeType == 3 && /\n$/.test(node.previousSibling.textContent.replace(/[ \t]*$/,'')) ? indentation.repeat(indentLvl) : '') + '<' + node.nodeName.toLowerCase();
				// Put attributes in element tag
				for (var i = 0; i < node.attributes.length; i++) {
					if (node.attributes[i].name == 'class' && node.attributes[i].value.trim()) {
						html += ' class="' + node.attributes[i].value.trim().replace(/\s+/g,' ') + '"';
						continue;
					}
					// If the attribute has an actual value
					if (node.attributes[i].value) html += ' ' + node.attributes[i].name + '="' + node.attributes[i].value.replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '"';
					// If the attribute value is empty
					else html += ' ' + node.attributes[i].name;
				}
				html += '>';

				// Put child nodes into element before closing it
				if (node.childNodes) {
					// Keep track of whether to add another line after appending the child nodes
					var hasNewLine = false;
					// Iterate through the child nodes
					for (var i = 0; i < node.childNodes.length; i++) {
						hasNewLine = stringify(node.childNodes[i], indentLvl + 1) ? true : hasNewLine;
					}
					// If a new line is required
					if (hasNewLine && (node.style.whiteSpace || getComputedStyle(node).whiteSpace) in {normal:0,nowrap:0}) {
						html += '\n' + indentation.repeat(indentLvl);
					}
				}

				// Add closing tag
				html += '</' + node.nodeName.toLowerCase() + '>';

				return node.previousSibling && node.previousSibling.nodeType == 3 && node.previousSibling.textContent;
			}
			// Stringify text nodes
			else if (node.nodeType == 3) {
				// Special case for <style> and <script> text nodes
				if (node.parentNode.nodeName in {STYLE:0,SCRIPT:0}) {
					if (node.parentNode.nodeName == 'SCRIPT') {
						html += node.textContent;
						return false;
					} else if (node.parentNode.sheet) {
						var sheet = node.parentNode.sheet,
							text = '';
						for (var i = sheet.cssRules.length - 1; i >= 0; i--) {
							if (sheet.cssRules[i].style.length == 0) continue;
							text =  '}' + text;
							for (var n = sheet.cssRules[i].style.length - 1; n >= 0; n--) {
								text = '\t' + sheet.cssRules[i].style[n] + ': ' + sheet.cssRules[i].style[sheet.cssRules[i].style[n]] + ';\n' + indentation.repeat(indentLvl) + text;
							}
							text = (i ? '\n\n' : '\n') + indentation.repeat(indentLvl) + sheet.cssRules[i].selectorText + ' {\n' + indentation.repeat(indentLvl) + text;
						}
						html += text;
						return true;
					} else {
						html += node.textContent;
						return false;
					}
				}
				var ws = node.parentNode.style.whiteSpace || getComputedStyle(node.parentNode).whiteSpace;
				// Allow formatting of text
				if (ws == 'normal' || ws == 'nowrap') {
					// Ignore all-whitespace text nodes unless it has 2+ line breaks
					if (!trim(node.textContent)) {
						// Don't get rid of all whitespace if this text node is the only child
						if (node.parentNode.firstChild == node && node.parentNode.lastChild == node) {
							html += ' ';
							return false;
						}
						var addedText = '\n'.repeat((node.textContent.match(newLineRegex) || {length:0}).length);
						html += addedText;
						return !!addedText;
					}
					// Continue if the text node has actual non-whitespace content
					// If the text is surrounded by whitespace, give it it's own line
					if (!trim(node.textContent[0]) && !trim(node.textContent[node.textContent.length - 1])) {
						html += '\n' + indentation.repeat(indentLvl) + trim(encodeEntities(node, encodeEntitiesBool)).replace(new RegExp('\\n(' + indentation.repeat(indentLvl) + '|)','g'), '\n' + indentation.repeat(indentLvl));
						return true;
					}
					// Continue if the text node isn't surrounded by whitespace
					// Collapse surroundng whitespace (present on only one side of the text, or none)
					if (!trim(node.textContent[0])) html += trim(node.textContent).includes('\n') ? '\n' + indentation.repeat(indentLvl) : ' ';
					html += trim(encodeEntities(node, encodeEntitiesBool)).replace(new RegExp('\\n(' + indentation.repeat(indentLvl) + '|)','g'), '\n' + indentation.repeat(indentLvl));
					if (!trim(node.textContent[node.textContent.length - 1])) {
						if (trim(node.textContent).includes('\n')) return true;
						html += ' ';
					}
					return false;
				// Pre white-space doesn't allow for text formatting; keep exactly as-is
				} else if (ws == 'pre-wrap' || ws == 'pre') {
					html += encodeEntities(node, encodeEntitiesBool);
					return false;
				// White-space == 'pre-line'; keep same line-breaks, format indentation
				} else {
					html += encodeEntities(node, encodeEntitiesBool).replace(/^[ \t]*/,'').replace(/\n[ \t]*/g,'\n' + indentation.repeat(indentLvl)).replace(/[ \t]*($|\n)/g,'$1');
					return false;
				}
			}
			// Stringify comment node
			else if (node.nodeType == 8) {
				var ws = node.parentNode.style.whiteSpace || getComputedStyle(node.parentNode).whiteSpace;
				html += ((ws == 'normal' || ws == 'nowrap') && node.previousSibling && node.previousSibling.nodeType == 3 && !trim(node.previousSibling.textContent[node.previousSibling.textContent.length - 1] || '') ? '\n' + indentation.repeat(indentLvl) : ws == 'pre-line' && node.previousSibling && node.previousSibling.nodeType == 3 && /\n$/.test(node.previousSibling.textContent.replace(/[ \t]*$/,'')) ? indentation.repeat(indentLvl) : '') + '<!--' + node.textContent + '-->';
				// Allow next text nodes to get a new line
				if (node.nextSibling && node.nextSibling.nodeType == 3 && ws == 'normal' || ws == 'nowrap' && trim(node.nextSibling.textContent[0])) {
					node.nextSibling.textContent = ' ' + node.nextSibling.textContent + ' ';
				}
				return (ws == 'normal' || ws == 'nowrap') && node.nextSibling && node.nextSibling.nodeType == 3 && node.nextSibling.textContent;
			}
		}

		var forcePrettyPrint = node.querySelectorAll('html head, html body, head *');
		for (var i = forcePrettyPrint.length - 1; i >= 0; i--) {
			if (forcePrettyPrint[i].previousSibling && forcePrettyPrint[i].previousSibling.nodeType == 3 && trim(forcePrettyPrint[i].previousSibling.textContent[forcePrettyPrint[i].previousSibling.textContent.length - 1])) continue;
			if (forcePrettyPrint[i].previousSibling && forcePrettyPrint[i].previousSibling.nodeType == 3) forcePrettyPrint[i].previousSibling.textContent += ' ';
			else forcePrettyPrint[i].parentNode.insertBefore(document.createTextNode(' '), forcePrettyPrint[i]);
		}

		stringify(node, 0, true);

		return trim(html);
	} else return HTMLStudio.formatHTML.prettify(document.getElementById('frame').contentWindow.document.documentElement, onlyChildren, typeof node == 'boolean' ? node : false);
}

}();