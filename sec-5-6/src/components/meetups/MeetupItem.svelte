<script>
  import Button from '../ui/Button.svelte'

  export let title
  export let subtitle
  export let imageUrl
  export let description
  export let address
  export let email
</script>

<style>
  article {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    border-radius: 5px;
    background: white;
    margin: 1rem;
  }

  header,
  .content{
    padding: 1rem;
    min-height: 4rem;
  }

  .image {
    width: 100%;
    height: 14rem;
  }

  .image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0.5rem 0;
  }

  h1.is-favorite {
    background: #01a129;
    color: white;
    padding: 0 0.5rem;
    border-radius: 5px;
  }

  h2 {
    font-size: 1rem;
    color: #808080;
    margin: 0.5rem 0 1.5rem;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }

  address {
    font-style: normal;
    margin-bottom: 1rem;
  }
  div {
    /* text-align: right; */
  }
  footer {
    text-align: right;
    padding: 1rem 0;
  }
  footer * {
    margin: 0 0.25rem;
  }
  footer *:last-child {
    margin-right: 0;
  }
</style>

<article>
  <header>
    <h1>{title}</h1>
    <h2>{subtitle}</h2>
    <address>{address}</address>
    <div class="image">
      <img src={imageUrl} alt={title}>
    </div>
    <div class="content">
      <p>{description}</p>
    </div>
    <footer>
      <Button type="href" caption="Contact" mode="outline" href="mailto:{email}" />
      <Button caption="Favorite" mode="outline" />
      <Button caption="Show Details" />
    </footer>
  </header>
</article>