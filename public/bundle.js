
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

	/* src/App.svelte generated by Svelte v3.3.0 */

	const file = "src/App.svelte";

	function create_fragment(ctx) {
		var section, h1, t0, t1, t2, t3, p0, t4, t5, t6, t7, p1, t8, t9_value = ctx.name.toUpperCase(), t9, t10, p2, t11, t12, t13, p3, t14, t15_value = ctx.age+1, t15, t16, button, t18, div0, label0, t20, input0, t21, div1, label1, t23, input1, dispose;

		return {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				t0 = text("Hello ");
				t1 = text(ctx.name);
				t2 = text("!");
				t3 = space();
				p0 = element("p");
				t4 = text("My age is ");
				t5 = text(ctx.age);
				t6 = text(".");
				t7 = space();
				p1 = element("p");
				t8 = text("Uppercase name: ");
				t9 = text(t9_value);
				t10 = space();
				p2 = element("p");
				t11 = text("Uppercase name from labelled statement: ");
				t12 = text(ctx.uppercaseName);
				t13 = space();
				p3 = element("p");
				t14 = text("Name + 1: ");
				t15 = text(t15_value);
				t16 = space();
				button = element("button");
				button.textContent = "Change Age";
				t18 = space();
				div0 = element("div");
				label0 = element("label");
				label0.textContent = "using on:input for 2-way binding…";
				t20 = space();
				input0 = element("input");
				t21 = space();
				div1 = element("div");
				label1 = element("label");
				label1.textContent = "using bind.value for 2-way binding…";
				t23 = space();
				input1 = element("input");
				h1.className = "svelte-1ucbz36";
				add_location(h1, file, 39, 2, 617);
				add_location(p0, file, 40, 2, 642);
				add_location(p1, file, 41, 2, 668);
				add_location(p2, file, 42, 2, 714);
				add_location(p3, file, 43, 2, 779);
				add_location(button, file, 45, 2, 807);
				add_location(label0, file, 49, 4, 938);
				attr(input0, "type", "text");
				input0.value = ctx.name;
				add_location(input0, file, 50, 4, 991);
				add_location(div0, file, 48, 2, 928);
				add_location(label1, file, 53, 4, 1070);
				attr(input1, "type", "text");
				input1.value = ctx.name;
				add_location(input1, file, 54, 4, 1125);
				add_location(div1, file, 52, 2, 1060);
				section.className = "container";
				add_location(section, file, 38, 0, 587);

				dispose = [
					listen(button, "click", ctx.incrementAge),
					listen(input0, "input", ctx.nameInput),
					listen(input1, "input", ctx.input1_input_handler)
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
				append(section, p0);
				append(p0, t4);
				append(p0, t5);
				append(p0, t6);
				append(section, t7);
				append(section, p1);
				append(p1, t8);
				append(p1, t9);
				append(section, t10);
				append(section, p2);
				append(p2, t11);
				append(p2, t12);
				append(section, t13);
				append(section, p3);
				append(p3, t14);
				append(p3, t15);
				append(section, t16);
				append(section, button);
				append(section, t18);
				append(section, div0);
				append(div0, label0);
				append(div0, t20);
				append(div0, input0);
				append(section, t21);
				append(section, div1);
				append(div1, label1);
				append(div1, t23);
				append(div1, input1);

				input1.value = ctx.name;
			},

			p: function update(changed, ctx) {
				if (changed.name) {
					set_data(t1, ctx.name);
				}

				if (changed.age) {
					set_data(t5, ctx.age);
				}

				if ((changed.name) && t9_value !== (t9_value = ctx.name.toUpperCase())) {
					set_data(t9, t9_value);
				}

				if (changed.uppercaseName) {
					set_data(t12, ctx.uppercaseName);
				}

				if ((changed.age) && t15_value !== (t15_value = ctx.age+1)) {
					set_data(t15, t15_value);
				}

				if (changed.name) {
					input0.value = ctx.name;
				}

				if (changed.name && (input1.value !== ctx.name)) input1.value = ctx.name;

				if (changed.name) {
					input1.value = ctx.name;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(section);
				}

				run_all(dispose);
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let name = 'Max';
	  let age = 30;

	  // ------------------------------
	  // methods

	  function incrementAge() {
	    $$invalidate('age', age += 1);
	  }

	  function nameInput(e) {
	    $$invalidate('name', name = e.target.value);
	  }

		function input1_input_handler() {
			name = this.value;
			$$invalidate('name', name);
		}

		let uppercaseName;

		$$self.$$.update = ($$dirty = { name: 1 }) => {
			if ($$dirty.name) { $$invalidate('uppercaseName', uppercaseName = name.toUpperCase()); }
			if ($$dirty.name) { if (name === 'Maximillian') {
	        $$invalidate('age', age = 50);
	      } }
		};

		return {
			name,
			age,
			incrementAge,
			nameInput,
			uppercaseName,
			input1_input_handler
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, []);
		}
	}

	const app = new App({
	  target: document.body,
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
