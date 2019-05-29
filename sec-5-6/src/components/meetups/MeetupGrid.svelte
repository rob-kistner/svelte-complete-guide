<script>
  import MeetupItem from './MeetupItem.svelte'
  
  export let meetups
</script>

<style>
  section {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 0rem;
    width: 100%;
  }
  @media (min-width: 768px) {
    section {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>

<section id="meetups">
  {#each meetups as meetup, i (meetup.id)}
    <MeetupItem
      title={meetup.title}
      subtitle={meetup.subtitle}
      imageUrl={meetup.imageUrl}
      description={meetup.description}
      email={meetup.email}
      address={meetup.address}
      />
  {/each}
</section>