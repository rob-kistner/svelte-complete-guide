
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (const k in src) tar[k] = src[k];
		return tar;
	}

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

	function create_slot(definition, ctx, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, fn) {
		return definition[1]
			? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
			: ctx.$$scope.ctx;
	}

	function get_slot_changes(definition, ctx, changed, fn) {
		return definition[1]
			? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
			: ctx.$$scope.changed || {};
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

	function custom_event(type, detail) {
		const e = document.createEvent('CustomEvent');
		e.initCustomEvent(type, false, false, detail);
		return e;
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function beforeUpdate(fn) {
		get_current_component().$$.before_render.push(fn);
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	function afterUpdate(fn) {
		get_current_component().$$.after_render.push(fn);
	}

	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	function createEventDispatcher() {
		const component = current_component;

		return (type, detail) => {
			const callbacks = component.$$.callbacks[type];

			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(type, detail);
				callbacks.slice().forEach(fn => {
					fn.call(component, event);
				});
			}
		};
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

	function tick() {
		schedule_update();
		return resolved_promise;
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

	function get_spread_update(levels, updates) {
		const update = {};

		const to_null_out = {};
		const accounted_for = { $$scope: 1 };

		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];

			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}

				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}

				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}

		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}

		return update;
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

	/* src/Product.svelte generated by Svelte v3.4.2 */

	const file = "src/Product.svelte";

	// (54:0) {#if bestseller}
	function create_if_block(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "BESTSELLER!";
				p.className = "bestseller svelte-cmh1lp";
				add_location(p, file, 54, 2, 940);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	function create_fragment(ctx) {
		var article, t0, h3, t1, t2, p, t3, t4, t5, button0, i0, t6, t7, button1, i1, t8, dispose;

		var if_block = (ctx.bestseller) && create_if_block(ctx);

		return {
			c: function create() {
				article = element("article");
				if (if_block) if_block.c();
				t0 = space();
				h3 = element("h3");
				t1 = text(ctx.title);
				t2 = space();
				p = element("p");
				t3 = text("$ ");
				t4 = text(ctx.price);
				t5 = space();
				button0 = element("button");
				i0 = element("i");
				t6 = text(" Add");
				t7 = space();
				button1 = element("button");
				i1 = element("i");
				t8 = text(" Remove");
				h3.className = "svelte-cmh1lp";
				add_location(h3, file, 56, 2, 986);
				p.className = "svelte-cmh1lp";
				add_location(p, file, 57, 2, 1005);
				i0.className = "fal fa-plus svelte-cmh1lp";
				add_location(i0, file, 59, 4, 1058);
				button0.className = "svelte-cmh1lp";
				add_location(button0, file, 58, 2, 1024);
				i1.className = "fal fa-times svelte-cmh1lp";
				add_location(i1, file, 62, 4, 1143);
				button1.className = "svelte-cmh1lp";
				add_location(button1, file, 61, 2, 1104);
				add_location(article, file, 52, 0, 911);

				dispose = [
					listen(button0, "click", ctx.addToCart),
					listen(button1, "click", ctx.deleteCartItem)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, article, anchor);
				if (if_block) if_block.m(article, null);
				append(article, t0);
				append(article, h3);
				append(h3, t1);
				append(article, t2);
				append(article, p);
				append(p, t3);
				append(p, t4);
				append(article, t5);
				append(article, button0);
				append(button0, i0);
				append(button0, t6);
				append(article, t7);
				append(article, button1);
				append(button1, i1);
				append(button1, t8);
			},

			p: function update(changed, ctx) {
				if (ctx.bestseller) {
					if (!if_block) {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(article, t0);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (changed.title) {
					set_data(t1, ctx.title);
				}

				if (changed.price) {
					set_data(t4, ctx.price);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(article);
				}

				if (if_block) if_block.d();
				run_all(dispose);
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let { title, price, bestseller = false } = $$props;

	  const dispatch = createEventDispatcher();

	  function addToCart() {
	    dispatch('add-to-cart', {id: 'p1'});
	  }

	  function deleteCartItem() {
	    dispatch('delete-cart-item', {id: 'p1'});
	  }

		$$self.$set = $$props => {
			if ('title' in $$props) $$invalidate('title', title = $$props.title);
			if ('price' in $$props) $$invalidate('price', price = $$props.price);
			if ('bestseller' in $$props) $$invalidate('bestseller', bestseller = $$props.bestseller);
		};

		return {
			title,
			price,
			bestseller,
			addToCart,
			deleteCartItem
		};
	}

	class Product extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["title", "price", "bestseller"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.title === undefined && !('title' in props)) {
				console.warn("<Product> was created without expected prop 'title'");
			}
			if (ctx.price === undefined && !('price' in props)) {
				console.warn("<Product> was created without expected prop 'price'");
			}
		}

		get title() {
			throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set title(value) {
			throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get price() {
			throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set price(value) {
			throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get bestseller() {
			throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bestseller(value) {
			throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/Modal.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/Modal.svelte";

	const get_footer_slot_changes = ({ agreed }) => ({ didAgree: agreed });
	const get_footer_slot_context = ({ agreed }) => ({ didAgree: agreed });

	const get_content_slot_changes = ({}) => ({});
	const get_content_slot_context = ({}) => ({});

	const get_header_slot_changes = ({}) => ({});
	const get_header_slot_context = ({}) => ({});

	function create_fragment$1(ctx) {
		var div0, t0, div3, header, t1, div1, t2, div2, p, t4, label, input, t5, t6, footer, button, i, t7, button_disabled_value, dispose_footer_slot, current, dispose;

		const header_slot_1 = ctx.$$slots.header;
		const header_slot = create_slot(header_slot_1, ctx, get_header_slot_context);

		const content_slot_1 = ctx.$$slots.content;
		const content_slot = create_slot(content_slot_1, ctx, get_content_slot_context);

		const footer_slot_1 = ctx.$$slots.footer;
		const footer_slot = create_slot(footer_slot_1, ctx, get_footer_slot_context);

		return {
			c: function create() {
				div0 = element("div");
				t0 = space();
				div3 = element("div");
				header = element("header");

				if (header_slot) header_slot.c();
				t1 = space();
				div1 = element("div");

				if (content_slot) content_slot.c();
				t2 = space();
				div2 = element("div");
				p = element("p");
				p.textContent = "Before you close, you need to agree to our terms.";
				t4 = space();
				label = element("label");
				input = element("input");
				t5 = text("\n    I agree");
				t6 = space();
				footer = element("footer");

				if (!footer_slot) {
					button = element("button");
					i = element("i");
					t7 = text("\n        Close");
				}

				if (footer_slot) footer_slot.c();
				div0.className = "backdrop svelte-1wrk5un";
				add_location(div0, file$1, 70, 0, 1123);

				header.className = "svelte-1wrk5un";
				add_location(header, file$1, 72, 2, 1207);

				div1.className = "content";
				add_location(div1, file$1, 75, 2, 1257);
				add_location(p, file$1, 79, 4, 1347);
				attr(input, "type", "checkbox");
				add_location(input, file$1, 81, 4, 1420);
				add_location(label, file$1, 80, 4, 1408);
				div2.className = "disclaimer";
				add_location(div2, file$1, 78, 2, 1318);

				if (!footer_slot) {
					i.className = "fal fa-times";
					add_location(i, file$1, 88, 8, 1650);
					button.disabled = button_disabled_value = !ctx.agreed;
					add_location(button, file$1, 87, 6, 1579);
					dispose_footer_slot = listen(button, "click", ctx.click_handler_2);
				}

				footer.className = "svelte-1wrk5un";
				add_location(footer, file$1, 85, 2, 1521);
				div3.className = "modal svelte-1wrk5un";
				add_location(div3, file$1, 71, 0, 1185);

				dispose = [
					listen(div0, "click", ctx.click_handler),
					listen(input, "click", ctx.click_handler_1)
				];
			},

			l: function claim(nodes) {
				if (header_slot) header_slot.l(header_nodes);

				if (content_slot) content_slot.l(div1_nodes);

				if (footer_slot) footer_slot.l(footer_nodes);
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div0, anchor);
				insert(target, t0, anchor);
				insert(target, div3, anchor);
				append(div3, header);

				if (header_slot) {
					header_slot.m(header, null);
				}

				append(div3, t1);
				append(div3, div1);

				if (content_slot) {
					content_slot.m(div1, null);
				}

				append(div3, t2);
				append(div3, div2);
				append(div2, p);
				append(div2, t4);
				append(div2, label);
				append(label, input);
				append(label, t5);
				append(div3, t6);
				append(div3, footer);

				if (!footer_slot) {
					append(footer, button);
					append(button, i);
					append(button, t7);
				}

				else {
					footer_slot.m(footer, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (header_slot && header_slot.p && changed.$$scope) {
					header_slot.p(get_slot_changes(header_slot_1, ctx, changed, get_header_slot_changes), get_slot_context(header_slot_1, ctx, get_header_slot_context));
				}

				if (content_slot && content_slot.p && changed.$$scope) {
					content_slot.p(get_slot_changes(content_slot_1, ctx, changed, get_content_slot_changes), get_slot_context(content_slot_1, ctx, get_content_slot_context));
				}

				if (!footer_slot) {
					if ((!current || changed.agreed) && button_disabled_value !== (button_disabled_value = !ctx.agreed)) {
						button.disabled = button_disabled_value;
					}
				}

				if (footer_slot && footer_slot.p && (changed.$$scope || changed.agreed)) {
					footer_slot.p(get_slot_changes(footer_slot_1, ctx, changed, get_footer_slot_changes), get_slot_context(footer_slot_1, ctx, get_footer_slot_context));
				}
			},

			i: function intro(local) {
				if (current) return;
				if (header_slot && header_slot.i) header_slot.i(local);
				if (content_slot && content_slot.i) content_slot.i(local);
				if (footer_slot && footer_slot.i) footer_slot.i(local);
				current = true;
			},

			o: function outro(local) {
				if (header_slot && header_slot.o) header_slot.o(local);
				if (content_slot && content_slot.o) content_slot.o(local);
				if (footer_slot && footer_slot.o) footer_slot.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div0);
					detach(t0);
					detach(div3);
				}

				if (header_slot) header_slot.d(detaching);

				if (content_slot) content_slot.d(detaching);

				if (!footer_slot) {
					dispose_footer_slot();
				}

				if (footer_slot) footer_slot.d(detaching);
				run_all(dispose);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { content } = $$props;

	  let agreed = false;
	  let autoscroll = false;
	  const dispatch = createEventDispatcher();

	  onMount( ()=> {
	    console.log('onMount');
	  });

	  onDestroy( ()=> {
	    console.log('onDestroy');
	  });

	  beforeUpdate( () => {
	    $$invalidate('autoscroll', autoscroll = agreed);
	  });

	  afterUpdate( () => {
	    if (autoscroll) {
	      const modal = document.querySelector('.modal');
	      modal.scrollTo(0, modal.scrollHeight);
	    }
	  });

	  console.log('script executed');

		let { $$slots = {}, $$scope } = $$props;

		function click_handler(e) {
			return dispatch('cancel');
		}

		function click_handler_1() {
			const $$result = agreed = this.checked;
			$$invalidate('agreed', agreed);
			return $$result;
		}

		function click_handler_2() {
			return dispatch('close');
		}

		$$self.$set = $$props => {
			if ('content' in $$props) $$invalidate('content', content = $$props.content);
			if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
		};

		return {
			content,
			agreed,
			dispatch,
			click_handler,
			click_handler_1,
			click_handler_2,
			$$slots,
			$$scope
		};
	}

	class Modal extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["content"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.content === undefined && !('content' in props)) {
				console.warn("<Modal> was created without expected prop 'content'");
			}
		}

		get content() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set content(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.product = list[i];
		return child_ctx;
	}

	// (61:2) {#each products as product (product.id)}
	function create_each_block(key_1, ctx) {
		var first, current;

		var product_spread_levels = [
			ctx.product
		];

		let product_props = {};
		for (var i = 0; i < product_spread_levels.length; i += 1) {
			product_props = assign(product_props, product_spread_levels[i]);
		}
		var product = new Product({ props: product_props, $$inline: true });
		product.$on("add-to-cart", addToCart);
		product.$on("delete-cart-item", deleteCartItem);

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = empty();
				product.$$.fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				mount_component(product, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var product_changes = changed.products ? get_spread_update(product_spread_levels, [
					ctx.product
				]) : {};
				product.$set(product_changes);
			},

			i: function intro(local) {
				if (current) return;
				product.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				product.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(first);
				}

				product.$destroy(detaching);
			}
		};
	}

	// (76:0) {#if showModal}
	function create_if_block$1(ctx) {
		var current;

		var modal = new Modal({
			props: {
			$$slots: {
			default: [create_default_slot, ({ didAgree: closeable }) => ({ closeable })],
			footer: [create_footer_slot, ({ didAgree: closeable }) => ({ closeable })],
			content: [create_content_slot, ({ didAgree: closeable }) => ({ closeable })],
			header: [create_header_slot, ({ didAgree: closeable }) => ({ closeable })]
		},
			$$scope: { ctx }
		},
			$$inline: true
		});
		modal.$on("cancel", ctx.cancel_handler);
		modal.$on("close", ctx.close_handler);

		return {
			c: function create() {
				modal.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(modal, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				modal.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				modal.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				modal.$destroy(detaching);
			}
		};
	}

	// (82:4) <h1 slot="header">
	function create_header_slot(ctx) {
		var h1;

		return {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Hello!";
				attr(h1, "slot", "header");
				add_location(h1, file$2, 81, 4, 1634);
			},

			m: function mount(target, anchor) {
				insert(target, h1, anchor);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h1);
				}
			}
		};
	}

	// (83:4) <p slot="content">
	function create_content_slot(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Laboriosam quo atque quidem beatae natus, vero ratione quod autem cumque aspernatur repellat impedit dolorum expedita quas ab sunt distinctio aut assumenda unde ullam sequi deleniti alias quis. Assumenda cumque rerum ab cupiditate harum quia, quidem enim explicabo expedita dolorem ratione veniam voluptatibus eligendi amet molestiae impedit, eveniet quibusdam vero deleniti corrupti omnis, iure provident! Architecto odit accusantium nihil modi ipsum facilis voluptatem officiis dolorem quibusdam earum consectetur officia facere, fuga ducimus laborum magni iusto soluta omnis cupiditate quaerat. Aperiam rem doloremque recusandae architecto debitis, accusantium animi sequi esse vitae eius! Quos!";
				attr(p, "slot", "content");
				add_location(p, file$2, 82, 4, 1668);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (84:4) <button       slot="footer"       on:click={ ()=>showModal=false }       disabled={!closeable}       >
	function create_footer_slot(ctx) {
		var button, i, t, button_disabled_value, dispose;

		return {
			c: function create() {
				button = element("button");
				i = element("i");
				t = text("\n      Confirm");
				i.className = "fal fa-check";
				add_location(i, file$2, 88, 6, 2502);
				attr(button, "slot", "footer");
				button.disabled = button_disabled_value = !ctx.closeable;
				add_location(button, file$2, 83, 4, 2393);
				dispose = listen(button, "click", ctx.click_handler_1);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, i);
				append(button, t);
			},

			p: function update(changed, ctx) {
				if ((changed.closeable) && button_disabled_value !== (button_disabled_value = !ctx.closeable)) {
					button.disabled = button_disabled_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (77:2) <Modal     on:cancel={ ()=>showModal=false }     on:close={ ()=>showModal=false }     let:didAgree={closeable}     >
	function create_default_slot(ctx) {
		var t0, t1;

		return {
			c: function create() {
				t0 = space();
				t1 = space();
			},

			m: function mount(target, anchor) {
				insert(target, t0, anchor);
				insert(target, t1, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(t0);
					detach(t1);
				}
			}
		};
	}

	function create_fragment$2(ctx) {
		var div, each_blocks = [], each_1_lookup = new Map(), t0, button, i, t1, t2, textarea, t3, if_block_anchor, current, dispose;

		var each_value = ctx.products;

		const get_key = ctx => ctx.product.id;

		for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
			let child_ctx = get_each_context(ctx, each_value, i_1);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i_1] = create_each_block(key, child_ctx));
		}

		var if_block = (ctx.showModal) && create_if_block$1(ctx);

		return {
			c: function create() {
				div = element("div");

				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].c();

				t0 = space();
				button = element("button");
				i = element("i");
				t1 = text(" Show Modal");
				t2 = space();
				textarea = element("textarea");
				t3 = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				i.className = "fal fa-eye";
				add_location(i, file$2, 69, 4, 1378);
				add_location(button, file$2, 68, 2, 1333);
				div.className = "container";
				add_location(div, file$2, 55, 0, 1025);
				textarea.rows = "5";
				textarea.value = ctx.text;
				add_location(textarea, file$2, 73, 0, 1436);

				dispose = [
					listen(button, "click", ctx.click_handler),
					listen(textarea, "keydown", ctx.transform)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].m(div, null);

				append(div, t0);
				append(div, button);
				append(button, i);
				append(button, t1);
				insert(target, t2, anchor);
				insert(target, textarea, anchor);
				insert(target, t3, anchor);
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				const each_value = ctx.products;

				group_outros();
				each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, t0, get_each_context);
				check_outros();

				if (!current || changed.text) {
					textarea.value = ctx.text;
				}

				if (ctx.showModal) {
					if (!if_block) {
						if_block = create_if_block$1(ctx);
						if_block.c();
						if_block.i(1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					} else {
										if_block.i(1);
					}
				} else if (if_block) {
					group_outros();
					on_outro(() => {
						if_block.d(1);
						if_block = null;
					});

					if_block.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) each_blocks[i_1].i();

				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].o();

				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				for (i_1 = 0; i_1 < each_blocks.length; i_1 += 1) each_blocks[i_1].d();

				if (detaching) {
					detach(t2);
					detach(textarea);
					detach(t3);
				}

				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}

				run_all(dispose);
			}
		};
	}

	function addToCart(e)
	{
	  console.log(e.type, e.detail);
	}

	function deleteCartItem(e)
	{
	  console.log(e.type, e.detail);
	}

	function instance$2($$self, $$props, $$invalidate) {
		

	  let products = [
	    {
	      id: 'p1',
	      title: 'A book',
	      price: 9.99
	    }
	  ];

	  let showModal = false;
	  let text = 'This is some dummy text';

	  function transform(e) {
	    if (e.which !== 9) { // tab key
	      return
	    }
	    e.preventDefault();
	    const selectionStart = e.target.selectionStart;
	    const selectionEnd = e.target.selectionEnd;
	    const value = e.target.value;

	    $$invalidate('text', text =
	      value.slice(0, selectionStart) + 
	      value.slice(selectionStart, selectionEnd).toUpperCase() + 
	      value.slice(selectionEnd));
	  
	    tick().then( () => {
	      e.target.selectionStart = selectionStart;
	      e.target.selectionEnd = selectionEnd;
	    });
	  }
	  afterUpdate( () => {
	  });

		function click_handler() {
			const $$result = showModal=true;
			$$invalidate('showModal', showModal);
			return $$result;
		}

		function click_handler_1() {
			const $$result = showModal=false;
			$$invalidate('showModal', showModal);
			return $$result;
		}

		function cancel_handler() {
			const $$result = showModal=false;
			$$invalidate('showModal', showModal);
			return $$result;
		}

		function close_handler() {
			const $$result = showModal=false;
			$$invalidate('showModal', showModal);
			return $$result;
		}

		return {
			products,
			showModal,
			text,
			transform,
			click_handler,
			click_handler_1,
			cancel_handler,
			close_handler
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
