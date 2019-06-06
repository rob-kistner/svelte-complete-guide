<script>
  import meetups from './meetups-store.js'
  import { createEventDispatcher } from 'svelte'
  import TextInput from '../UI/TextInput.svelte'
  import Button from '../UI/Button.svelte'
  import Modal from '../UI/Modal.svelte'
  import { isEmpty, isValidEmail } from '../helpers/validation.js'

  let title = ""
  let subtitle = ""
  let address = ""
  let email = ""
  let description = ""
  let imageUrl = ""

  // for editing existing
  export let id = null
  if (id) {
    const unsubscribe = meetups.subscribe(items => {
      const selectedMeetup = items.find(i => i.id === id)
      title = selectedMeetup.title
      subtitle = selectedMeetup.subtitle
      address = selectedMeetup.address
      email = selectedMeetup.contactEmail
      description = selectedMeetup.description
      imageUrl = selectedMeetup.imageUrl
    })
    unsubscribe() // cleaup immediately after setting vars
  }

  const dispatch = createEventDispatcher()

  $: titleValid = !isEmpty(title)
  $: subtitleValid = !isEmpty(subtitle)
  $: addressValid = !isEmpty(address)
  $: emailValid = isValidEmail(email)
  $: descriptionValid = !isEmpty(description)
  $: imageUrlValid = !isEmpty(imageUrl)
  $: formIsValid =  titleValid && 
                    subtitleValid && 
                    addressValid && 
                    emailValid && 
                    descriptionValid && 
                    imageUrlValid
  
  function submitForm ()
  {
    const meetupData = {
      title: title,
      subtitle: subtitle,
      description: description,
      imageUrl: imageUrl,
      contactEmail: email,
      address: address
    }
    if (id) {
      meetups.updateMeetup(id, meetupData)
    } else {
      meetups.addMeetup(meetupData)
    }

    dispatch('save') // to close modal
  }

  function deleteMeetup() {
    meetups.deleteMeetup(id)
    dispatch('save')
  }

  function cancel ()
  {
    dispatch('cancel')
  }
</script>

<style>
  form {
    width: 100%;
  }
</style>

<Modal title="Edit Meetup Data" on:cancel>
  <form on:submit|preventDefault={submitForm}>
    <TextInput
      id="title"
      label="Title"
      value={title}
      valid={titleValid}
      validityMessage="Please enter a valid title"
      on:input={event => (title = event.target.value)} />
    <TextInput
      id="subtitle"
      label="Subtitle"
      value={subtitle}
      valid={subtitleValid}
      validityMessage="Please enter a valid subtitle"
      on:input={event => (subtitle = event.target.value)} />
    <TextInput
      id="address"
      label="Address"
      value={address}
      valid={addressValid}
      validityMessage="Please enter a valid address"
      on:input={event => (address = event.target.value)} />
    <TextInput
      id="imageUrl"
      label="Image URL"
      value={imageUrl}
      valid={imageUrlValid}
      validityMessage="Please enter a valid image url"
      on:input={event => (imageUrl = event.target.value)} />
    <TextInput
      id="email"
      label="E-Mail"
      type="email"
      value={email}
      valid={emailValid}
      validityMessage="Please enter a valid email address"
      on:input={event => (email = event.target.value)} />
    <TextInput
      id="description"
      label="Description"
      controlType="textarea"
      value={description}
      valid={descriptionValid}
      validityMessage="Please enter a valid description"
      on:input={event => (description = event.target.value)} />
  </form>
  <div slot="footer">
    <Button on:click={submitForm} disabled={!formIsValid}>Save</Button>
    <Button mode="minimal" on:click={cancel}>Cancel</Button>
  </div>
  {#if id}
    <Button on:click={deleteMeetup}>Delete This Meetup</Button>
  {/if}
</Modal>
