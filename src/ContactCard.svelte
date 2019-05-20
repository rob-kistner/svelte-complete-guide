<script>
  // props are exported
  export let userName;
  export let userAge;
  export let jobTitle;
  export let jobDescription;
  export let userImage;
  // prop defaults

</script>


<style>
  .contact-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    max-width: 30rem;
    border-radius: 5px;
    margin: 1rem 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 7rem;
  }

  .thumb {
    width: 33%;
    height: 100%;
    padding: 0 2rem 0 0;
  }
  .thumb-placeholder {
    background-color: #ccc;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-data {
    width: 67%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  h1 {
    font-size: 1.25rem;
    font-family: "Roboto Slab", sans-serif;
    margin: 0.5rem 0;
  }

  h2 {
    font-size: 1rem;
    font-weight: normal;
    color: #5a5a5a;
    margin: 0;
    margin-bottom: 0.5rem;
  }

  .description {
    border-top: 1px solid #ccc;
    padding: 1rem;
  }

  .cf::after {
    content: '';
    display: block;
    clear: both;
  }

</style>

<div class="contact-card">
  <header>
    <!-- dynamic class short, the value is the conditional to show the class -->
    <div class="thumb" class:thumb-placeholder="{!userImage}">
      <img src={userImage} alt="">
    </div>
    <div class="user-data">
      <h1>{userName}</h1>
      <h2>{jobTitle}</h2>
    </div>
  </header>
  <div class="description">
    <p>{@html jobDescription}</p>
  </div>
</div>