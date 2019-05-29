
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

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
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

	/* src/svelte/components/ContactCard.svelte generated by Svelte v3.3.0 */

	const file = "src/svelte/components/ContactCard.svelte";

	// (69:4) {#if userImage}
	function create_if_block(ctx) {
		var div, img;

		return {
			c: function create() {
				div = element("div");
				img = element("img");
				img.src = ctx.userImage;
				img.alt = ctx.userName;
				img.className = "svelte-p7z0xn";
				add_location(img, file, 70, 6, 1096);
				div.className = "thumb svelte-p7z0xn";
				add_location(div, file, 69, 4, 1070);
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
		var div2, header, t0, div0, h1, t1, t2, h2, t3, t4, div1, p, t5;

		var if_block = (ctx.userImage) && create_if_block(ctx);

		return {
			c: function create() {
				div2 = element("div");
				header = element("header");
				if (if_block) if_block.c();
				t0 = space();
				div0 = element("div");
				h1 = element("h1");
				t1 = text(ctx.userName);
				t2 = space();
				h2 = element("h2");
				t3 = text(ctx.jobTitle);
				t4 = space();
				div1 = element("div");
				p = element("p");
				t5 = text(ctx.description);
				h1.className = "svelte-p7z0xn";
				add_location(h1, file, 74, 6, 1190);
				h2.className = "svelte-p7z0xn";
				add_location(h2, file, 75, 6, 1216);
				div0.className = "user-data svelte-p7z0xn";
				add_location(div0, file, 73, 4, 1160);
				header.className = "svelte-p7z0xn";
				add_location(header, file, 67, 2, 1037);
				add_location(p, file, 79, 4, 1291);
				div1.className = "description svelte-p7z0xn";
				add_location(div1, file, 78, 2, 1261);
				div2.className = "contact-card svelte-p7z0xn";
				add_location(div2, file, 66, 0, 1008);
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
				append(div0, t2);
				append(div0, h2);
				append(h2, t3);
				append(div2, t4);
				append(div2, div1);
				append(div1, p);
				append(p, t5);
			},

			p: function update(changed, ctx) {
				if (ctx.userImage) {
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
					set_data(t3, ctx.jobTitle);
				}

				if (changed.description) {
					set_data(t5, ctx.description);
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

		$$self.$set = $$props => {
			if ('userName' in $$props) $$invalidate('userName', userName = $$props.userName);
			if ('jobTitle' in $$props) $$invalidate('jobTitle', jobTitle = $$props.jobTitle);
			if ('description' in $$props) $$invalidate('description', description = $$props.description);
			if ('userImage' in $$props) $$invalidate('userImage', userImage = $$props.userImage);
		};

		return {
			userName,
			jobTitle,
			description,
			userImage
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

	/* src/svelte/App.svelte generated by Svelte v3.3.0 */

	const file$1 = "src/svelte/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.contact = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	// (86:0) {#if formState === 'invalid'}
	function create_if_block$1(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Invalid input.";
				p.className = "err svelte-nre70a";
				add_location(p, file$1, 86, 2, 1857);
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
				p.textContent = "Please start adding some contacts, we found none!";
				add_location(p, file$1, 99, 2, 2115);
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

	// (92:0) {#each createdContacts as contact, i}
	function create_each_block(ctx) {
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
			c: function create() {
				h2 = element("h2");
				t0 = text("# ");
				t1 = text(t1_value);
				t2 = space();
				contactcard.$$.fragment.c();
				add_location(h2, file$1, 92, 2, 1944);
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
		var form, div0, label0, t1, input0, t2, div1, label1, t4, input1, t5, div2, label2, t7, input2, t8, div3, label3, t10, textarea, t11, button, t13, a0, t15, a1, t17, t18, hr, t19, each_1_anchor, current, dispose;

		var if_block = (ctx.formState === 'invalid') && create_if_block$1(ctx);

		var each_value = ctx.createdContacts;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		function outro_block(i, detaching, local) {
			if (each_blocks[i]) {
				if (detaching) {
					on_outro(() => {
						each_blocks[i].d(detaching);
						each_blocks[i] = null;
					});
				}

				each_blocks[i].o(local);
			}
		}

		var each_1_else = null;

		if (!each_value.length) {
			each_1_else = create_else_block(ctx);
			each_1_else.c();
		}

		return {
			c: function create() {
				form = element("form");
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
				button = element("button");
				button.textContent = "Add Contact Card";
				t13 = text("\n\nDelete: \n");
				a0 = element("a");
				a0.textContent = "First";
				t15 = text(" | \n");
				a1 = element("a");
				a1.textContent = "Last";
				t17 = space();
				if (if_block) if_block.c();
				t18 = space();
				hr = element("hr");
				t19 = space();

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
				label0.htmlFor = "userName";
				add_location(label0, file$1, 61, 4, 1028);
				attr(input0, "type", "text");
				input0.id = "userName";
				input0.className = "svelte-nre70a";
				add_location(input0, file$1, 62, 4, 1072);
				div0.className = "form-control";
				add_location(div0, file$1, 60, 2, 997);
				label1.htmlFor = "jobTitle";
				add_location(label1, file$1, 65, 4, 1168);
				attr(input1, "type", "text");
				input1.id = "jobTitle";
				input1.className = "svelte-nre70a";
				add_location(input1, file$1, 66, 4, 1212);
				div1.className = "form-control";
				add_location(div1, file$1, 64, 2, 1137);
				label2.htmlFor = "image";
				add_location(label2, file$1, 69, 4, 1309);
				attr(input2, "type", "text");
				input2.id = "image";
				input2.className = "svelte-nre70a";
				add_location(input2, file$1, 70, 4, 1350);
				div2.className = "form-control";
				add_location(div2, file$1, 68, 2, 1278);
				label3.htmlFor = "desc";
				add_location(label3, file$1, 73, 4, 1444);
				textarea.rows = "3";
				textarea.id = "desc";
				add_location(textarea, file$1, 74, 4, 1486);
				div3.className = "form-control";
				add_location(div3, file$1, 72, 2, 1413);
				button.type = "submit";
				add_location(button, file$1, 76, 2, 1554);
				form.id = "form";
				form.className = "svelte-nre70a";
				add_location(form, file$1, 59, 0, 978);
				a0.href = "#";
				add_location(a0, file$1, 80, 0, 1657);
				a1.href = "#";
				add_location(a1, file$1, 83, 0, 1766);
				hr.className = "svelte-nre70a";
				add_location(hr, file$1, 89, 0, 1898);

				dispose = [
					listen(input0, "input", ctx.input0_input_handler),
					listen(input1, "input", ctx.input1_input_handler),
					listen(input2, "input", ctx.input2_input_handler),
					listen(textarea, "input", ctx.textarea_input_handler),
					listen(button, "click", prevent_default(ctx.addContact)),
					listen(a0, "click", prevent_default(ctx.click_handler)),
					listen(a1, "click", prevent_default(ctx.deleteLast))
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, form, anchor);
				append(form, div0);
				append(div0, label0);
				append(div0, t1);
				append(div0, input0);

				input0.value = ctx.name;

				append(form, t2);
				append(form, div1);
				append(div1, label1);
				append(div1, t4);
				append(div1, input1);

				input1.value = ctx.title;

				append(form, t5);
				append(form, div2);
				append(div2, label2);
				append(div2, t7);
				append(div2, input2);

				input2.value = ctx.image;

				append(form, t8);
				append(form, div3);
				append(div3, label3);
				append(div3, t10);
				append(div3, textarea);

				textarea.value = ctx.description;

				append(form, t11);
				append(form, button);
				insert(target, t13, anchor);
				insert(target, a0, anchor);
				insert(target, t15, anchor);
				insert(target, a1, anchor);
				insert(target, t17, anchor);
				if (if_block) if_block.m(target, anchor);
				insert(target, t18, anchor);
				insert(target, hr, anchor);
				insert(target, t19, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(target, anchor);
				}

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

				if (ctx.formState === 'invalid') {
					if (!if_block) {
						if_block = create_if_block$1(ctx);
						if_block.c();
						if_block.m(t18.parentNode, t18);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (changed.createdContacts) {
					each_value = ctx.createdContacts;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							each_blocks[i].i(1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].i(1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();
					for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
					check_outros();
				}

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
				each_blocks = each_blocks.filter(Boolean);
				for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(form);
					detach(t13);
					detach(a0);
					detach(t15);
					detach(a1);
					detach(t17);
				}

				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(t18);
					detach(hr);
					detach(t19);
				}

				destroy_each(each_blocks, detaching);

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
	  let formState = "empty";

	  let createdContacts = [];

	  function addContact() {
	    if (
	      name.trim().length == 0 ||
	      title.trim().length == 0 ||
	      description.trim().length == 0
	    ) {
	      $$invalidate('formState', formState = "invalid");
	      return;
	    }
	    $$invalidate('createdContacts', createdContacts = [
	      ...createdContacts,
	      {
	        name: name,
	        jobTitle: title,
	        imageUrl: image,
	        desc: description
	      }
	    ]);
	    $$invalidate('formState', formState = "done");
	  }

	  function deleteLast() {
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

		function click_handler(event) {
		  createdContacts = createdContacts.slice(1); $$invalidate('createdContacts', createdContacts);
		}

		return {
			name,
			title,
			image,
			description,
			formState,
			createdContacts,
			addContact,
			deleteLast,
			input0_input_handler,
			input1_input_handler,
			input2_input_handler,
			textarea_input_handler,
			click_handler
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
		}
	}

	const app = new App({
	  target: document.body,
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
