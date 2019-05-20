
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

	function toggle_class(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
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

	/* src/ContactCard.svelte generated by Svelte v3.3.0 */

	const file = "src/ContactCard.svelte";

	function create_fragment(ctx) {
		var div3, header, div0, img, t0, div1, h1, t1, t2, h2, t3, t4, div2, p;

		return {
			c: function create() {
				div3 = element("div");
				header = element("header");
				div0 = element("div");
				img = element("img");
				t0 = space();
				div1 = element("div");
				h1 = element("h1");
				t1 = text(ctx.userName);
				t2 = space();
				h2 = element("h2");
				t3 = text(ctx.jobTitle);
				t4 = space();
				div2 = element("div");
				p = element("p");
				img.src = ctx.userImage;
				img.alt = "";
				img.className = "svelte-1tyscwk";
				add_location(img, file, 80, 6, 1326);
				div0.className = "thumb svelte-1tyscwk";
				toggle_class(div0, "thumb-placeholder", !ctx.userImage);
				add_location(div0, file, 79, 4, 1261);
				h1.className = "svelte-1tyscwk";
				add_location(h1, file, 83, 6, 1400);
				h2.className = "svelte-1tyscwk";
				add_location(h2, file, 84, 6, 1426);
				div1.className = "user-data svelte-1tyscwk";
				add_location(div1, file, 82, 4, 1370);
				header.className = "svelte-1tyscwk";
				add_location(header, file, 77, 2, 1167);
				add_location(p, file, 88, 4, 1501);
				div2.className = "description svelte-1tyscwk";
				add_location(div2, file, 87, 2, 1471);
				div3.className = "contact-card svelte-1tyscwk";
				add_location(div3, file, 76, 0, 1138);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div3, anchor);
				append(div3, header);
				append(header, div0);
				append(div0, img);
				append(header, t0);
				append(header, div1);
				append(div1, h1);
				append(h1, t1);
				append(div1, t2);
				append(div1, h2);
				append(h2, t3);
				append(div3, t4);
				append(div3, div2);
				append(div2, p);
				p.innerHTML = ctx.jobDescription;
			},

			p: function update(changed, ctx) {
				if (changed.userImage) {
					img.src = ctx.userImage;
					toggle_class(div0, "thumb-placeholder", !ctx.userImage);
				}

				if (changed.userName) {
					set_data(t1, ctx.userName);
				}

				if (changed.jobTitle) {
					set_data(t3, ctx.jobTitle);
				}

				if (changed.jobDescription) {
					p.innerHTML = ctx.jobDescription;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div3);
				}
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		// props are exported
	  let { userName, userAge, jobTitle, jobDescription, userImage } = $$props;
	  // prop defaults

		$$self.$set = $$props => {
			if ('userName' in $$props) $$invalidate('userName', userName = $$props.userName);
			if ('userAge' in $$props) $$invalidate('userAge', userAge = $$props.userAge);
			if ('jobTitle' in $$props) $$invalidate('jobTitle', jobTitle = $$props.jobTitle);
			if ('jobDescription' in $$props) $$invalidate('jobDescription', jobDescription = $$props.jobDescription);
			if ('userImage' in $$props) $$invalidate('userImage', userImage = $$props.userImage);
		};

		return {
			userName,
			userAge,
			jobTitle,
			jobDescription,
			userImage
		};
	}

	class ContactCard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["userName", "userAge", "jobTitle", "jobDescription", "userImage"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.userName === undefined && !('userName' in props)) {
				console.warn("<ContactCard> was created without expected prop 'userName'");
			}
			if (ctx.userAge === undefined && !('userAge' in props)) {
				console.warn("<ContactCard> was created without expected prop 'userAge'");
			}
			if (ctx.jobTitle === undefined && !('jobTitle' in props)) {
				console.warn("<ContactCard> was created without expected prop 'jobTitle'");
			}
			if (ctx.jobDescription === undefined && !('jobDescription' in props)) {
				console.warn("<ContactCard> was created without expected prop 'jobDescription'");
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

		get userAge() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set userAge(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get jobTitle() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set jobTitle(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get jobDescription() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set jobDescription(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get userImage() {
			throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set userImage(value) {
			throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.3.0 */

	const file$1 = "src/App.svelte";

	function create_fragment$1(ctx) {
		var section, h1, t0, t1, t2, t3, p, t4, t5, t6, t7, button, t9, div0, label0, t11, input0, t12, div1, label1, t14, input1, t15, div2, label2, t17, input2, t18, div3, label3, t20, textarea, t21, current, dispose;

		var contactcard = new ContactCard({
			props: {
			userName: ctx.name,
			userAge: ctx.age,
			jobTitle: ctx.jobTitle,
			jobDescription: ctx.jobDescription,
			userImage: ctx.image
		},
			$$inline: true
		});

		return {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				t0 = text("Hello ");
				t1 = text(ctx.uppercaseName);
				t2 = text("!");
				t3 = space();
				p = element("p");
				t4 = text("My age is ");
				t5 = text(ctx.age);
				t6 = text(".");
				t7 = space();
				button = element("button");
				button.textContent = "Change Age";
				t9 = space();
				div0 = element("div");
				label0 = element("label");
				label0.textContent = "Your name:";
				t11 = space();
				input0 = element("input");
				t12 = space();
				div1 = element("div");
				label1 = element("label");
				label1.textContent = "Your job title:";
				t14 = space();
				input1 = element("input");
				t15 = space();
				div2 = element("div");
				label2 = element("label");
				label2.textContent = "Thumbnail Path:";
				t17 = space();
				input2 = element("input");
				t18 = space();
				div3 = element("div");
				label3 = element("label");
				label3.textContent = "Your job description:";
				t20 = space();
				textarea = element("textarea");
				t21 = space();
				contactcard.$$.fragment.c();
				h1.className = "svelte-1ucbz36";
				add_location(h1, file$1, 47, 2, 830);
				add_location(p, file$1, 48, 2, 864);
				button.className = "danger";
				add_location(button, file$1, 50, 2, 893);
				add_location(label0, file$1, 52, 4, 974);
				attr(input0, "type", "text");
				input0.value = ctx.name;
				input0.placeholder = "Your name";
				add_location(input0, file$1, 53, 4, 1004);
				add_location(div0, file$1, 51, 2, 964);
				add_location(label1, file$1, 56, 4, 1104);
				attr(input1, "type", "text");
				input1.value = ctx.jobTitle;
				input1.placeholder = "Your job title";
				add_location(input1, file$1, 57, 4, 1139);
				add_location(div1, file$1, 55, 2, 1094);
				add_location(label2, file$1, 60, 4, 1252);
				attr(input2, "type", "text");
				input2.size = "75";
				input2.value = ctx.image;
				input2.placeholder = "Image thumbnail path";
				add_location(input2, file$1, 61, 4, 1287);
				add_location(div2, file$1, 59, 2, 1242);
				add_location(label3, file$1, 64, 4, 1410);
				textarea.cols = "30";
				textarea.rows = "5";
				textarea.placeholder = "Your job description";
				add_location(textarea, file$1, 65, 4, 1451);
				add_location(div3, file$1, 63, 2, 1400);
				section.className = "container";
				add_location(section, file$1, 45, 0, 799);

				dispose = [
					listen(button, "click", ctx.incrementAge),
					listen(input0, "input", ctx.input0_input_handler),
					listen(input1, "input", ctx.input1_input_handler),
					listen(input2, "input", ctx.input2_input_handler),
					listen(textarea, "input", ctx.textarea_input_handler)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, section, anchor);
				append(section, h1);
				append(h1, t0);
				append(h1, t1);
				append(h1, t2);
				append(section, t3);
				append(section, p);
				append(p, t4);
				append(p, t5);
				append(p, t6);
				append(section, t7);
				append(section, button);
				append(section, t9);
				append(section, div0);
				append(div0, label0);
				append(div0, t11);
				append(div0, input0);

				input0.value = ctx.name;

				append(section, t12);
				append(section, div1);
				append(div1, label1);
				append(div1, t14);
				append(div1, input1);

				input1.value = ctx.jobTitle;

				append(section, t15);
				append(section, div2);
				append(div2, label2);
				append(div2, t17);
				append(div2, input2);

				input2.value = ctx.image;

				append(section, t18);
				append(section, div3);
				append(div3, label3);
				append(div3, t20);
				append(div3, textarea);

				textarea.value = ctx.jobDescription;

				append(section, t21);
				mount_component(contactcard, section, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if (!current || changed.uppercaseName) {
					set_data(t1, ctx.uppercaseName);
				}

				if (!current || changed.age) {
					set_data(t5, ctx.age);
				}

				if (changed.name && (input0.value !== ctx.name)) input0.value = ctx.name;

				if (!current || changed.name) {
					input0.value = ctx.name;
				}

				if (changed.jobTitle && (input1.value !== ctx.jobTitle)) input1.value = ctx.jobTitle;

				if (!current || changed.jobTitle) {
					input1.value = ctx.jobTitle;
				}

				if (changed.image && (input2.value !== ctx.image)) input2.value = ctx.image;

				if (!current || changed.image) {
					input2.value = ctx.image;
				}

				if (changed.jobDescription) textarea.value = ctx.jobDescription;

				var contactcard_changes = {};
				if (changed.name) contactcard_changes.userName = ctx.name;
				if (changed.age) contactcard_changes.userAge = ctx.age;
				if (changed.jobTitle) contactcard_changes.jobTitle = ctx.jobTitle;
				if (changed.jobDescription) contactcard_changes.jobDescription = ctx.jobDescription;
				if (changed.image) contactcard_changes.userImage = ctx.image;
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
					detach(section);
				}

				contactcard.$destroy();

				run_all(dispose);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let name = '';
	  let jobTitle = '';
	  let jobDescription = '';
	  let image = 'https://upload.wikimedia.org/wikipedia/commons/8/8d/George_Clooney_2016.jpg';
	  let age = 30;

	  // ------------------------------
	  // methods

	  function incrementAge() {
	    $$invalidate('age', age += 1);
	  }

		function input0_input_handler() {
			name = this.value;
			$$invalidate('name', name);
		}

		function input1_input_handler() {
			jobTitle = this.value;
			$$invalidate('jobTitle', jobTitle);
		}

		function input2_input_handler() {
			image = this.value;
			$$invalidate('image', image);
		}

		function textarea_input_handler() {
			jobDescription = this.value;
			$$invalidate('jobDescription', jobDescription);
		}

		let uppercaseName;

		$$self.$$.update = ($$dirty = { name: 1 }) => {
			if ($$dirty.name) { $$invalidate('uppercaseName', uppercaseName = name.toUpperCase()); }
			if ($$dirty.name) { if (name === 'Maximillian') {
	        $$invalidate('age', age = 50);
	      } else {
	        $$invalidate('age', age = 30);
	      } }
		};

		return {
			name,
			jobTitle,
			jobDescription,
			image,
			age,
			incrementAge,
			uppercaseName,
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
	  target: document.body,
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
