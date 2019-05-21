<script>
  let name = 'Max';
  let age = 30;

  // labelled statement
  // ------------------------------
  // Assignments and immediately run functions.
  // These are like vue computed or watchers
  $: uppercaseName = name.toUpperCase()

  // $: console.log(name)

  $: if (name === 'Maximillian') {
    age = 50
  }

  // ------------------------------
  // methods

  function incrementAge() {
    age += 1
  }

  function changeName() {
    name = 'Maximillian'
  }

  function nameInput(e) {
    name = e.target.value
  }
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<section class="container">
  <h1>Hello {name}!</h1>
  <p>My age is {age}.</p>
  <p>Uppercase name: {name.toUpperCase()}</p>
  <p>Uppercase name from labelled statement: {uppercaseName}</p>
  <p>Name + 1: {age+1}</p>

  <button on:click="{incrementAge}">Change Age</button>
  <!-- <button on:click="{changeName}">Change Name</button> -->

  <div>
    <label>using on:input for 2-way binding…</label>
    <input type="text" value="{name}" on:input="{nameInput}">
  </div>
  <div>
    <label>using bind.value for 2-way binding…</label>
    <input type="text" value="{name}" bind:value="{name}">
  </div>
</section>
