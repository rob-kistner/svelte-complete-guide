<script>
  import { writable } from 'svelte/store'
  import { tweened } from 'svelte/motion'
  import { cubicOut } from 'svelte/easing'

  const progress = tweened(
    0,
    {
      delay: 0,
      duration: 2000,
      easing: cubicOut
    }
  )

  setTimeout(() => {
    progress.set(0.8)
  }, 3500)
</script>

<progress value={$progress}></progress>
