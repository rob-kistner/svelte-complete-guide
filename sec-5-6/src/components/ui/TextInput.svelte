<script>
  export let controlType
  export let type = 'text'
  export let id
  export let label
  export let rows = 3
  export let placeholder = ''
  export let value
</script>

<style>
  label {
    display: block;
    font-size: 0.9rem;
    margin: 1rem 0 0.5rem;
    text-transform: uppercase;
  }
  input, textarea {
    font-size: inherit;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    width: 100%;
    border: 1px solid #ccc;
  }
  input::placeholder,
  textarea::placeholder {
    color: #ccc;
  }
</style>

<!--
  BELOW:
  on:input fowards the input event back to the parent/
-->

<div class="form-control">
  <label for={id}>{label}</label>
  {#if controlType === 'textarea'}
    <textarea {id} {rows} {value} {placeholder} on:input />
  {:else if controlType === 'text'}
    <input {type} {id} {value} {placeholder} on:input />
  {/if}
</div>
