<template>
  <div class="c-time-input">
    <div class="b-item" v-for="sec, i in [3600, 60, 1]">
      <div class="e-arrow m-top" @click="add(sec)" :class="{inactive: max.diff(date, 'seconds') <= sec - 1}">
        <i class="bu-up-dir"></i>
      </div>
      <div class="b-digit">
        <span class="e-digit">{{ date.format(getFormat(sec)) }}</span>
        <span class="e-colon" v-if="i !== 2">:</span>
      </div>
      <div class="e-arrow m-bottom" @click="add(-sec)" :class="{inactive: date.diff(min, 'seconds') <= sec - 1}">
        <i class="bu-down-dir"></i>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'time-input',
    data () {
      return {
        date: null
      }
    },
    model: {
      prop: 'model',
      event: 'change'
    },
    props: ['min', 'max', 'format', 'model'],
    methods: {
      add (sec) {
        let newDate = this.date.clone().add(sec, 's')
        if (newDate.isBefore(this.min) || newDate.isAfter(this.max)) {
          return
        }
        this.date = newDate
        this.$emit('change', this.date.format(this.format || 'YYYY-MM-DD HH:mm:ss'))
      },
      getFormat (sec) {
        switch (sec) {
          case 3600:
            return 'HH'
          case 60:
            return 'mm'
          case 1:
            return 'ss'
        }
      }
    },
    created () {
      this.date = this.$date(this.model)
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-time-input {
    display: flex;
    .b-item {
      text-align: center;
      &:not(:last-child) {
        // margin-right: 10px;
      }
      .e-arrow {
        font-size: 2em;
        &:not(.inactive) {
          .hover-mixin();
        }
        &.inactive {
          opacity: .5;
        }
        i {
          display: block;
          line-height: 20px;
          &:before {
            line-height: 20px;
            margin: 0;
          }
        }
      }
      .b-digit {
        position: relative;
        font-weight: bold;
        .e-digit {
          font-size: 1.3em;
        }
        .e-colon {
          position: absolute;
          top: 0;
          right: -2px;
          font-size: 1.2em;
        }
      }
    }
  }
</style>