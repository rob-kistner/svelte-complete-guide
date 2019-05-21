<script>
  export let text;

  $: isImportant = text.includes('!')
  $: isNotSure = text.includes('?')
</script>

<style>
  .important {
    color: darkred;
  }
  .notsure {
    font-weight: 300;
    color: #aaa;
  }
</style>

<h1
  class:important="{isImportant}"
  class:notsure="{isNotSure}"
  >{text}</h1>