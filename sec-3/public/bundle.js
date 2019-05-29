
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

	/* src/ContactCard.svelte generated by Svelte v3.4.1 */

	const file = "src/ContactCard.svelte";

	// (71:4) {#if hasImage}
	function create_if_block(ctx) {
		var div, img;

		return {
			c: function create() {
				div = element("div");
				img = element("img");
				img.src = ctx.userImage;
				img.alt = ctx.userName;
				img.className = "svelte-1ft2nju";
				add_location(img, file, 72, 6, 1127);
				attr(div, "userimage:class", "thumb");
				add_location(div, file, 71, 4, 1091);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, img);
			},

			p: function update(changed, ctx) {
				if (changed.userImage) {
					img.src = ctx.userImage;
				}

				if (changed.userName) {
					img.alt = ctx.userName;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment(ctx) {
		var div2, header, t0, div0, h1, t1, t2, t3, t4, h2, t5, t6, div1, p, t7;

		var if_block = (ctx.hasImage) && create_if_block(ctx);

		return {
			c: function create() {
				div2 = element("div");
				header = element("header");
				if (if_block) if_block.c();
				t0 = space();
				div0 = element("div");
				h1 = element("h1");
				t1 = text(ctx.userName);
				t2 = text(" / ");
				t3 = text(ctx.initialName);
				t4 = space();
				h2 = element("h2");
				t5 = text(ctx.jobTitle);
				t6 = space();
				div1 = element("div");
				p = element("p");
				t7 = text(ctx.description);
				h1.className = "svelte-1ft2nju";
				add_location(h1, file, 76, 6, 1221);
				h2.className = "svelte-1ft2nju";
				add_location(h2, file, 77, 6, 1263);
				div0.className = "user-data svelte-1ft2nju";
				add_location(div0, file, 75, 4, 1191);
				header.className = "svelte-1ft2nju";
				add_location(header, file, 69, 2, 1059);
				add_location(p, file, 81, 4, 1338);
				div1.className = "description svelte-1ft2nju";
				add_location(div1, file, 80, 2, 1308);
				div2.className = "contact-card svelte-1ft2nju";
				add_location(div2, file, 68, 0, 1030);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, header);
				if (if_block) if_block.m(header, null);
				append(header, t0);
				append(header, div0);
				append(div0, h1);
				append(h1, t1);
				append(h1, t2);
				append(h1, t3);
				append(div0, t4);
				append(div0, h2);
				append(h2, t5);
				append(div2, t6);
				append(div2, div1);
				append(div1, p);
				append(p, t7);
			},

			p: function update(changed, ctx) {
				if (ctx.hasImage) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(header, t0);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (changed.userName) {
					set_data(t1, ctx.userName);
				}

				if (changed.jobTitle) {
					set_data(t5, ctx.jobTitle);
				}

				if (changed.description) {
					set_data(t7, ctx.description);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div2);
				}

				if (if_block) if_block.d();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let { userName, jobTitle, description, userImage } = $$props;

	  const initialName = userName;

		$$self.$set = $$props => {
			if ('userName' in $$props) $$invalidate('userName', userName = $$props.userName);
			if ('jobTitle' in $$props) $$invalidate('jobTitle', jobTitle = $$props.jobTitle);
			if ('description' in $$props) $$invalidate('description', description = $$props.description);
			if ('userImage' in $$props) $$invalidate('userImage', userImage = $$props.userImage);
		};

		let hasImage;

		$$self.$$.update = ($$dirty = { userImage: 1 }) => {
			if ($$dirty.userImage) { $$invalidate('hasImage', hasImage = userImage.trim() !== ''); }
		};

		return {
			userName,
			jobTitle,
			description,
			userImage,
			initialName,
			hasImage
		};
	}

	class ContactCard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["userName", "jobTitle", "description", "userImage"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.userName === undefined && !('userName' in props)) {
				console.warn("<ContactCard> was created without expected prop 'userName'");
			}
			if (ctx.jobTitle === undefined && !('jobTitle' in props)) {
				console.warn("<ContactCard> was created without expected prop 'jobTitle'");
			}
			if (ctx.description === undefined && !('description' in props)) {
				console.warn("<ContactCard> was created without expected prop 'description'");
			}
			if (ctx.userImage === undefined && !('userImage' in props)) {
				console.warn("<ContactCard> was created without expected prop 'userImage'");
			}
		}

		get userName() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set userName(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get jobTitle() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set jobTitle(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get description() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set description(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get userImage() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set userImage(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.4.1 */

	const file$1 = "src/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.contact = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	// (81:0) {:else}
	function create_else_block_1(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Enter information above to create the contact card.";
				add_location(p, file$1, 81, 2, 1907);
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

	// (79:0) {#if formState === 'invalid'}
	function create_if_block$1(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Input is invalid.";
				p.className = "error svelte-19g3iax";
				add_location(p, file$1, 79, 2, 1858);
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

	// (99:0) {:else}
	function create_else_block(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "No contacts found.";
				add_location(p, file$1, 99, 0, 2369);
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

	// (91:0) {#each createdContacts as contact, i (contact.id)}
	function create_each_block(key_1, ctx) {
		var h2, t0, t1_value = ctx.i + 1, t1, t2, current;

		var contactcard = new ContactCard({
			props: {
			userName: ctx.contact.name,
			jobTitle: ctx.contact.jobTitle,
			description: ctx.contact.desc,
			userImage: ctx.contact.imageUrl
		},
			$$inline: true
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				h2 = element("h2");
				t0 = text("# ");
				t1 = text(t1_value);
				t2 = space();
				contactcard.$$.fragment.c();
				add_location(h2, file$1, 91, 0, 2208);
				this.first = h2;
			},

			m: function mount(target, anchor) {
				insert(target, h2, anchor);
				append(h2, t0);
				append(h2, t1);
				insert(target, t2, anchor);
				mount_component(contactcard, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((!current || changed.createdContacts) && t1_value !== (t1_value = ctx.i + 1)) {
					set_data(t1, t1_value);
				}

				var contactcard_changes = {};
				if (changed.createdContacts) contactcard_changes.userName = ctx.contact.name;
				if (changed.createdContacts) contactcard_changes.jobTitle = ctx.contact.jobTitle;
				if (changed.createdContacts) contactcard_changes.description = ctx.contact.desc;
				if (changed.createdContacts) contactcard_changes.userImage = ctx.contact.imageUrl;
				contactcard.$set(contactcard_changes);
			},

			i: function intro(local) {
				if (current) return;
				contactcard.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				contactcard.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h2);
					detach(t2);
				}

				contactcard.$destroy(detaching);
			}
		};
	}

	function create_fragment$1(ctx) {
		var div4, div0, label0, t1, input0, t2, div1, label1, t4, input1, t5, div2, label2, t7, input2, t8, div3, label3, t10, textarea, t11, button0, t13, button1, t15, button2, t17, t18, each_blocks = [], each_1_lookup = new Map(), each_1_anchor, current, dispose;

		function select_block_type(ctx) {
			if (ctx.formState === 'invalid') return create_if_block$1;
			return create_else_block_1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		var each_value = ctx.createdContacts;

		const get_key = ctx => ctx.contact.id;

		for (var i = 0; i < each_value.length; i += 1) {
			let child_ctx = get_each_context(ctx, each_value, i);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
		}

		var each_1_else = null;

		if (!each_value.length) {
			each_1_else = create_else_block(ctx);
			each_1_else.c();
		}

		return {
			c: function create() {
				div4 = element("div");
				div0 = element("div");
				label0 = element("label");
				label0.textContent = "User Name";
				t1 = space();
				input0 = element("input");
				t2 = space();
				div1 = element("div");
				label1 = element("label");
				label1.textContent = "Job Title";
				t4 = space();
				input1 = element("input");
				t5 = space();
				div2 = element("div");
				label2 = element("label");
				label2.textContent = "Image URL";
				t7 = space();
				input2 = element("input");
				t8 = space();
				div3 = element("div");
				label3 = element("label");
				label3.textContent = "Description";
				t10 = space();
				textarea = element("textarea");
				t11 = space();
				button0 = element("button");
				button0.textContent = "Add Contact Card";
				t13 = space();
				button1 = element("button");
				button1.textContent = "Delete First";
				t15 = space();
				button2 = element("button");
				button2.textContent = "Delete Last";
				t17 = space();
				if_block.c();
				t18 = space();

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

				each_1_anchor = empty();
				label0.htmlFor = "userName";
				add_location(label0, file$1, 57, 4, 1133);
				attr(input0, "type", "text");
				input0.id = "userName";
				add_location(input0, file$1, 58, 4, 1177);
				div0.className = "form-control";
				add_location(div0, file$1, 56, 2, 1102);
				label1.htmlFor = "jobTitle";
				add_location(label1, file$1, 61, 4, 1273);
				attr(input1, "type", "text");
				input1.id = "jobTitle";
				add_location(input1, file$1, 62, 4, 1317);
				div1.className = "form-control";
				add_location(div1, file$1, 60, 2, 1242);
				label2.htmlFor = "image";
				add_location(label2, file$1, 65, 4, 1414);
				attr(input2, "type", "text");
				input2.id = "image";
				add_location(input2, file$1, 66, 4, 1455);
				div2.className = "form-control";
				add_location(div2, file$1, 64, 2, 1383);
				label3.htmlFor = "desc";
				add_location(label3, file$1, 69, 4, 1549);
				textarea.rows = "3";
				textarea.id = "desc";
				add_location(textarea, file$1, 70, 4, 1591);
				div3.className = "form-control";
				add_location(div3, file$1, 68, 2, 1518);
				div4.id = "form";
				div4.className = "svelte-19g3iax";
				add_location(div4, file$1, 55, 0, 1084);
				add_location(button0, file$1, 74, 0, 1665);
				add_location(button1, file$1, 75, 0, 1721);
				add_location(button2, file$1, 76, 0, 1774);

				dispose = [
					listen(input0, "input", ctx.input0_input_handler),
					listen(input1, "input", ctx.input1_input_handler),
					listen(input2, "input", ctx.input2_input_handler),
					listen(textarea, "input", ctx.textarea_input_handler),
					listen(button0, "click", ctx.addContact),
					listen(button1, "click", ctx.deleteFirst),
					listen(button2, "click", ctx.deleteLast)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div4, anchor);
				append(div4, div0);
				append(div0, label0);
				append(div0, t1);
				append(div0, input0);

				input0.value = ctx.name;

				append(div4, t2);
				append(div4, div1);
				append(div1, label1);
				append(div1, t4);
				append(div1, input1);

				input1.value = ctx.title;

				append(div4, t5);
				append(div4, div2);
				append(div2, label2);
				append(div2, t7);
				append(div2, input2);

				input2.value = ctx.image;

				append(div4, t8);
				append(div4, div3);
				append(div3, label3);
				append(div3, t10);
				append(div3, textarea);

				textarea.value = ctx.description;

				insert(target, t11, anchor);
				insert(target, button0, anchor);
				insert(target, t13, anchor);
				insert(target, button1, anchor);
				insert(target, t15, anchor);
				insert(target, button2, anchor);
				insert(target, t17, anchor);
				if_block.m(target, anchor);
				insert(target, t18, anchor);

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(target, anchor);

				insert(target, each_1_anchor, anchor);

				if (each_1_else) {
					each_1_else.m(target, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.name && (input0.value !== ctx.name)) input0.value = ctx.name;
				if (changed.title && (input1.value !== ctx.title)) input1.value = ctx.title;
				if (changed.image && (input2.value !== ctx.image)) input2.value = ctx.image;
				if (changed.description) textarea.value = ctx.description;

				if (current_block_type !== (current_block_type = select_block_type(ctx))) {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(t18.parentNode, t18);
					}
				}

				const each_value = ctx.createdContacts;

				group_outros();
				each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
				check_outros();

				if (each_value.length) {
					if (each_1_else) {
						each_1_else.d(1);
						each_1_else = null;
					}
				} else if (!each_1_else) {
					each_1_else = create_else_block(ctx);
					each_1_else.c();
					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
				}
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
					detach(div4);
					detach(t11);
					detach(button0);
					detach(t13);
					detach(button1);
					detach(t15);
					detach(button2);
					detach(t17);
				}

				if_block.d(detaching);

				if (detaching) {
					detach(t18);
				}

				for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d(detaching);

				if (detaching) {
					detach(each_1_anchor);
				}

				if (each_1_else) each_1_else.d(detaching);

				run_all(dispose);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let name = "Max";
	  let title = "";
	  let image = "";
	  let description = "";
	  let formState = 'empty';

	  let createdContacts = [];

	  function addContact() {
	    console.log(name, title, description);
	    if ( name.trim().length == 0 ||
	         title.trim().length == 0 ||
	         description.trim().length == 0
	      ) {
	      $$invalidate('formState', formState = 'invalid');
	      return
	    }
	    $$invalidate('createdContacts', createdContacts = [
	      ...createdContacts,
	      {
	        id: Math.random(),
	        name: name,
	        jobTitle: title,
	        imageUrl: image,
	        desc: description
	      }
	    ]);
	    $$invalidate('formState', formState = 'done');
	  }

	  function deleteFirst() {
	    // return array starting from second element (1)
	    $$invalidate('createdContacts', createdContacts = createdContacts.slice(1));
	  }
	  function deleteLast() {
	    // start at first element (0)
	    // end at element before the last element (-1)
	    $$invalidate('createdContacts', createdContacts = createdContacts.slice(0, -1));
	  }

		function input0_input_handler() {
			name = this.value;
			$$invalidate('name', name);
		}

		function input1_input_handler() {
			title = this.value;
			$$invalidate('title', title);
		}

		function input2_input_handler() {
			image = this.value;
			$$invalidate('image', image);
		}

		function textarea_input_handler() {
			description = this.value;
			$$invalidate('description', description);
		}

		return {
			name,
			title,
			image,
			description,
			formState,
			createdContacts,
			addContact,
			deleteFirst,
			deleteLast,
			input0_input_handler,
			input1_input_handler,
			input2_input_handler,
			textarea_input_handler
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
