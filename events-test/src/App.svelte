<script>

  import Product from './Product.svelte'

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
  ]

  function addToCart(e)
  {
    console.log(e.type, e.detail)
  }

  function deleteCartItem(e)
  {
    console.log(e.type, e.detail)
  }

</script>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
</style>

<div class="container">
  <h2>Products</h2>
  <hr>
  
  {#each prods as prod, i (prod.id)}
  <Product
    id={prod.id}
    title={prod.title}
    price={prod.price}
    publisher={prod.publisher}
    on:add-to-cart={addToCart}
    on:delete-cart-item={deleteCartItem}
    />
  {/each}

</div>
