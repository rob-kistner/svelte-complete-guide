<script>
  import { fade, scale, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { flip } from 'svelte/animate';

let condition = false

const myList = [
  'One',
  'Two',
  'Three',
  'Four',
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus tempora repudiandae earum error. Libero consequuntur cumque et voluptate cum officia.'
]

</script>

<main class="content">

  <div class="container">

    <h1>Animations</h1>

    <button class="button" on:click={()=>condition=!condition}>Start Animation</button>

    {#if condition}
        <h1 transition:fade={{duration: 1500, easing: quintOut}}>fades in and out</h1>
    {/if}
      <div class="list">
    {#if condition}
      {#each myList as item, i (item)}
        <p
          style="margin-bottom: 0"
          class="list-item"
          in:fly={{duration: 1000, easing: quintOut, y:-20, delay: i*250}}
          out:fly={{duration: 500, easing: quintOut, y:-20, delay: i*250}}
          animate:flip
          >
          {item}
        </p>
      {/each}
    {/if}
      </div>

    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Reprehenderit, ducimus excepturi earum ea molestias eligendi nemo fugiat suscipit vel alias voluptatem, omnis molestiae iure impedit explicabo commodi quae ut praesentium officiis autem ipsa blanditiis reiciendis quam. Hic quos provident explicabo deserunt perspiciatis sed accusamus culpa, alias ipsa unde ex illo expedita ipsam vel laborum, aperiam quas, cumque totam id! Autem, a qui nemo, possimus saepe voluptates praesentium placeat dolor repudiandae iusto tempora expedita. Qui numquam ratione vitae similique voluptates impedit veritatis sequi dolorum aperiam, officia repellendus, provident praesentium sapiente tempore ut placeat? Placeat quia tenetur minima illo, ipsa ut quasi!</p>
  </div>

</main>