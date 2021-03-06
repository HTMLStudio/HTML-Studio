!function() {
	var symbol = Symbol();

	(window.HTMLStudio = window.HTMLStudio || {}).ContextMenu = function ContextMenu (args) {
		function close() {
			if (this.parentNode) this.parentNode.removeChild(this);
			Array.prototype.forEach.call(this.children, function(child) {
				if (child.nodeName == 'LI') {
					child.style.backgroundColor = '';
					child.style.whiteSpace = 'nowrap';
					child.style.height = '1.4em';
					if (child.arg.subcontext) {
						for (var i = child.children.length - 1; i >= 0; i--) {
							if (child.children[i].className.includes('subcontextmenu')) child.removeChild(child.children[i]);
						}
					}
				}
			});
		}

		function keyEvents(e) {
			if (e.keyCode == 40) {
				e.stopPropagation();
				// Get items in context menu that are focusable (i.e. discard elements that are display:none from `hideOnDisabled`)
				var focusable = [];
				for (var i = this.root.context.items.length - 1; i >= 0; i--) {
					if (!this.root.context.items[i].disabled || !this.root.context.items[i].arg.hideOnDisabled) focusable.push(this.root.context.items[i]);
				}
				// Get the current focused element
				var index = focusable.indexOf(this);
				if (!~index) return;
				// Focus the next one, the pseudoParent, or the first item in the context menu
				(focusable[index + 1] || this.root.context.argument.pseudoParent || focusable[0]).focus();
			} else if (e.keyCode == 38) {
				e.stopPropagation();
				var focusable = [];
				for (var i = this.root.context.items.length - 1; i >= 0; i--) {
					if (!this.root.context.items[i].disabled || !this.root.context.items[i].arg.hideOnDisabled) focusable.push(this.root.context.items[i]);
				}
				var index = focusable.indexOf(this);
				if (!~index) return;
				(focusable[index - 1] || this.root.context.argument.pseudoParent || focusable[focusable.length - 1]).focus();
			} else if (e.keyCode == 39 && this.arg.subcontext) {
				if (!this.subcontext) return;
				e.stopPropagation();
				for (var i = this.subcontext.items.length - 1; i >= 0; i--) {
					if (!this.subcontext.items[i].disabled) return this.subcontext.items[i].focus();
				}
				for (var i = this.subcontext.items.length - 1; i >= 0; i--) {
					if (!this.subcontext.items[i].arg.hideOnDisabled) return this.subcontext.items[i].focus();
				}
			} else if (e.keyCode == 37 && this.root.parent && this.root.parent.className.includes('contextmenuitem')) {
				e.stopPropagation();
				this.root.parent.focus();
			}
		}

		this.argument = args;
		this.node = document.createElement('ul');
		this.node[symbol] = symbol;
		this.close = close.bind(this.node);
		this.node.close = close.bind(this.node);
		this.node.root = this.node;
		this.id = this.node.id = 'context-' + new Date().getTime().toString(36);
		this.node.className = 'contextmenu';
		this.node.style.listStyle = 'none';
		this.node.style.display = 'inline-block';
		this.node.style.position = 'absolute';
		this.node.style.left = this.node.style.top = 0;
		this.node.style.zIndex = 9999996;
		this.node.context = this;
		this.items = [];
		for (var i = args.items.length - 1; i >= 0; i--) (function(){
			var li = document.createElement('li'),
				image = document.createElement('div'),
				text = document.createElement('span'),
				textcontainer = document.createElement('div'),
				nopad = 'pad' in args.items[i] && !args.items[i].pad,
				itemplaceholder = li.arg = args.items[i],
				disabled = args.items[i].disabled,
				toggled = args.items[i].toggled || false,
				separator = document.createElement('div');

			li.className = 'contextmenuitem';
			li.id = this.id + '-item-' + i;
			li.tabIndex = 0;
			li.root = this.node;
			li.subcontext = args.items[i].subcontext ? new ContextMenu(args.items[i].subcontext) : null;
			if (li.subcontext) li.subcontext.node.className += ' subcontextmenu';
			if (args.items[i].separate) li.separator = separator;

			this.items.push(li);

			li.editText = function(arg) {
				if (arguments[0]) text.innerHTML = arg;
			};

			li.execute = function(e, b) {
				if (!disabled || b) return li.func.call(this, e || new MouseEvent('click'), function() {
					li.style.background = '#F5F5F5';
					close.call(li.root);
				});
			}

			for (prop in args.items[i].attributes || {}) li[prop] = args.items[i].attributes[prop];
	        if (args.items[i].id) li.setAttribute('data-identifier', args.items[i].id);

			Object.defineProperties(li, {
				disabled: {
					get: function() {return disabled},
					set: function(v) {
						disabled = !!v;
						(li.children[1] || li.firstChild).style.color = v ? '#AAA' : '';
						li.title = itemplaceholder[v && itemplaceholder.disabledtitle ? 'disabledtitle' : 'title'] || '';
						if (v && itemplaceholder.disabledimage && li.children[0].className.includes('contextmenuitemimage')) itemplaceholder.disabledimage instanceof Element ? li.children[0].appendChild(itemplaceholder.disabledimage) : (li.children[0].style.backgroundImage = 'url("' + itemplaceholder.disabledimage + '")');
						else if (itemplaceholder.image && li.children[0].className.includes('contextmenuitemimage')) itemplaceholder.image instanceof Element ? li.children[0].appendChild(itemplaceholder.image) : (li.children[0].style.backgroundImage = 'url("' + itemplaceholder.image + '")');
						if (itemplaceholder.hideOnDisabled) li.style.display = v ? 'none' : '';
						if (itemplaceholder.hideSeparatorOnDisabled) separator.style.display = v ? 'none' : '';
					},
					enumerable: true,
					configurable: true
				},
				toggled: {
					get: function() {return toggled},
					set: function(v) {
						toggled = !!v;
						if (itemplaceholder.toggle && !nopad && (v ? itemplaceholder.image : itemplaceholder.imageoff) instanceof Element) li.firstChild.appendChild(v ? itemplaceholder.image : itemplaceholder.imageoff);
						else if (itemplaceholder.toggle && !nopad) li.firstChild.style.backgroundImage = 'url("' + (v ? itemplaceholder.image || '' : itemplaceholder.imageoff || itemplaceholder.image || '') + '")'
					}
				}
			})
			li.func = args.items[i].func;
			li.addEventListener('keydown', keyEvents);

			// Sets image if pad is true or not included
			if (nopad) {
				li.style.width = 'calc(12rem + 1.7em)';
			} else {
				if (args.items[i].toggle) args.items[i].toggled ? args.items[i].image instanceof Element ? image.appendChild(args.items[i].image) : (image.style.backgroundImage = 'url("' + args.items[i].image + '")') : (args.items[i].imageoff || args.items[i].image) instanceof Element ? image.appendChild(args.items[i].image) : (image.style.backgroundImage = 'url("' + (args.items[i].imageoff || args.items[i].image || '') + '")');
				else if (args.items[i].image && (!args.items[i].disabled || !args.items[i].disabledimage)) args.items[i].image instanceof Element ? image.appendChild(args.items[i].image) : (image.style.backgroundImage = 'url("' + args.items[i].image + '")');
				else if (args.items[i].disabledimage && args.items[i].disabled) args.items[i].image instanceof Element ? image.appendChild(args.items[i].image) : (image.style.backgroundImage = 'url("' + args.items[i].disabledimage + '")');
				// Sets image styles
				image.className = 'contextmenuitemimage'
				image.style.width = '1.4em';
				image.style.height = '1.4em';
				image.style.backgroundSize = '100% 100%';
				image.style.display = 'inline-block';
				image.style.position = 'absolute';
				image.style.left = '.3em';
				image.style.top = '0em';
				image.style.pointerEvents = 'none';
				image.root = this.node;
				li.style.paddingLeft = '2.1em';
				li.appendChild(image);
			}
			textcontainer.style.width = 'auto';
			textcontainer.style.textOverflow = 'ellipsis';
			textcontainer.style.hyphens = 'auto';
			textcontainer.style.overflowX = 'hidden';
			textcontainer.style.pointerEvents = 'none';
			textcontainer.root = this.node;
			textcontainer.className = 'contextmenuitemtextcontainer';
			if (disabled) {
				textcontainer.style.color = '#AAA';
				if (itemplaceholder.hideOnDisabled) li.style.display = 'none';
				if (itemplaceholder.hideSeparatorOnDisabled) separator.style.display = 'none';
			}
			li.appendChild(textcontainer)
			// Sets the item's text
			text.className = 'contextmenuitemtext';
			text.innerHTML = args.items[i].name || ' ';
			text.style.pointerEvents = 'none';
			text.style.MozUserSelect = '-moz-none';
			text.style.WebkitUserSelect = 'none';
			text.style.MsUserSelect = 'none';
			text.style.userSelect = 'none';
			text.root = this.node;
			textcontainer.appendChild(text);
			// Sets the item's title if one is defined
			if (args.items[i].title && (!disabled || !args.items[i].disabledtitle)) li.title = args.items[i].title;
			else if (args.items[i].disabledtitle && disabled) li.title = args.items[i].disabledtitle;
			// Sets the item's callback function if one is defined
			if (args.items[i].func) {
				li.addEventListener('click', function(e) {
					if (!disabled) li.func.call(this, e, function() {
						li.style.background = '#F5F5F5';
						close.call(li.root);
					});
				});
				li.addEventListener('keydown', function(e) {
					if (e.keyCode == 13 || e.keyCode == 32 && !disabled) li.func.call(this, e, function() {
						li.style.background = '#F5F5F5';
						close.call(li.root);
					})
				})
			};
			// Sets the item's hover and click color behavior
			['mouseenter','focus'].forEach(function(event) {
				li.addEventListener(event, function() {
					this.style.backgroundColor = disabled ? '#E5E5E5' : '#B2EBF2';
					this.style.whiteSpace = 'pre-line';
					this.style.height = '';
					if (itemplaceholder.subcontext) {
						var context = this.subcontext, rect = li.getBoundingClientRect();
						context.node.parent = li;
						context.node.style.top = em(-.2) - 1 + 'px';
						context.node.style.left = rect.width + 'px';
						context.node.style.position = 'absolute';
						this.appendChild(context.node)
					}
				});
			});
			
			['mouseleave','blur'].forEach(function(event) {
				li.addEventListener(event, function(e){
					this.style.backgroundColor = '';
					this.style.whiteSpace = 'nowrap';
					this.style.height = '1.4em';
					if (itemplaceholder.subcontext) {
						function f() {
							for (var i = li.children.length - 1; i >= 0; i--) {
								if (li.children[i].className.includes('subcontextmenu')) li.removeChild(li.children[i]);
							}
						}

						if (e.type == 'blur') setTimeout(function() {
							if (!(document.activeElement.root && document.activeElement.root.parent == li)) f();
						},0);
						else f();
					}
				});
			});

			li.addEventListener('mousedown', function(){this.style.backgroundColor = disabled ? '#E5E5E5' : '#A0D3D9'});
			li.addEventListener('mouseup', function(){this.style.backgroundColor = disabled ? '#E5E5E5' : '#B2EBF2'});
			li.style.padding = li.style.paddingLeft ? '.05em .4em .05em 2.1em' : '.05em .4em';
			li.style.paddingTop = '.075em';
			li.style.paddingBottom = '.025em';
			li.style.paddingRight = '.4em';
			li.style.paddingLeft = li.style.paddingLeft || '.4em';
			li.style.width = li.style.width || '12rem';
			li.style.height = li.style.minHeight = '1.4em';
			li.style.textOverflow = 'ellipsis';
			li.style.whiteSpace = 'nowrap';
			li.style.position = 'relative';
			if (args.items[i].separate) {
				separator.className = 'contextmenuitemseparator';
				separator.style.width = 'calc(12rem + 1.7em)';
				separator.style.height = '1px';
				separator.style.backgroundColor = '#C5C5C5';
				separator.style.position = 'relative';
				separator.style.left = '.4em';
				separator.style.margin = '.15em 0';
				this.node.insertBefore(separator, this.node.firstChild)
			}
			if (args.css) {
				for (var item in args.css) {
					li.style[item] = args.css[item];
				}
			}
			if (args.items[i].css) {
				for (var item in args.items[i].css) {
					li.style[item] = args.items[i].css[item];
				}
			}
			// Appends item to overall context menu
			this.node.insertBefore(li, this.node.firstChild);
		}).call(this)
	}

	HTMLStudio.ContextMenu.prototype.open = function open() {
		this.items.forEach(function(item) {
			if (item.arg.condition) item.disabled = !item.arg.condition.call(item);
			if (item.arg.separateCondition) item.separator.style.display = item.arg.separateCondition.call(item) ? '' : 'none';
		});
		document.body.insertBefore(this.node, document.getElementById('toolbarcontainer').nextElementSibling);
	}

	HTMLStudio.ContextMenu.prototype.getItem = function(arg) {
		for (var children = this.node.children, i = children.length - 1; i >= 0; i--)
			if (children[i].getAttribute('data-identifier') == arg || children[i].id == this.id + '-item-' + (arg || 0)) return children[i]
	};

	HTMLStudio.ContextMenu.isInstance = function(context) {
		return context && context[symbol] == symbol;
	}

	HTMLStudio.ContextMenu.prototype[symbol] = symbol;
}();
