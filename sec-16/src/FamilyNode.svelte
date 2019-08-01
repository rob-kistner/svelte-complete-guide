<script context="module">
  // runs only on load due to module context
  console.log('Runs once')

  let deactivateNode
</script>

<script>
  export let member

  let isActive
  
  // runs whenever #each iterates
  console.log('Runs multiple times')

  function deactivate() {
    isActive = false
  }
  function activate() {
    if (deactivateNode) {
      deactivateNode()
    }
    isActive = true
    // point single instance var to the function
    deactivateNode = deactivate
  }
</script>

<style>
  div {
    margin-left: 2rem;
    cursor: pointer;
  }
  .active {
    color: red;
  }
</style>

<div on:click={activate} class:active={isActive}>
  <h3>{member.name}</h3>
  <hr>
  {#if member.isParent}
    {#each member.children as child}
      <svelte:self member={child} />
    {/each}
  {/if}

</div>