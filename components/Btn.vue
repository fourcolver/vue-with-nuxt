<template>

  <div @click="click" class="btn" :class="{inactive: !active}" v-tooltip="!active ? inactiveTooltip : null">
    <quwi-spinner v-if="loading"></quwi-spinner>
    <template v-else>
      <i class="e-icon" :class="iconClass" v-if="iconClass"></i>
      <span class="e-text">{{ text }}</span>
    </template>
    <button v-if="isSubmit" v-show="false" type="submit"></button>
  </div>
</template>
<script>
  import QuwiSpinner from './Spinner.vue'

  export default {
    components: {QuwiSpinner},
    props: {
      iconClass: null,
      text: {},
      loading: {},
      active: {
        default: true
      },
      isSubmit: {
        default: true
      },
      inactiveTooltip: null
    },
    name: 'btn',
    mounted () {
      if (!this.loading) {
        this.$nextTick(() => {
          this.$el.style.width = getComputedStyle(this.$el).width
        })
      }
    },
    methods: {
      click (e) {
        if (!this.active) {
          e.stopPropagation()
          e.preventDefault()
        } else {
          this.$emit('click')
        }
      }
    }
  }
</script>

<style lang="less">
  @import '../assets/css/libs/load_awesome/load_awesome.less';

  .btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    &.inactive {
      opacity: .7;
      cursor: default;
      button {
        cursor: default;
      }
    }
    .e-text {
      white-space: nowrap;
    }
    .e-icon {
      display: inline-block !important;
      margin-right: 5px;
    }

  }
</style>
