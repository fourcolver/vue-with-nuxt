<template>
  <div class="c-toggle b-toggle" :class="{ 'e-true': value }" @click="click">
    <div></div>
  </div>
</template>

<script>
  export default {
    name: 'toggle',
    model: {
      prop: 'value',
      event: 'change'
    },
    props: [
      'value'
    ],
    methods: {
      click (e) {
        this.$emit('change', !this.value)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .b-toggle {
    cursor:pointer;
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: #c33a24;
    div {
      position: absolute;
      top: 4px;
      background: #fff;
      border-radius: 7px;
      width: 14px;
      height: 14px;
      left: 4px;
    }

    &.e-true {
      background: #0b8f14;
      div {
        left: auto;
        right: 4px;
      }
    }
  }
</style>
