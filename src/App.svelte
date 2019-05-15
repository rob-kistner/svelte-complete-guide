<script>
  let name = 'Max';
  let age = 30;

  function incrementAge() {
    age += 1
  }
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1>Hello {name}!</h1>
<p>My age is {age}.</p>
<button on:click="{incrementAge}">Change Age</button>