<script>
  import ContactCard from "./components/ContactCard.svelte";

  let name = "Max";
  let title = "";
  let image = "";
  let description = "";
  let formState = "empty";

  let createdContacts = [];

  function addContact() {
    if (
      name.trim().length == 0 ||
      title.trim().length == 0 ||
      description.trim().length == 0
    ) {
      formState = "invalid";
      return;
    }
    createdContacts = [
      ...createdContacts,
      {
        name: name,
        jobTitle: title,
        imageUrl: image,
        desc: description
      }
    ];
    formState = "done";
  }

  function deleteFirst() {
    createdContacts = createdContacts.slice(1)
  }

  function deleteLast() {
    createdContacts = createdContacts.slice(0, -1)
  }
</script>

<style>
  #form {
    width: 30rem;
    max-width: 100%;
    margin: 1rem 0;
  }
  hr {
    margin: 1.5rem 0;
  }
  .err {
    color: red;
  }
  input {
    width: 100%;
    max-width: 100%;
  }
</style>

<form id="form">
  <div class="form-control">
    <label for="userName">User Name</label>
    <input type="text" bind:value={name} id="userName" />
  </div>
  <div class="form-control">
    <label for="jobTitle">Job Title</label>
    <input type="text" bind:value={title} id="jobTitle" />
  </div>
  <div class="form-control">
    <label for="image">Image URL</label>
    <input type="text" bind:value={image} id="image" />
  </div>
  <div class="form-control">
    <label for="desc">Description</label>
    <textarea rows="3" bind:value={description} id="desc" />
  </div>
  <button type="submit" on:click|preventDefault={addContact}>Add Contact Card</button>
</form>

Delete: 
<a href="#" on:click|preventDefault={event => {
  createdContacts = createdContacts.slice(1)
}}>First</a> | 
<a href="#" on:click|preventDefault={deleteLast}>Last</a>

{#if formState === 'invalid'}
  <p class="err">Invalid input.</p>
{/if}

<hr>

{#each createdContacts as contact, i}
  <h2># {i + 1}</h2>
  <ContactCard
    userName={contact.name}
    jobTitle={contact.jobTitle}
    description={contact.desc}
    userImage={contact.imageUrl} />
{:else}
  <p>Please start adding some contacts, we found none!</p>
{/each}
