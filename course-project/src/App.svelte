<script>
  import meetups from "./Meetups/meetups-store.js"
  import Header from "./UI/Header.svelte"
  import MeetupGrid from "./Meetups/MeetupGrid.svelte"
  import TextInput from "./UI/TextInput.svelte"
  import Button from "./UI/Button.svelte"
  import EditMeetup from "./Meetups/EditMeetup.svelte"
  import MeetupDetail from "./Meetups/MeetupDetail.svelte"

  let MEETUP_DATA_URL = "https://rk-svelte-course.firebaseio.com/meetups.json"
  let editMode
  let editedId
  let page = "overview"
  let pageData = {}
  let isLoading = true

  fetch(MEETUP_DATA_URL)
    .then(res => {
      if (!res.ok) {
        throw new Error('Fetching meetups failed!')
      }
      return res.json()
    })
    .then(data => {
      const loadedMeetups = []
      for (const key in data) {
        loadedMeetups.push({
          id: key, // the firebase name key
          ...data[key] // meetup data
        })
      }
      // faking load time to test spinner
      setTimeout(() => {
        isLoading = false
        meetups.setMeetups([loadedMeetups])
      }, 1000)
    })
    .catch(err => {
      console.log(err)
      isLoading = false
    })

  function savedMeetup(event) {
    editMode = null;
    editedId = null;
  }

  function cancelEdit() {
    editMode = null;
    editedId = null;
  }

  function showDetails(event) {
    page = "details";
    pageData.id = event.detail;
  }

  function closeDetails() {
    page = "overview";
    pageData = {};
  }

  function startEdit(event) {
    editMode = "edit";
    editedId = event.detail;
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
      <EditMeetup id={editedId} on:save={savedMeetup} on:cancel={cancelEdit} />
    {/if}
    {#if isLoading}
      <p>Loading...</p>
    {:else}
      <MeetupGrid
        meetups={$meetups}
        on:showdetails={showDetails}
        on:edit={startEdit}
        on:add={() => {editMode = 'edit'}} />
    {/if}
  {:else}
    <MeetupDetail id={pageData.id} on:close={closeDetails} />
  {/if}
</main>
