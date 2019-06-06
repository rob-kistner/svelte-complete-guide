<script>
  import meetups from "./Meetups/meetups-store.js"
  import Header from "./UI/Header.svelte"
  import MeetupGrid from "./Meetups/MeetupGrid.svelte"
  import TextInput from "./UI/TextInput.svelte"
  import Button from "./UI/Button.svelte"
  import EditMeetup from "./Meetups/EditMeetup.svelte"
  import MeetupDetail from "./Meetups/MeetupDetail.svelte"

  let editMode
  let editedId 
  let page = 'overview'
  let pageData = {}

  function saveMeetup() {
    editMode = null
    editedId = null
  }

  function cancelEdit() {
    editMode = null
    editedId = null
  }

  function showDetails(e) {
    page = 'details'
    pageData.id = e.detail
  }

  function closeDetails() {
    page = 'overview'
    pageData = {}
  }

  function startEdit(e) {
    editMode = 'edit'
    editedId = e.detail
  }
</script>


<style>
  main {
    margin-top: 5rem;
  }
</style>


<Header />

<main>
  {#if page === 'overview'}
    {#if editMode === 'edit'}
      <EditMeetup id={editedId} on:save={saveMeetup} on:cancel={cancelEdit} />
    {/if}
    <MeetupGrid
      meetups={$meetups}
      on:showdetails={showDetails}
      on:edit={startEdit}
      on:add={() => editMode = 'edit'}
      />
  {:else}
    <MeetupDetail id={pageData.id} on:close={closeDetails} />
  {/if}
</main>
