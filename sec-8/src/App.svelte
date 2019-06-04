<script>

  import ComponentBind from './ComponentBind.svelte'
  import NumericInputBind from './NumericInputBind.svelte'
  import CheckboxBind from './CheckboxBind.svelte'
  import RadioGroupBind from './RadioGroupBind.svelte'
  import CheckboxGroupBind from './CheckboxGroupBind.svelte'
  import SelectBind from './SelectBind.svelte'
  import ReferenceBind from './ReferenceBind.svelte'
  import Validation from './Validation.svelte'
  import ValidationWithLib from './ValidationWithLib.svelte'

</script>

<style>
  .spacer {
    padding-bottom: 50px;
  }
</style>

<section class="container spacer">
  <h1>Bindings are all separate components</h1>
  <hr>
  <ComponentBind />
  <hr>
  <NumericInputBind />
  <hr>
  <CheckboxBind />
  <hr>
  <RadioGroupBind />
  <hr>
  <CheckboxGroupBind />
  <hr>
  <SelectBind />
  <hr>
  <ReferenceBind />
  <hr>
  <Validation />
  <hr>
  <ValidationWithLib />

</section>
