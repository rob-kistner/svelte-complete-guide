
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function empty() {
		return text('');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function prevent_default(fn) {
		return function(event) {
			event.preventDefault();
			return fn.call(this, event);
		};
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];

		if (callbacks) {
			callbacks.slice().forEach(fn => fn(event));
		}
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function destroy_block(block, lookup) {
		block.d(1);
		lookup.delete(block.key);
	}

	function outro_and_destroy_block(block, lookup) {
		on_outro(() => {
			destroy_block(block, lookup);
		});

		block.o(1);
	}

	function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
		let o = old_blocks.length;
		let n = list.length;

		let i = o;
		const old_indexes = {};
		while (i--) old_indexes[old_blocks[i].key] = i;

		const new_blocks = [];
		const new_lookup = new Map();
		const deltas = new Map();

		i = n;
		while (i--) {
			const child_ctx = get_context(ctx, list, i);
			const key = get_key(child_ctx);
			let block = lookup.get(key);

			if (!block) {
				block = create_each_block(key, child_ctx);
				block.c();
			} else if (dynamic) {
				block.p(changed, child_ctx);
			}

			new_lookup.set(key, new_blocks[i] = block);

			if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
		}

		const will_move = new Set();
		const did_move = new Set();

		function insert(block) {
			if (block.i) block.i(1);
			block.m(node, next);
			lookup.set(block.key, block);
			next = block.first;
			n--;
		}

		while (o && n) {
			const new_block = new_blocks[n - 1];
			const old_block = old_blocks[o - 1];
			const new_key = new_block.key;
			const old_key = old_block.key;

			if (new_block === old_block) {
				// do nothing
				next = new_block.first;
				o--;
				n--;
			}

			else if (!new_lookup.has(old_key)) {
				// remove old block
				destroy(old_block, lookup);
				o--;
			}

			else if (!lookup.has(new_key) || will_move.has(new_key)) {
				insert(new_block);
			}

			else if (did_move.has(old_key)) {
				o--;

			} else if (deltas.get(new_key) > deltas.get(old_key)) {
				did_move.add(new_key);
				insert(new_block);

			} else {
				will_move.add(old_key);
				o--;
			}
		}

		while (o--) {
			const old_block = old_blocks[o];
			if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
		}

		while (n) insert(new_blocks[n - 1]);

		return new_blocks;
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	/* src/components/ui/Header.svelte generated by Svelte v3.4.2 */

	const file = "src/components/ui/Header.svelte";

	function create_fragment(ctx) {
		var header, h1, t;

		return {
			c: function create() {
				header = element("header");
				h1 = element("h1");
				t = text(ctx.text);
				h1.className = "svelte-m4bu1s";
				add_location(h1, file, 25, 2, 381);
				header.className = "svelte-m4bu1s";
				add_location(header, file, 24, 0, 370);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, header, anchor);
				append(header, h1);
				append(h1, t);
			},

			p: function update(changed, ctx) {
				if (changed.text) {
					set_data(t, ctx.text);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(header);
				}
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let { text = 'Default header' } = $$props;

		$$self.$set = $$props => {
			if ('text' in $$props) $$invalidate('text', text = $$props.text);
		};

		return { text };
	}

	class Header extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["text"]);
		}

		get text() {
			throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set text(value) {
			throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/ui/Button.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/components/ui/Button.svelte";

	// (89:0) {:else}
	function create_else_block(ctx) {
		var button, t;

		return {
			c: function create() {
				button = element("button");
				t = text(ctx.caption);
				button.type = ctx.type;
				button.className = "" + ctx.mode + " svelte-3adr20";
				add_location(button, file$1, 89, 2, 1371);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, t);
			},

			p: function update(changed, ctx) {
				if (changed.caption) {
					set_data(t, ctx.caption);
				}

				if (changed.type) {
					button.type = ctx.type;
				}

				if (changed.mode) {
					button.className = "" + ctx.mode + " svelte-3adr20";
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}
			}
		};
	}

	// (87:0) {#if href}
	function create_if_block(ctx) {
		var a, t;

		return {
			c: function create() {
				a = element("a");
				t = text(ctx.caption);
				a.href = ctx.href;
				a.className = "" + ctx.mode + " svelte-3adr20";
				add_location(a, file$1, 87, 2, 1324);
			},

			m: function mount(target, anchor) {
				insert(target, a, anchor);
				append(a, t);
			},

			p: function update(changed, ctx) {
				if (changed.caption) {
					set_data(t, ctx.caption);
				}

				if (changed.href) {
					a.href = ctx.href;
				}

				if (changed.mode) {
					a.className = "" + ctx.mode + " svelte-3adr20";
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(a);
				}
			}
		};
	}

	function create_fragment$1(ctx) {
		var if_block_anchor;

		function select_block_type(ctx) {
			if (ctx.href) return create_if_block;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { type = 'button', caption = 'Button', classes, mode, href } = $$props;

		$$self.$set = $$props => {
			if ('type' in $$props) $$invalidate('type', type = $$props.type);
			if ('caption' in $$props) $$invalidate('caption', caption = $$props.caption);
			if ('classes' in $$props) $$invalidate('classes', classes = $$props.classes);
			if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
			if ('href' in $$props) $$invalidate('href', href = $$props.href);
		};

		return { type, caption, classes, mode, href };
	}

	class Button extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["type", "caption", "classes", "mode", "href"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.classes === undefined && !('classes' in props)) {
				console.warn("<Button> was created without expected prop 'classes'");
			}
			if (ctx.mode === undefined && !('mode' in props)) {
				console.warn("<Button> was created without expected prop 'mode'");
			}
			if (ctx.href === undefined && !('href' in props)) {
				console.warn("<Button> was created without expected prop 'href'");
			}
		}

		get type() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set type(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get caption() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set caption(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get classes() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set classes(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get mode() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set mode(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get href() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set href(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/meetups/MeetupItem.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/components/meetups/MeetupItem.svelte";

	function create_fragment$2(ctx) {
		var article, header, h1, t0, t1, h2, t2, t3, address_1, t4, t5, div0, img, t6, div1, p, t7, t8, footer, t9, t10, current;

		var button0 = new Button({
			props: {
			type: "href",
			caption: "Contact",
			mode: "outline",
			href: "mailto:" + ctx.email
		},
			$$inline: true
		});

		var button1 = new Button({
			props: { caption: "Favorite", mode: "outline" },
			$$inline: true
		});

		var button2 = new Button({
			props: { caption: "Show Details" },
			$$inline: true
		});

		return {
			c: function create() {
				article = element("article");
				header = element("header");
				h1 = element("h1");
				t0 = text(ctx.title);
				t1 = space();
				h2 = element("h2");
				t2 = text(ctx.subtitle);
				t3 = space();
				address_1 = element("address");
				t4 = text(ctx.address);
				t5 = space();
				div0 = element("div");
				img = element("img");
				t6 = space();
				div1 = element("div");
				p = element("p");
				t7 = text(ctx.description);
				t8 = space();
				footer = element("footer");
				button0.$$.fragment.c();
				t9 = space();
				button1.$$.fragment.c();
				t10 = space();
				button2.$$.fragment.c();
				h1.className = "svelte-1dlkexa";
				add_location(h1, file$2, 80, 4, 1116);
				h2.className = "svelte-1dlkexa";
				add_location(h2, file$2, 81, 4, 1137);
				address_1.className = "svelte-1dlkexa";
				add_location(address_1, file$2, 82, 4, 1161);
				img.src = ctx.imageUrl;
				img.alt = ctx.title;
				img.className = "svelte-1dlkexa";
				add_location(img, file$2, 84, 6, 1220);
				div0.className = "image svelte-1dlkexa";
				add_location(div0, file$2, 83, 4, 1194);
				p.className = "svelte-1dlkexa";
				add_location(p, file$2, 87, 6, 1296);
				div1.className = "content svelte-1dlkexa";
				add_location(div1, file$2, 86, 4, 1268);
				footer.className = "svelte-1dlkexa";
				add_location(footer, file$2, 89, 4, 1332);
				header.className = "svelte-1dlkexa";
				add_location(header, file$2, 79, 2, 1103);
				article.className = "svelte-1dlkexa";
				add_location(article, file$2, 78, 0, 1091);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, article, anchor);
				append(article, header);
				append(header, h1);
				append(h1, t0);
				append(header, t1);
				append(header, h2);
				append(h2, t2);
				append(header, t3);
				append(header, address_1);
				append(address_1, t4);
				append(header, t5);
				append(header, div0);
				append(div0, img);
				append(header, t6);
				append(header, div1);
				append(div1, p);
				append(p, t7);
				append(header, t8);
				append(header, footer);
				mount_component(button0, footer, null);
				append(footer, t9);
				mount_component(button1, footer, null);
				append(footer, t10);
				mount_component(button2, footer, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if (!current || changed.title) {
					set_data(t0, ctx.title);
				}

				if (!current || changed.subtitle) {
					set_data(t2, ctx.subtitle);
				}

				if (!current || changed.address) {
					set_data(t4, ctx.address);
				}

				if (!current || changed.imageUrl) {
					img.src = ctx.imageUrl;
				}

				if (!current || changed.title) {
					img.alt = ctx.title;
				}

				if (!current || changed.description) {
					set_data(t7, ctx.description);
				}

				var button0_changes = {};
				if (changed.email) button0_changes.href = "mailto:" + ctx.email;
				button0.$set(button0_changes);
			},

			i: function intro(local) {
				if (current) return;
				button0.$$.fragment.i(local);

				button1.$$.fragment.i(local);

				button2.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				button0.$$.fragment.o(local);
				button1.$$.fragment.o(local);
				button2.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(article);
				}

				button0.$destroy();

				button1.$destroy();

				button2.$destroy();
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { title, subtitle, imageUrl, description, address, email } = $$props;

		$$self.$set = $$props => {
			if ('title' in $$props) $$invalidate('title', title = $$props.title);
			if ('subtitle' in $$props) $$invalidate('subtitle', subtitle = $$props.subtitle);
			if ('imageUrl' in $$props) $$invalidate('imageUrl', imageUrl = $$props.imageUrl);
			if ('description' in $$props) $$invalidate('description', description = $$props.description);
			if ('address' in $$props) $$invalidate('address', address = $$props.address);
			if ('email' in $$props) $$invalidate('email', email = $$props.email);
		};

		return {
			title,
			subtitle,
			imageUrl,
			description,
			address,
			email
		};
	}

	class MeetupItem extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, ["title", "subtitle", "imageUrl", "description", "address", "email"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.title === undefined && !('title' in props)) {
				console.warn("<MeetupItem> was created without expected prop 'title'");
			}
			if (ctx.subtitle === undefined && !('subtitle' in props)) {
				console.warn("<MeetupItem> was created without expected prop 'subtitle'");
			}
			if (ctx.imageUrl === undefined && !('imageUrl' in props)) {
				console.warn("<MeetupItem> was created without expected prop 'imageUrl'");
			}
			if (ctx.description === undefined && !('description' in props)) {
				console.warn("<MeetupItem> was created without expected prop 'description'");
			}
			if (ctx.address === undefined && !('address' in props)) {
				console.warn("<MeetupItem> was created without expected prop 'address'");
			}
			if (ctx.email === undefined && !('email' in props)) {
				console.warn("<MeetupItem> was created without expected prop 'email'");
			}
		}

		get title() {
			throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set title(value) {
			throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get subtitle() {
			throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set subtitle(value) {
			throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get imageUrl() {
			throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set imageUrl(value) {
			throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get description() {
			throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set description(value) {
			throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get address() {
			throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set address(value) {
			throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get email() {
			throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set email(value) {
			throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/meetups/MeetupGrid.svelte generated by Svelte v3.4.2 */

	const file$3 = "src/components/meetups/MeetupGrid.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.meetup = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	// (22:2) {#each meetups as meetup, i (meetup.id)}
	function create_each_block(key_1, ctx) {
		var first, current;

		var meetupitem = new MeetupItem({
			props: {
			title: ctx.meetup.title,
			subtitle: ctx.meetup.subtitle,
			imageUrl: ctx.meetup.imageUrl,
			description: ctx.meetup.description,
			email: ctx.meetup.email,
			address: ctx.meetup.address
		},
			$$inline: true
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = empty();
				meetupitem.$$.fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				mount_component(meetupitem, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var meetupitem_changes = {};
				if (changed.meetups) meetupitem_changes.title = ctx.meetup.title;
				if (changed.meetups) meetupitem_changes.subtitle = ctx.meetup.subtitle;
				if (changed.meetups) meetupitem_changes.imageUrl = ctx.meetup.imageUrl;
				if (changed.meetups) meetupitem_changes.description = ctx.meetup.description;
				if (changed.meetups) meetupitem_changes.email = ctx.meetup.email;
				if (changed.meetups) meetupitem_changes.address = ctx.meetup.address;
				meetupitem.$set(meetupitem_changes);
			},

			i: function intro(local) {
				if (current) return;
				meetupitem.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				meetupitem.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(first);
				}

				meetupitem.$destroy(detaching);
			}
		};
	}

	function create_fragment$3(ctx) {
		var section, each_blocks = [], each_1_lookup = new Map(), current;

		var each_value = ctx.meetups;

		const get_key = ctx => ctx.meetup.id;

		for (var i = 0; i < each_value.length; i += 1) {
			let child_ctx = get_each_context(ctx, each_value, i);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
		}

		return {
			c: function create() {
				section = element("section");

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
				section.id = "meetups";
				section.className = "svelte-pr4wz6";
				add_location(section, file$3, 20, 0, 312);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, section, anchor);

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(section, null);

				current = true;
			},

			p: function update(changed, ctx) {
				const each_value = ctx.meetups;

				group_outros();
				each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, section, outro_and_destroy_block, create_each_block, null, get_each_context);
				check_outros();
			},

			i: function intro(local) {
				if (current) return;
				for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

				current = true;
			},

			o: function outro(local) {
				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].o();

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(section);
				}

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { meetups } = $$props;

		$$self.$set = $$props => {
			if ('meetups' in $$props) $$invalidate('meetups', meetups = $$props.meetups);
		};

		return { meetups };
	}

	class MeetupGrid extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, ["meetups"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.meetups === undefined && !('meetups' in props)) {
				console.warn("<MeetupGrid> was created without expected prop 'meetups'");
			}
		}

		get meetups() {
			throw new Error("<MeetupGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set meetups(value) {
			throw new Error("<MeetupGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/ui/TextInput.svelte generated by Svelte v3.4.2 */

	const file$4 = "src/components/ui/TextInput.svelte";

	// (40:35) 
	function create_if_block_1(ctx) {
		var input, dispose;

		return {
			c: function create() {
				input = element("input");
				attr(input, "type", ctx.type);
				input.id = ctx.id;
				input.value = ctx.value;
				input.placeholder = ctx.placeholder;
				input.className = "svelte-z8ete7";
				add_location(input, file$4, 40, 4, 793);
				dispose = listen(input, "input", ctx.input_handler_1);
			},

			m: function mount(target, anchor) {
				insert(target, input, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.type) {
					attr(input, "type", ctx.type);
				}

				if (changed.id) {
					input.id = ctx.id;
				}

				if (changed.value) {
					input.value = ctx.value;
				}

				if (changed.placeholder) {
					input.placeholder = ctx.placeholder;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(input);
				}

				dispose();
			}
		};
	}

	// (38:2) {#if controlType === 'textarea'}
	function create_if_block$1(ctx) {
		var textarea, dispose;

		return {
			c: function create() {
				textarea = element("textarea");
				textarea.id = ctx.id;
				textarea.rows = ctx.rows;
				textarea.value = ctx.value;
				textarea.placeholder = ctx.placeholder;
				textarea.className = "svelte-z8ete7";
				add_location(textarea, file$4, 38, 4, 697);
				dispose = listen(textarea, "input", ctx.input_handler);
			},

			m: function mount(target, anchor) {
				insert(target, textarea, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.id) {
					textarea.id = ctx.id;
				}

				if (changed.rows) {
					textarea.rows = ctx.rows;
				}

				if (changed.value) {
					textarea.value = ctx.value;
				}

				if (changed.placeholder) {
					textarea.placeholder = ctx.placeholder;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(textarea);
				}

				dispose();
			}
		};
	}

	function create_fragment$4(ctx) {
		var div, label_1, t0, t1;

		function select_block_type(ctx) {
			if (ctx.controlType === 'textarea') return create_if_block$1;
			if (ctx.controlType === 'text') return create_if_block_1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type && current_block_type(ctx);

		return {
			c: function create() {
				div = element("div");
				label_1 = element("label");
				t0 = text(ctx.label);
				t1 = space();
				if (if_block) if_block.c();
				label_1.htmlFor = ctx.id;
				label_1.className = "svelte-z8ete7";
				add_location(label_1, file$4, 36, 2, 626);
				div.className = "form-control";
				add_location(div, file$4, 35, 0, 597);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, label_1);
				append(label_1, t0);
				append(div, t1);
				if (if_block) if_block.m(div, null);
			},

			p: function update(changed, ctx) {
				if (changed.label) {
					set_data(t0, ctx.label);
				}

				if (changed.id) {
					label_1.htmlFor = ctx.id;
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if (if_block) if_block.d(1);
					if_block = current_block_type && current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(div, null);
					}
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block) if_block.d();
			}
		};
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { controlType, type = 'text', id, label, rows = 3, placeholder = '', value } = $$props;

		function input_handler(event) {
			bubble($$self, event);
		}

		function input_handler_1(event) {
			bubble($$self, event);
		}

		$$self.$set = $$props => {
			if ('controlType' in $$props) $$invalidate('controlType', controlType = $$props.controlType);
			if ('type' in $$props) $$invalidate('type', type = $$props.type);
			if ('id' in $$props) $$invalidate('id', id = $$props.id);
			if ('label' in $$props) $$invalidate('label', label = $$props.label);
			if ('rows' in $$props) $$invalidate('rows', rows = $$props.rows);
			if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
			if ('value' in $$props) $$invalidate('value', value = $$props.value);
		};

		return {
			controlType,
			type,
			id,
			label,
			rows,
			placeholder,
			value,
			input_handler,
			input_handler_1
		};
	}

	class TextInput extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, ["controlType", "type", "id", "label", "rows", "placeholder", "value"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.controlType === undefined && !('controlType' in props)) {
				console.warn("<TextInput> was created without expected prop 'controlType'");
			}
			if (ctx.id === undefined && !('id' in props)) {
				console.warn("<TextInput> was created without expected prop 'id'");
			}
			if (ctx.label === undefined && !('label' in props)) {
				console.warn("<TextInput> was created without expected prop 'label'");
			}
			if (ctx.value === undefined && !('value' in props)) {
				console.warn("<TextInput> was created without expected prop 'value'");
			}
		}

		get controlType() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set controlType(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get type() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set type(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get id() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set id(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get label() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set label(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get rows() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set rows(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get placeholder() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set placeholder(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get value() {
			throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	let meetups = [
	  {
	    id: 'm1',
	    title: 'Coding Bootcamp',
	    subtitle: 'Learn to code in 2 hours',
	    description: 'In this meetup, we will have experts that teach you how to code',
	    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&h=300&q=80',
	    address: '27 Nerd Road, 32525 New York',
	    email: 'code@meetups.com'
	  },
	  {
	    id: 'm2',
	    title: 'Swim Together',
	    subtitle: 'Let\'s go swimming, dammit',
	    description: 'Gonna swim, exactly like it sounds, duh.',
	    imageUrl: 'https://images.unsplash.com/photo-1551672746-89991811c186?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=300&q=80',
	    address: '27 Nerd Road, 32525 New York',
	    email: 'code@meetups.com'
	  },
	];

	/* src/components/App.svelte generated by Svelte v3.4.2 */

	const file$5 = "src/components/App.svelte";

	function create_fragment$5(ctx) {
		var main, t0, form, h2, t2, t3, t4, t5, t6, t7, t8, t9, current, dispose;

		var header = new Header({
			props: { text: "Meetup Manager" },
			$$inline: true
		});

		var textinput0 = new TextInput({
			props: {
			controlType: "text",
			id: "title",
			label: "Title",
			placeholder: "Enter the meetup title",
			value: ctx.title
		},
			$$inline: true
		});
		textinput0.$on("input", ctx.input_handler);

		var textinput1 = new TextInput({
			props: {
			controlType: "text",
			id: "subtitle",
			label: "Subtitle",
			placeholder: "Enter the meetup subtitle",
			value: ctx.subtitle
		},
			$$inline: true
		});
		textinput1.$on("input", ctx.input_handler_1);

		var textinput2 = new TextInput({
			props: {
			controlType: "text",
			id: "address",
			label: "Address",
			placeholder: "Enter the address",
			value: ctx.address
		},
			$$inline: true
		});
		textinput2.$on("input", ctx.input_handler_2);

		var textinput3 = new TextInput({
			props: {
			controlType: "text",
			id: "imageUrl",
			label: "Image",
			placeholder: "Enter the url to the image",
			value: ctx.imageUrl
		},
			$$inline: true
		});
		textinput3.$on("input", ctx.input_handler_3);

		var textinput4 = new TextInput({
			props: {
			controlType: "text",
			type: "email",
			id: "email",
			label: "Email",
			placeholder: "Enter the contact email",
			value: ctx.email
		},
			$$inline: true
		});
		textinput4.$on("input", ctx.input_handler_4);

		var textinput5 = new TextInput({
			props: {
			controlType: "textarea",
			rows: "5",
			id: "description",
			label: "Description",
			placeholder: "Enter the meetup description",
			value: ctx.description
		},
			$$inline: true
		});
		textinput5.$on("input", ctx.input_handler_5);

		var button = new Button({
			props: { type: "submit", caption: "Save" },
			$$inline: true
		});

		var meetupgrid = new MeetupGrid({
			props: { meetups: ctx.meetups },
			$$inline: true
		});

		return {
			c: function create() {
				main = element("main");
				header.$$.fragment.c();
				t0 = space();
				form = element("form");
				h2 = element("h2");
				h2.textContent = "Add a meetup";
				t2 = space();
				textinput0.$$.fragment.c();
				t3 = space();
				textinput1.$$.fragment.c();
				t4 = space();
				textinput2.$$.fragment.c();
				t5 = space();
				textinput3.$$.fragment.c();
				t6 = space();
				textinput4.$$.fragment.c();
				t7 = space();
				textinput5.$$.fragment.c();
				t8 = space();
				button.$$.fragment.c();
				t9 = space();
				meetupgrid.$$.fragment.c();
				add_location(h2, file$5, 53, 4, 1072);
				form.className = "svelte-1p0mqht";
				add_location(form, file$5, 52, 2, 1024);
				main.className = "svelte-1p0mqht";
				add_location(main, file$5, 47, 0, 977);
				dispose = listen(form, "submit", prevent_default(ctx.addMeetup));
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, main, anchor);
				mount_component(header, main, null);
				append(main, t0);
				append(main, form);
				append(form, h2);
				append(form, t2);
				mount_component(textinput0, form, null);
				append(form, t3);
				mount_component(textinput1, form, null);
				append(form, t4);
				mount_component(textinput2, form, null);
				append(form, t5);
				mount_component(textinput3, form, null);
				append(form, t6);
				mount_component(textinput4, form, null);
				append(form, t7);
				mount_component(textinput5, form, null);
				append(form, t8);
				mount_component(button, form, null);
				append(main, t9);
				mount_component(meetupgrid, main, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var textinput0_changes = {};
				if (changed.title) textinput0_changes.value = ctx.title;
				textinput0.$set(textinput0_changes);

				var textinput1_changes = {};
				if (changed.subtitle) textinput1_changes.value = ctx.subtitle;
				textinput1.$set(textinput1_changes);

				var textinput2_changes = {};
				if (changed.address) textinput2_changes.value = ctx.address;
				textinput2.$set(textinput2_changes);

				var textinput3_changes = {};
				if (changed.imageUrl) textinput3_changes.value = ctx.imageUrl;
				textinput3.$set(textinput3_changes);

				var textinput4_changes = {};
				if (changed.email) textinput4_changes.value = ctx.email;
				textinput4.$set(textinput4_changes);

				var textinput5_changes = {};
				if (changed.description) textinput5_changes.value = ctx.description;
				textinput5.$set(textinput5_changes);

				var meetupgrid_changes = {};
				if (changed.meetups) meetupgrid_changes.meetups = ctx.meetups;
				meetupgrid.$set(meetupgrid_changes);
			},

			i: function intro(local) {
				if (current) return;
				header.$$.fragment.i(local);

				textinput0.$$.fragment.i(local);

				textinput1.$$.fragment.i(local);

				textinput2.$$.fragment.i(local);

				textinput3.$$.fragment.i(local);

				textinput4.$$.fragment.i(local);

				textinput5.$$.fragment.i(local);

				button.$$.fragment.i(local);

				meetupgrid.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				header.$$.fragment.o(local);
				textinput0.$$.fragment.o(local);
				textinput1.$$.fragment.o(local);
				textinput2.$$.fragment.o(local);
				textinput3.$$.fragment.o(local);
				textinput4.$$.fragment.o(local);
				textinput5.$$.fragment.o(local);
				button.$$.fragment.o(local);
				meetupgrid.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(main);
				}

				header.$destroy();

				textinput0.$destroy();

				textinput1.$destroy();

				textinput2.$destroy();

				textinput3.$destroy();

				textinput4.$destroy();

				textinput5.$destroy();

				button.$destroy();

				meetupgrid.$destroy();

				dispose();
			}
		};
	}

	function instance$5($$self, $$props, $$invalidate) {
		
	  // need to reassign import data to mutate it with the form
	  let meetups$1 = [...meetups];

	  let title = '';
	  let subtitle = '';
	  let address = '';
	  let email = '';
	  let description = '';
	  let imageUrl = '';

	  function addMeetup ()
	  {
	    const newMeetup = {
	      id: parseInt(Math.random() * 100000).toString(),
	      title: title,
	      subtitle: subtitle,
	      address: address,
	      description: description,
	      email: email,
	      address: address,
	    };
	    $$invalidate('meetups', meetups$1 = [newMeetup, ...meetups$1]);
	  }

		function input_handler(e) {
			const $$result = title = e.target.value;
			$$invalidate('title', title);
			return $$result;
		}

		function input_handler_1(e) {
			const $$result = subtitle = e.target.value;
			$$invalidate('subtitle', subtitle);
			return $$result;
		}

		function input_handler_2(e) {
			const $$result = address = e.target.value;
			$$invalidate('address', address);
			return $$result;
		}

		function input_handler_3(e) {
			const $$result = imageUrl = e.target.value;
			$$invalidate('imageUrl', imageUrl);
			return $$result;
		}

		function input_handler_4(e) {
			const $$result = email = e.target.value;
			$$invalidate('email', email);
			return $$result;
		}

		function input_handler_5(e) {
			const $$result = description = e.target.value;
			$$invalidate('description', description);
			return $$result;
		}

		return {
			meetups: meetups$1,
			title,
			subtitle,
			address,
			email,
			description,
			imageUrl,
			addMeetup,
			input_handler,
			input_handler_1,
			input_handler_2,
			input_handler_3,
			input_handler_4,
			input_handler_5
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, []);
		}
	}

	const app = new App({
	  target: document.body
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
