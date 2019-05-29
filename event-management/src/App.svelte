<script>

  import Product from './Product.svelte'
  import Modal from './Modal.svelte'
  import { tick, afterUpdate } from 'svelte'

  let products = [
    {
      id: 'p1',
      title: 'A book',
      price: 9.99
    }
  ]

  let showModal = false
  let closeable = false
  let text = 'This is some dummy text'


  function addToCart(e)
  {
    console.log(e.type, e.detail)
  }

  function deleteCartItem(e)
  {
    console.log(e.type, e.detail)
  }

  function transform(e) {
    if (e.which !== 9) { // tab key
      return
    }
    e.preventDefault()
    const selectionStart = e.target.selectionStart
    const selectionEnd = e.target.selectionEnd
    const value = e.target.value

    text =
      value.slice(0, selectionStart) + 
      value.slice(selectionStart, selectionEnd).toUpperCase() + 
      value.slice(selectionEnd)
  
    tick().then( () => {
      e.target.selectionStart = selectionStart
      e.target.selectionEnd = selectionEnd
    })
  }
  afterUpdate( () => {
  })
</script>

<style>
</style>

<div class="container">
  <!--
    {...product} yields matching spread operator,
    will set id={product.id}, title={product.title}, etc.
  -->
  {#each products as product (product.id)}
  <Product
    {...product}
    on:add-to-cart={addToCart}
    on:delete-cart-item={deleteCartItem}
    />
  {/each}

  <button on:click={ ()=>showModal=true }>
    <i class="fal fa-eye"></i> Show Modal
  </button>
</div>

<textarea rows="5" value={text} on:keydown={transform} />

{#if showModal}
  <Modal
    on:cancel={ ()=>showModal=false }
    on:close={ ()=>showModal=false }
    let:didAgree={closeable}
    >
    <h1 slot="header">Hello!</h1>
    <p slot="content">Laboriosam quo atque quidem beatae natus, vero ratione quod autem cumque aspernatur repellat impedit dolorum expedita quas ab sunt distinctio aut assumenda unde ullam sequi deleniti alias quis. Assumenda cumque rerum ab cupiditate harum quia, quidem enim explicabo expedita dolorem ratione veniam voluptatibus eligendi amet molestiae impedit, eveniet quibusdam vero deleniti corrupti omnis, iure provident! Architecto odit accusantium nihil modi ipsum facilis voluptatem officiis dolorem quibusdam earum consectetur officia facere, fuga ducimus laborum magni iusto soluta omnis cupiditate quaerat. Aperiam rem doloremque recusandae architecto debitis, accusantium animi sequi esse vitae eius! Quos!</p>
    <button
      slot="footer"
      on:click={ ()=>showModal=false }
      disabled={!closeable}
      >
      <i class="fal fa-check"></i>
      Confirm
    </button>
  </Modal>
{/if}