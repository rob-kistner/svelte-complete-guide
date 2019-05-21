<script>
  import Description from './Description.svelte'
  import PasswordField from './PasswordField.svelte'
</script>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
  hr {
    margin: 2.5rem 0;
  }
</style>

<!-- main page -->
<div class="container">

  <PasswordField />

  <hr>
 
  <Description />

</div>