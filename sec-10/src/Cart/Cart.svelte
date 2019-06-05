<script>
  import { onDestroy } from 'svelte'
  import { timer } from '../timer-store.js'
  import cartItems from './cart-store.js'
  import CartItem from "./CartItem.svelte"


  const unsubscribe = timer.subscribe(count => {
    console.log('Cart ' + count)
  })


  // ----------------------------------------
  // MANUAL SUBSCRIPTION CREATION
  // ----------------------------------------
  // var to keep the store items in the component
  // let items

  // load the card items into the component var 'items',
  // store as unsubscribable so the subscription itself
  // can be destroyed for cleanup (which would be a memory leak)
  // const unsubscribe = cartItems.subscribe(payload => {
  //   items = payload
  // })

  // destroy the subscription
  // i.e.: NOT the cart
  // when the component is hidden
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  /*
    ---------------------------------------
    $cartItems
    ----------------------------------------
    The "$" before the store variable name 
    is a flag to svelte to automatically subscribe
    to the store and will automatically unsubscribe as
    cleanup when it's not needed
    ----------------------------------------
  */

</script>

<style>
  section {
    width: 30rem;
    max-width: 90%;
    margin: 2rem auto;
    border-bottom: 2px solid #ccc;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>

<section>
  <h1>Cart</h1>
  <ul>
    <!-- $cartItems is an Autosubscription to the 
    svelte store variable imported at the top -->
    {#each $cartItems as item (item.id)}
      <CartItem id={item.id} title={item.title} price={item.price} />
    {:else}
      <p>No items in cart yet!</p>
    {/each}
  </ul>
</section>
