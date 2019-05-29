
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
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
            while (binding_callbacks.length)
                binding_callbacks.shift()();
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
        while (i--)
            old_indexes[old_blocks[i].key] = i;
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
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            if (block.i)
                block.i(1);
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
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
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
            }
            else {
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
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
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
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
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
                if (index !== -1)
                    callbacks.splice(index, 1);
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

    /* src/Product.svelte generated by Svelte v3.4.4 */

    const file = "src/Product.svelte";

    function create_fragment(ctx) {
    	var article, div4, div0, t0, t1, div1, t2, t3, div2, t4, t5, div3, button, dispose;

    	return {
    		c: function create() {
    			article = element("article");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(ctx.id);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(ctx.title);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(ctx.priceFmt);
    			t5 = space();
    			div3 = element("div");
    			button = element("button");
    			button.textContent = "Add";
    			div0.className = "id svelte-167z5ri";
    			add_location(div0, file, 92, 4, 1548);
    			div1.className = "title svelte-167z5ri";
    			add_location(div1, file, 93, 4, 1579);
    			div2.className = "price svelte-167z5ri";
    			add_location(div2, file, 94, 4, 1616);
    			button.className = "svelte-167z5ri";
    			add_location(button, file, 96, 6, 1684);
    			div3.className = "buttons svelte-167z5ri";
    			add_location(div3, file, 95, 4, 1656);
    			div4.className = "product svelte-167z5ri";
    			add_location(div4, file, 91, 2, 1522);
    			article.className = "svelte-167z5ri";
    			add_location(article, file, 90, 0, 1510);
    			dispose = listen(button, "click", ctx.addToCart);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, article, anchor);
    			append(article, div4);
    			append(div4, div0);
    			append(div0, t0);
    			append(div4, t1);
    			append(div4, div1);
    			append(div1, t2);
    			append(div4, t3);
    			append(div4, div2);
    			append(div2, t4);
    			append(div4, t5);
    			append(div4, div3);
    			append(div3, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.id) {
    				set_data(t0, ctx.id);
    			}

    			if (changed.title) {
    				set_data(t2, ctx.title);
    			}

    			if (changed.priceFmt) {
    				set_data(t4, ctx.priceFmt);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(article);
    			}

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { id, title, price, publisher } = $$props;

      const dispatch = createEventDispatcher();

      function addToCart() {
        dispatch("add-to-cart", {
          id: id,
          title: title,
          price: price,
          publisher: publisher
        });
      }

    	const writable_props = ['id', 'title', 'price', 'publisher'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Product> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('price' in $$props) $$invalidate('price', price = $$props.price);
    		if ('publisher' in $$props) $$invalidate('publisher', publisher = $$props.publisher);
    	};

    	let priceFmt;

    	$$self.$$.update = ($$dirty = { price: 1 }) => {
    		if ($$dirty.price) { $$invalidate('priceFmt', priceFmt = "$ " + price.toFixed(2)); }
    	};

    	return {
    		id,
    		title,
    		price,
    		publisher,
    		addToCart,
    		priceFmt
    	};
    }

    class Product extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["id", "title", "price", "publisher"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Product> was created without expected prop 'id'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Product> was created without expected prop 'title'");
    		}
    		if (ctx.price === undefined && !('price' in props)) {
    			console.warn("<Product> was created without expected prop 'price'");
    		}
    		if (ctx.publisher === undefined && !('publisher' in props)) {
    			console.warn("<Product> was created without expected prop 'publisher'");
    		}
    	}

    	get id() {
    		throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    	get publisher() {
    		throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set publisher(value) {
    		throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.4.4 */

    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.prod = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (49:2) {#each prods as prod, i (prod.id)}
    function create_each_block(key_1, ctx) {
    	var first, current;

    	var product = new Product({
    		props: {
    		id: ctx.prod.id,
    		title: ctx.prod.title,
    		price: ctx.prod.price,
    		publisher: ctx.prod.publisher
    	},
    		$$inline: true
    	});
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
    			var product_changes = {};
    			if (changed.prods) product_changes.id = ctx.prod.id;
    			if (changed.prods) product_changes.title = ctx.prod.title;
    			if (changed.prods) product_changes.price = ctx.prod.price;
    			if (changed.prods) product_changes.publisher = ctx.prod.publisher;
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

    function create_fragment$1(ctx) {
    	var div, h2, t1, hr, t2, each_blocks = [], each_1_lookup = new Map(), current;

    	var each_value = ctx.prods;

    	const get_key = ctx => ctx.prod.id;

    	for (var i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Products";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
    			add_location(h2, file$1, 45, 2, 772);
    			add_location(hr, file$1, 46, 2, 792);
    			div.className = "container svelte-us3ue2";
    			add_location(div, file$1, 44, 0, 746);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h2);
    			append(div, t1);
    			append(div, hr);
    			append(div, t2);

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			const each_value = ctx.prods;

    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
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
    				detach(div);
    			}

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
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

    function instance$1($$self) {
    	let prods = [
        {
          id: 283155,
          title: 'Jump Start VUE.JS',
          publisher: 'SitePoint',
          price: 19.14,
        },
        {
          id: 30420,
          title: 'Complete Vue.js 2 Web Development',
          publisher: 'Packt',
          price: 32.49,
        },
        {
          id: 75628,
          title: 'Laravel 5.8 Documentation Part-2, Just a Book That Goes Shows All Laravel Documentation In Printed Form',
          publisher: 'Robert Bruce',
          price: 30.00,
        },
      ];

    	return { prods };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
