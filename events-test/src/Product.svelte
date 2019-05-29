<script>
  import { createEventDispatcher } from "svelte";

  export let id;
  export let title;
  export let price;
  export let publisher;

  const dispatch = createEventDispatcher();

  $: priceFmt = "$ " + price.toFixed(2);

  function addToCart() {
    dispatch("add-to-cart", {
      id: id,
      title: title,
      price: price,
      publisher: publisher
    });
  }

  function deleteCartItem() {
    dispatch(
      "delete-cart-item",
      { id: id }
    );
  }
</script>

<style>
  :root {
    --btn-bg: #fff;
    --btn-color: #aaa;
  }

  .product div {
    padding: 0.5rem;
  }
  article:nth-of-type(even) {
    background-color: #eee;
  }
  .product {
    display: flex;
    width: 100%;
    min-height: 40px;
    align-items: flex-start;
    padding: 0.75rem 0;
  }
  .id {
    flex: 0.85 0;
    font-size: 0.85rem;
    text-align: right;
  }
  .title {
    flex: 4.25 0;
    padding: 0 1rem 0;
  }
  .price {
    flex: 1.5 0;
  }
  .buttons {
    flex: 1 0;
    text-align: center;
  }
  @media (min-width: 768px) {
    .id { flex: 0.75 0 }
    .title { flex: 6 }
    .price { flex: 1 0 }
  }


  button {
    margin-bottom: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1;
    text-transform: uppercase;
    color: var(--btn-color);
    background-color: transparent;
    border: 2px solid var(--btn-color);
    cursor: pointer;
    border-radius: 4px;
  }
  button:hover {
    background-color: #fff;
    border-radius: 4px;
  }
</style>

<article>
  <div class="product">
    <div class="id">{id}</div>
    <div class="title">{title}</div>
    <div class="price">{priceFmt}</div>
    <div class="buttons">
      <button on:click={addToCart}>Add</button>
    </div>
  </div>
</article>
