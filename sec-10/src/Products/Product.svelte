<script>
  import cartItems from '../Cart/cart-store.js'
  import Button from "../UI/Button.svelte"

  export let id
  export let title
  export let price
  export let description

  function addToCart() {
    /**
     * add item to store cart items
     * always do this as a new copy
     * (i.e.: don't mutate directly) 
     */
    cartItems.update(oldItems => {
      return [
        ...oldItems,
        {
          id: id,
          title: title,
          price: price
        }
      ]
    })
  }
</script>

<style>
  .product {
    background: white;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
  }

  h1 {
    font-size: 1.25rem;
    font-family: "Roboto Slab", serif;
    margin: 0;
  }

  h2 {
    font-size: 1rem;
    margin: 0;
    color: #494949;
  }

  p {
    margin: 0;
  }
</style>

<div class="product">
  <div>
    <h1>{title}</h1>
    <h2>{price}</h2>
    <p>{description}</p>
  </div>
  <div>
    <Button on:click={addToCart}>Add to Cart</Button>
  </div>
</div>
