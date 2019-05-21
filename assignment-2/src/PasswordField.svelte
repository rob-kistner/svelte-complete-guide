<script>
  let password = ''
  let passwordsArray = []
  let passwordWarning = ''

  $: passwordIsValid = (password.length >= 5 && password.length <= 10)
  
  function addPassword()
  {
    passwordsArray = [...passwordsArray, password]
    password = ''
  }

  function removePasswordOld(e)
  {
    const idx = e.target.getAttribute('href')
    passwordsArray.splice(idx, 1)
    passwordsArray = [...passwordsArray]
  }

  function removePassword(e)
  {
    const idx = e.target.getAttribute('href')
    passwordsArray = passwordsArray.filter( (pw, i) => idx != i )
    console.log(passwordsArray)
  }

</script>

<style>
  label {
    font-size: 1.2em;
    margin-bottom: 1rem;
  }
  input[type='password'] {
    width: 100%;
    max-width: 100%;
    font-size: 1.4rem;
    padding: 0.625rem 1rem;
  }
  input[type='password']::placeholder {
    color: #ccc;
  }
  .password-view {
    font-size: 1.4rem;
    color: darkblue;
    margin: 0.25rem 1rem;
  }
  .password-view span {
    color: red;
  }
  .password-warning {
    padding: 0.5rem 1rem;
    background-color: red;
    color: white;
    font-weight: 70;
  }
  button {
    margin-top: 1rem;
    cursor: pointer;
  }

</style>

<label>Enter your password</label>
<input type="password" bind:value={password} placeholder="Your password">
<p class="password-view">
{#if password.length < 5 && password.length > 0 }
  <span>Too short</span>
{:else if password.length > 10}
  <span>Too long</span>
{:else if passwordIsValid}
  {password}
{/if}
</p>

{#if passwordIsValid}
  <button on:click={addPassword}>Add This Password</button>
{/if}

{#if passwordsArray.length > 0}
<h3>Current Passwords…</h3>
<ul>
  {#each passwordsArray as pw, i}
    <li>
      <a href={i} on:click|preventDefault={removePassword}>{pw}</a>
    </li>
  {/each}
</ul>
{/if}
