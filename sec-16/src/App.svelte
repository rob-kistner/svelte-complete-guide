<script>
  import Product from './Product.svelte'
  import CartItem from './CartItem.svelte'
  import FamilyNode from './FamilyNode.svelte'

  let y
  let title = 'Initial Page Title'
  let familyStructure = [
    {
      isParent: true,
      name: 'Chris',
      children: [
        {
          isParent: true,
          name: 'Moe',
          children: [
            {
              isParent: false,
              name: 'Julie'
            }
          ]
        }
      ]
    },
    {
      isParent: false,
      name: 'Anna'
    }
  ]
  let showProduct = true
  let renderedComponent = {cmp: Product, title: 'Test Product', id: 'p1'}

  function toggle() {
    if(renderedComponent.cmp === Product) {
      renderedComponent = { cmp: CartItem, title: 'Another Product', id: 'p2' }
    } else {
      renderedComponent = { cmp: Product, title: 'Test Product', id: 'p1' }
    }
    showProduct = !showProduct
  }

  function switchTitle() {
    title = 'Title Change: ' + new Date(Date.now())
  }
</script>

<style>
  .end-of-page {
    display: block;
    height: 600px;
  }
  h1.comp {
    background-color: #009;
    color: #eee;
    padding: 0.75rem 1.85rem;
    border-radius: 6px;
    text-align: center;
    box-shadow: 0 2px 2px rgba(0,0,0,0.2);
  }
  .win-position {
    position: fixed;
    display: inline-block;
    min-width: 120px;
    text-align: center;
    right: 0;
    top: 0;
    background: #111;
    color: #eee;
    border-radius: 0 0 8px 8px;
    padding: 0.5rem 1rem;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
  }
</style>

<svelte:window
  bind:scrollY={y}
  />
<svelte:body
  on:mouseenter={ ()=> console.log('mouseenter on body')}
  on:mouseleave={ ()=> console.log('mouseleave on body')}
  />

<svelte:head>
  <title>{title}</title>
</svelte:head>

<button on:click={switchTitle}>
  Switch Page Title &uarr;
</button>

<div class="win-position">scrollY: {y}</div>

<h1 class="comp">Dynamic Components</h1>

<button on:click={toggle}>Toggle Display</button>

<svelte:component
  this={renderedComponent.cmp}
  title={renderedComponent.title}
  id={renderedComponent.id}
/>

<h1 class="comp">Recursive Components</h1>

{#each familyStructure as member}
  <FamilyNode member={member}></FamilyNode>
{/each}

<div class="end-of-page"></div>