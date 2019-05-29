<script>
  import Header from './ui/Header.svelte'
  import MeetupGrid from './meetups/MeetupGrid.svelte'
  import TextInput from './ui/TextInput.svelte'
  import Button from './ui/Button.svelte'
  
  // separate data file for meetups
  import meetupData from './data/meetups.js'
  // need to reassign import data to mutate it with the form
  let meetups = [...meetupData]

  let title = ''
  let subtitle = ''
  let address = ''
  let email = ''
  let description = ''
  let imageUrl = ''

  function addMeetup ()
  {
    const newMeetup = {
      id: parseInt(Math.random() * 100000).toString(),
      title: title,
      subtitle: subtitle,
      address: address,
      description: description,
      email: email,
      address: address,
    }
    meetups = [newMeetup, ...meetups]
  }
</script>

<style>
  main {
    max-width: 1000px;
    margin: 6rem auto 0;
    padding: 0 2rem;
  }
  form {
    width: 30rem;
    max-width: 90%;
    margin: 0 auto;
  }
  
</style>

<main>

  <Header text="Meetup Manager" />


  <form on:submit|preventDefault={addMeetup}>
    <h2>Add a meetup</h2>
    <TextInput
      controlType="text"
      id="title"
      label="Title"
      placeholder="Enter the meetup title"
      value={title}
      on:input={e => title = e.target.value}
      />
    <TextInput
      controlType="text"
      id="subtitle"
      label="Subtitle"
      placeholder="Enter the meetup subtitle"
      value={subtitle}
      on:input={e => subtitle = e.target.value}
      />
    <TextInput
      controlType="text"
      id="address"
      label="Address"
      placeholder="Enter the address"
      value={address}
      on:input={e => address = e.target.value}
      />
    <TextInput
      controlType="text"
      id="imageUrl"
      label="Image"
      placeholder="Enter the url to the image"
      value={imageUrl}
      on:input={e => imageUrl = e.target.value}
      />
    <TextInput
      controlType="text"
      type="email"
      id="email"
      label="Email"
      placeholder="Enter the contact email"
      value={email}
      on:input={e => email = e.target.value}
      />    
    <TextInput
      controlType="textarea"
      rows="5"
      id="description"
      label="Description"
      placeholder="Enter the meetup description"
      value={description}
      on:input={e => description = e.target.value}
      />
    <Button
      type="submit"
      caption="Save"
      />
  </form>

  <MeetupGrid {meetups} />

</main>
