
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

	/* src/svelte/components/Description.svelte generated by Svelte v3.4.1 */

	const file = "src/svelte/components/Description.svelte";

	function create_fragment(ctx) {
		var h3, t1, p, t3, ol, li0, t5, li1, t7, li2, t9, li3;

		return {
			c: function create() {
				h3 = element("h3");
				h3.textContent = "Assignment";
				t1 = space();
				p = element("p");
				p.textContent = "Solve these tasks.";
				t3 = space();
				ol = element("ol");
				li0 = element("li");
				li0.textContent = "Add an input field that allows users to enter a course goal.";
				t5 = space();
				li1 = element("li");
				li1.textContent = "Output the user input in a h1 tag.";
				t7 = space();
				li2 = element("li");
				li2.textContent = "Color the output red (e.g. by adding a class) if it contains at least one exclamation mark.";
				t9 = space();
				li3 = element("li");
				li3.textContent = "Put the h1 tag + output into a separate component to which you pass the user input";
				add_location(h3, file, 0, 0, 0);
				add_location(p, file, 2, 0, 21);
				add_location(li0, file, 5, 2, 55);
				add_location(li1, file, 6, 2, 127);
				add_location(li2, file, 7, 2, 173);
				add_location(li3, file, 10, 2, 284);
				add_location(ol, file, 4, 0, 48);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, h3, anchor);
				insert(target, t1, anchor);
				insert(target, p, anchor);
				insert(target, t3, anchor);
				insert(target, ol, anchor);
				append(ol, li0);
				append(ol, t5);
				append(ol, li1);
				append(ol, t7);
				append(ol, li2);
				append(ol, t9);
				append(ol, li3);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(h3);
					detach(t1);
					detach(p);
					detach(t3);
					detach(ol);
				}
			}
		};
	}

	class Description extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, null, create_fragment, safe_not_equal, []);
		}
	}

	/* src/svelte/components/CourseGoal.svelte generated by Svelte v3.4.1 */

	const file$1 = "src/svelte/components/CourseGoal.svelte";

	function create_fragment$1(ctx) {
		var h1, t;

		return {
			c: function create() {
				h1 = element("h1");
				t = text(ctx.text);
				h1.className = "svelte-1j4wqbm";
				toggle_class(h1, "important", ctx.isImportant);
				toggle_class(h1, "notsure", ctx.isNotSure);
				add_location(h1, file$1, 17, 0, 227);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, h1, anchor);
				append(h1, t);
			},

			p: function update(changed, ctx) {
				if (changed.text) {
					set_data(t, ctx.text);
				}

				if (changed.isImportant) {
					toggle_class(h1, "important", ctx.isImportant);
				}

				if (changed.isNotSure) {
					toggle_class(h1, "notsure", ctx.isNotSure);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(h1);
				}
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let { text } = $$props;

		$$self.$set = $$props => {
			if ('text' in $$props) $$invalidate('text', text = $$props.text);
		};

		let isImportant, isNotSure;

		$$self.$$.update = ($$dirty = { text: 1 }) => {
			if ($$dirty.text) { $$invalidate('isImportant', isImportant = text.includes('!')); }
			if ($$dirty.text) { $$invalidate('isNotSure', isNotSure = text.includes('?')); }
		};

		return { text, isImportant, isNotSure };
	}

	class CourseGoal extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment$1, safe_not_equal, ["text"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.text === undefined && !('text' in props)) {
				console.warn("<CourseGoal> was created without expected prop 'text'");
			}
		}

		get text() {
			throw new Error("<CourseGoal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set text(value) {
			throw new Error("<CourseGoal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/svelte/App.svelte generated by Svelte v3.4.1 */

	const file$2 = "src/svelte/App.svelte";

	function create_fragment$2(ctx) {
		var t0, form, input, t1, hr, t2, current, dispose;

		var coursegoal = new CourseGoal({
			props: { text: ctx.text },
			$$inline: true
		});

		var description = new Description({ $$inline: true });

		return {
			c: function create() {
				coursegoal.$$.fragment.c();
				t0 = space();
				form = element("form");
				input = element("input");
				t1 = space();
				hr = element("hr");
				t2 = space();
				description.$$.fragment.c();
				attr(input, "type", "text");
				input.id = "course-goal";
				input.className = "svelte-1lxejrr";
				add_location(input, file$2, 24, 2, 475);
				add_location(form, file$2, 23, 0, 426);
				add_location(hr, file$2, 27, 0, 521);
				dispose = listen(form, "submit", prevent_default(ctx.updateText));
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				mount_component(coursegoal, target, anchor);
				insert(target, t0, anchor);
				insert(target, form, anchor);
				append(form, input);
				insert(target, t1, anchor);
				insert(target, hr, anchor);
				insert(target, t2, anchor);
				mount_component(description, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var coursegoal_changes = {};
				if (changed.text) coursegoal_changes.text = ctx.text;
				coursegoal.$set(coursegoal_changes);
			},

			i: function intro(local) {
				if (current) return;
				coursegoal.$$.fragment.i(local);

				description.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				coursegoal.$$.fragment.o(local);
				description.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				coursegoal.$destroy(detaching);

				if (detaching) {
					detach(t0);
					detach(form);
					detach(t1);
					detach(hr);
					detach(t2);
				}

				description.$destroy(detaching);

				dispose();
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		

	  let text = '';
	  
	  const updateText = () => { const $$result = text = document.querySelector('#course-goal').value; $$invalidate('text', text); return $$result; };

		return { text, updateText };
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
		}
	}

	const app = new App({
	  target: document.body
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
