<template>
  <div class="c-date-filter">
    <div @click="decrement" class="e-left m-arrow">&lt;</div>
    <div class="e-date">{{ formatDate(date) }}</div>
    <div @click="increment" class="e-right m-arrow" :class="{'visible': !isFuture}">&gt;</div>
  </div>
</template>

<script>
  import { formatDate } from '~/utils/time'

  export default {
    name: 'date-filter',
    props: ['date'],
    data () {
      return {}
    },
    methods: {
      formatDate (dta, format) {
        return formatDate(dta, format, this.$i18n.locale)
      },
      decrement () {
        this.$emit('change', this.date.clone().subtract(1, 'd'))
      },
      increment () {
        this.$emit('change', this.date.clone().add(1, 'd'))
      }
    },
    computed: {
      isFuture () {
        return this.date.diff(this.$date(), 'days') >= 0
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-date-filter {
    display: flex;
    color: @red-color;
    .m-arrow {
      padding: 0 5px;
      .hover-mixin();
      &.e-right {
        visibility: hidden;
        &.visible {
          visibility: visible;
        }
      }
    }

    .e-date {
      margin: 0 5px;
    }
  }
</style>
