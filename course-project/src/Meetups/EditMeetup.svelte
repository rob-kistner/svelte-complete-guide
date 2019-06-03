<script>
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
    dispatch('save', {
      title: title,
      subtitle: subtitle,
      address: address,
      email: email,
      description: description,
      imageUrl: imageUrl
    })
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
    <Button mode="outline" on:click={cancel}>Cancel</Button>
    <Button on:click={submitForm} disabled={!formIsValid}>Save</Button>
  </div>
</Modal>
