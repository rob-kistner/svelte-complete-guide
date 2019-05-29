<script>
  export let text = 'Default header'
</script>

<style>
  header {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    height: 4rem;
    background-color: var(--primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.26)
  }

  h1 {
    margin: 0;
  }
</style>

<header>
  <h1>{text}</h1>
</header>