<script>
  import ContactCard from "./ContactCard.svelte";

  let name = "Max"
  let title = ""
  let image = ""
  let description = ""
  let formState = 'empty'

  let createdContacts = []

  function addContact() {
    console.log(name, title, description)
    if ( name.trim().length == 0 ||
         title.trim().length == 0 ||
         description.trim().length == 0
      ) {
      formState = 'invalid'
      return
    }
    createdContacts = [
      ...createdContacts,
      {
        id: Math.random(),
        name: name,
        jobTitle: title,
        imageUrl: image,
        desc: description
      }
    ]
    formState = 'done'
  }

  function deleteFirst() {
    // return array starting from second element (1)
    createdContacts = createdContacts.slice(1)
  }
  function deleteLast() {
    // start at first element (0)
    // end at element before the last element (-1)
    createdContacts = createdContacts.slice(0, -1)
  }
</script>

<style>
  #form {
    width: 30rem;
    max-width: 100%;
  }
  .error {
    color: red;
    font-weight: 700;
  }
</style>

<div id="form">
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
</div>

<button on:click={addContact}>Add Contact Card</button>
<button on:click={deleteFirst}>Delete First</button>
<button on:click={deleteLast}>Delete Last</button>

{#if formState === 'invalid'}
  <p class="error">Input is invalid.</p>
{:else}
  <p>Enter information above to create the contact card.</p>
{/if}

<!-- 
  contact.id here is a unique index to svelte
  it'll correct the issue that happens when 
  deleting the first item of the array and 
  the userName initially set variable
 -->
{#each createdContacts as contact, i (contact.id)}
<h2># {i + 1}</h2>
<ContactCard
  userName={contact.name}
  jobTitle={contact.jobTitle}
  description={contact.desc}
  userImage={contact.imageUrl}
  />
{:else}
<p>No contacts found.</p>
{/each}
