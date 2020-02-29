<template>
  <quwi-datepicker ref="quwiPicker" @selected="d => $emit('selected', d)" :locale="$i18n.locale"
                   :today="$date()" :date="date" :disabled="disabled"></quwi-datepicker>
</template>

<script>
  import QuwiDatepicker from '~/libs/quwi-datepicker/DatePicker.vue'

  export default {
    name: 'date-picker',
    components: {QuwiDatepicker},
    props: ['date', 'disabled'],
    mounted () {
      window.datePicker = this
    }
  }
</script>
