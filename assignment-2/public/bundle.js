
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

	/* src/Description.svelte generated by Svelte v3.4.2 */

	const file = "src/Description.svelte";

	function create_fragment(ctx) {
		var h1, t1, p, t3, ol, li0, t5, li1, t7, li2, t9, li3, t11, li4, t13, li5;

		return {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Assignment";
				t1 = space();
				p = element("p");
				p.textContent = "Solve these tasks.";
				t3 = space();
				ol = element("ol");
				li0 = element("li");
				li0.textContent = "Add a password input field and save the user input in a variable.";
				t5 = space();
				li1 = element("li");
				li1.textContent = "Output \"Too short\" if the password is shorter than 5 characters and \"Too long\" if it's longer than 10.";
				t7 = space();
				li2 = element("li");
				li2.textContent = "Output the password in a paragraph tag if it's between these boundaries.";
				t9 = space();
				li3 = element("li");
				li3.textContent = "Add a button and let the user add the passwords to an array.";
				t11 = space();
				li4 = element("li");
				li4.textContent = "Output the array values (= passwords) in a unordered list (ul tag).";
				t13 = space();
				li5 = element("li");
				li5.textContent = "Bonus: If a password is clicked, remove it from the list.";
				add_location(h1, file, 10, 0, 118);
				p.className = "svelte-15t6tj9";
				add_location(p, file, 12, 0, 139);
				li0.className = "svelte-15t6tj9";
				add_location(li0, file, 15, 2, 173);
				li1.className = "svelte-15t6tj9";
				add_location(li1, file, 16, 2, 250);
				li2.className = "svelte-15t6tj9";
				add_location(li2, file, 17, 2, 364);
				li3.className = "svelte-15t6tj9";
				add_location(li3, file, 18, 2, 448);
				li4.className = "svelte-15t6tj9";
				add_location(li4, file, 19, 2, 520);
				li5.className = "svelte-15t6tj9";
				add_location(li5, file, 20, 2, 599);
				add_location(ol, file, 14, 0, 166);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, h1, anchor);
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
				append(ol, t11);
				append(ol, li4);
				append(ol, t13);
				append(ol, li5);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(h1);
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

	/* src/PasswordField.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/PasswordField.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.pw = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	// (72:26) 
	function create_if_block_4(ctx) {
		var t;

		return {
			c: function create() {
				t = text(ctx.password);
			},

			m: function mount(target, anchor) {
				insert(target, t, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.password) {
					set_data(t, ctx.password);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	// (70:31) 
	function create_if_block_3(ctx) {
		var span;

		return {
			c: function create() {
				span = element("span");
				span.textContent = "Too long";
				span.className = "svelte-2ip4i9";
				add_location(span, file$1, 70, 2, 1433);
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(span);
				}
			}
		};
	}

	// (68:0) {#if password.length < 5 && password.length > 0 }
	function create_if_block_2(ctx) {
		var span;

		return {
			c: function create() {
				span = element("span");
				span.textContent = "Too short";
				span.className = "svelte-2ip4i9";
				add_location(span, file$1, 68, 2, 1376);
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(span);
				}
			}
		};
	}

	// (77:0) {#if passwordIsValid}
	function create_if_block_1(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "Add This Password";
				button.className = "svelte-2ip4i9";
				add_location(button, file$1, 77, 2, 1531);
				dispose = listen(button, "click", ctx.addPassword);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (81:0) {#if passwordsArray.length > 0}
	function create_if_block(ctx) {
		var h3, t_1, ul;

		var each_value = ctx.passwordsArray;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		return {
			c: function create() {
				h3 = element("h3");
				h3.textContent = "Current Passwords…";
				t_1 = space();
				ul = element("ul");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				add_location(h3, file$1, 81, 0, 1628);
				add_location(ul, file$1, 82, 0, 1656);
			},

			m: function mount(target, anchor) {
				insert(target, h3, anchor);
				insert(target, t_1, anchor);
				insert(target, ul, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(ul, null);
				}
			},

			p: function update(changed, ctx) {
				if (changed.removePassword || changed.passwordsArray) {
					each_value = ctx.passwordsArray;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ul, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h3);
					detach(t_1);
					detach(ul);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	// (84:2) {#each passwordsArray as pw, i}
	function create_each_block(ctx) {
		var li, a, t0_value = ctx.pw, t0, t1, dispose;

		return {
			c: function create() {
				li = element("li");
				a = element("a");
				t0 = text(t0_value);
				t1 = space();
				a.href = ctx.i;
				add_location(a, file$1, 85, 6, 1710);
				add_location(li, file$1, 84, 4, 1699);
				dispose = listen(a, "click", prevent_default(ctx.removePassword));
			},

			m: function mount(target, anchor) {
				insert(target, li, anchor);
				append(li, a);
				append(a, t0);
				append(li, t1);
			},

			p: function update(changed, ctx) {
				if ((changed.passwordsArray) && t0_value !== (t0_value = ctx.pw)) {
					set_data(t0, t0_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(li);
				}

				dispose();
			}
		};
	}

	function create_fragment$1(ctx) {
		var label, t1, input, t2, p, t3, t4, if_block2_anchor, dispose;

		function select_block_type(ctx) {
			if (ctx.password.length < 5 && ctx.password.length > 0) return create_if_block_2;
			if (ctx.password.length > 10) return create_if_block_3;
			if (ctx.passwordIsValid) return create_if_block_4;
		}

		var current_block_type = select_block_type(ctx);
		var if_block0 = current_block_type && current_block_type(ctx);

		var if_block1 = (ctx.passwordIsValid) && create_if_block_1(ctx);

		var if_block2 = (ctx.passwordsArray.length > 0) && create_if_block(ctx);

		return {
			c: function create() {
				label = element("label");
				label.textContent = "Enter your password";
				t1 = space();
				input = element("input");
				t2 = space();
				p = element("p");
				if (if_block0) if_block0.c();
				t3 = space();
				if (if_block1) if_block1.c();
				t4 = space();
				if (if_block2) if_block2.c();
				if_block2_anchor = empty();
				label.className = "svelte-2ip4i9";
				add_location(label, file$1, 64, 0, 1189);
				attr(input, "type", "password");
				input.placeholder = "Your password";
				input.className = "svelte-2ip4i9";
				add_location(input, file$1, 65, 0, 1224);
				p.className = "password-view svelte-2ip4i9";
				add_location(p, file$1, 66, 0, 1298);
				dispose = listen(input, "input", ctx.input_input_handler);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, label, anchor);
				insert(target, t1, anchor);
				insert(target, input, anchor);

				input.value = ctx.password;

				insert(target, t2, anchor);
				insert(target, p, anchor);
				if (if_block0) if_block0.m(p, null);
				insert(target, t3, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert(target, t4, anchor);
				if (if_block2) if_block2.m(target, anchor);
				insert(target, if_block2_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.password) input.value = ctx.password;

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if (if_block0) if_block0.d(1);
					if_block0 = current_block_type && current_block_type(ctx);
					if (if_block0) {
						if_block0.c();
						if_block0.m(p, null);
					}
				}

				if (ctx.passwordIsValid) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block_1(ctx);
						if_block1.c();
						if_block1.m(t4.parentNode, t4);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (ctx.passwordsArray.length > 0) {
					if (if_block2) {
						if_block2.p(changed, ctx);
					} else {
						if_block2 = create_if_block(ctx);
						if_block2.c();
						if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(label);
					detach(t1);
					detach(input);
					detach(t2);
					detach(p);
				}

				if (if_block0) if_block0.d();

				if (detaching) {
					detach(t3);
				}

				if (if_block1) if_block1.d(detaching);

				if (detaching) {
					detach(t4);
				}

				if (if_block2) if_block2.d(detaching);

				if (detaching) {
					detach(if_block2_anchor);
				}

				dispose();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let password = '';
	  let passwordsArray = [];
	  
	  function addPassword()
	  {
	    $$invalidate('passwordsArray', passwordsArray = [...passwordsArray, password]);
	    $$invalidate('password', password = '');
	  }

	  function removePassword(e)
	  {
	    const idx = e.target.getAttribute('href');
	    $$invalidate('passwordsArray', passwordsArray = passwordsArray.filter( (pw, i) => idx != i ));
	    console.log(passwordsArray);
	  }

		function input_input_handler() {
			password = this.value;
			$$invalidate('password', password);
		}

		let passwordIsValid;

		$$self.$$.update = ($$dirty = { password: 1 }) => {
			if ($$dirty.password) { $$invalidate('passwordIsValid', passwordIsValid = (password.length >= 5 && password.length <= 10)); }
		};

		return {
			password,
			passwordsArray,
			addPassword,
			removePassword,
			passwordIsValid,
			input_input_handler
		};
	}

	class PasswordField extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment$1, safe_not_equal, []);
		}
	}

	/* src/App.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/App.svelte";

	function create_fragment$2(ctx) {
		var div, t0, hr, t1, current;

		var passwordfield = new PasswordField({ $$inline: true });

		var description = new Description({ $$inline: true });

		return {
			c: function create() {
				div = element("div");
				passwordfield.$$.fragment.c();
				t0 = space();
				hr = element("hr");
				t1 = space();
				description.$$.fragment.c();
				hr.className = "svelte-h3g0tw";
				add_location(hr, file$2, 20, 2, 301);
				div.className = "container svelte-h3g0tw";
				add_location(div, file$2, 16, 0, 253);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				mount_component(passwordfield, div, null);
				append(div, t0);
				append(div, hr);
				append(div, t1);
				mount_component(description, div, null);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				passwordfield.$$.fragment.i(local);

				description.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				passwordfield.$$.fragment.o(local);
				description.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				passwordfield.$destroy();

				description.$destroy();
			}
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, null, create_fragment$2, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body,
		props: {
			name: 'world'
		}
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
