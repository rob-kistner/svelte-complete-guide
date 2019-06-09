<script>
  import { writable } from 'svelte/store'
  import { tweened } from 'svelte/motion'
  import { cubicOut } from 'svelte/easing'
  import { fade, fly, slide, scale } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  import Spring from './Spring.svelte'

  let boxInput
  let showParagraph = false

  const progress = tweened(
    0,
    {
      delay: 0,
      duration: 700,
      easing: cubicOut
    }
  )

  setTimeout(() => {
    progress.set(0.8)
  }, 3500)

  let boxes = []

  function addBox() {
    boxes = [boxInput.value, ...boxes]
    boxInput.value = ''
  }

  function discardBox(value) {
    boxes = boxes.filter(el => el !== value)
  }
</script>

<style>
  div {
    /* display: inline-block; */
    width: 10rem;
    height: 10rem;
    background: #ccc;
    margin: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.6);
    border-radius: 6px;
    padding: 1rem;
  }

</style>


<section>
  <button on:click={() => showParagraph = !showParagraph}>
    Show All
  </button>
  {#if showParagraph}
  <!-- Note: you can't cancel the animation with in/out set -->
    <p
      in:fade={{duration: 2000}}
      out:fly={{x:300, duration: 1000}}
      >
      Can you see me?
    </p>
  {/if}
</section>

<section>
  <input type="text" bind:this={boxInput}>
  <button on:click={addBox}>Add</button>
</section>

<!-- <Spring /> -->

<!--
  The 'animate:flip' attribute 
  transitions existing elements
  when a new one gets added!
  -->
{#if showParagraph}
{#each boxes as box (box)}
  <div
    transition:fly={{delay: 0, duration: 250, easing: cubicOut, x: -100, opacity: 0.25}}
    on:click={discardBox.bind(this, box)}
    on:introstart={() => console.log('adding the element starts')}
    on:introend={() => console.log('adding the element ends')}
    on:outrostart={() => console.log('removing the element starts')}
    on:outroend={() => console.log('removing the element ends')}
    animate:flip={{duration: 30}}
    >
    {box}
  </div>
{/each}
{/if}