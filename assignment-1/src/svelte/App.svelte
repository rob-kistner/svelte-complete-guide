<script>
  import Description from './components/Description.svelte'
  import CourseGoal from './components/CourseGoal.svelte'

  let text = '';
  
  const updateText = () => text = document.querySelector('#course-goal').value
</script>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
  input[type='text'] {
    width: 100%;
    max-width: 100%;
  }
</style>

<!-- page -->
<CourseGoal text="{text}" />

<form on:submit|preventDefault="{updateText}">
  <input type="text" id="course-goal">
</form>

<hr>

<Description />