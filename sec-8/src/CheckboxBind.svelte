<script>
  let agreed = false
</script>

<style>
  input[type="checkbox"] {
    margin-right: 0.375rem;
  }
  .agree {
    display: inline-block;
    font-weight: 700;
    color: white;
    background-color: green;
    padding: 0.25rem 0.75rem 0;
    border-radius: 4px;
  }
</style>

<h2>Checkbox Bind</h2>
<div class:agree={agreed}>
  <label>
    <input type="checkbox" bind:checked={agreed} />
    {agreed ? 'I agreed to the terms' : 'Click to agree to the terms'}
  </label>
</div>

<p>Checkbox bind needs to be done as <code>bind:checked</code> set to boolean.</p>
