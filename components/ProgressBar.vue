<template>
  <div class="c-progress-bar">
    <div ref="bar" class="e-bar" @click="click">
      <div class="e-fill" :style="{width: percent + '%'}"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'progress-bar',
    props: ['percent', 'stopPropagation'],
    data () {
      return {}
    },
    methods: {
      click (e) {
        const width = this.$refs.bar.getBoundingClientRect().width
        const offset = e.clientX - this.$refs.bar.getBoundingClientRect().x
        this.$emit('click', Math.round(offset / width * 100))
        if (this.stopPropagation) {
          e.stopPropagation()
        }
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  .c-progress-bar {
    .e-bar {
      height: 7px;
      width: 50px;
      background: #e5e5e5;
      border-radius: 4px;
      .e-fill {
        background: #2975dc;
        height: 100%;
        border-radius: 4px;
      }
    }
  }
</style>
