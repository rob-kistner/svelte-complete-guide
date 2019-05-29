<script>
  import ContactCard from './ContactCard.svelte'

  let name = '';
  let jobTitle = '';
  let jobDescription = '';
  let image = 'https://upload.wikimedia.org/wikipedia/commons/8/8d/George_Clooney_2016.jpg';
  let age = 30;

  // labelled statement
  // ------------------------------
  // Assignments and immediately run functions.
  // These are like vue computed or watchers
  $: uppercaseName = name.toUpperCase()

  // $: console.log(name)

  $: if (name === 'Maximillian') {
    age = 50
  } else {
    age = 30
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

  <h1>Hello {uppercaseName}!</h1>
  <p>My age is {age}.</p>
  
  <button class="danger" on:click="{incrementAge}">Change Age</button>
  <div>
    <label>Your name:</label>
    <input type="text" value="{name}" bind:value="{name}" placeholder="Your name">
  </div>
  <div>
    <label>Your job title:</label>
    <input type="text" value="{jobTitle}" bind:value="{jobTitle}" placeholder="Your job title">
  </div>
  <div>
    <label>Thumbnail Path:</label>
    <input type="text" size="75" value="{image}" bind:value="{image}" placeholder="Image thumbnail path">
  </div>
  <div>
    <label>Your job description:</label>
    <textarea cols="30" rows="5" bind:value="{jobDescription}" placeholder="Your job description"></textarea>
  </div>

  <!--
    The curly brace with no attribute prefixer is a svelte shortcut:
    You can just use the variable name without the attribute if they
    are the same.

    Below, {jobTitle} is the same as jobTitle={jobTitle}
    -->
  <ContactCard
    userName={name}
    userAge={age}
    {jobTitle}
    {jobDescription}
    userImage={image} 
    />

</section>
