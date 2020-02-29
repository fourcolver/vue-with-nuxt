<template>
  <div class="c-radio-btn" @click="$emit('change', value)" :class="{'m-checked': checked}">
    <div class="b-icon">
      <i :class="checked ? 'bu-dot-circled' : 'bu-circle-empty'"></i>
    </div>
    <div class="b-label" v-if="label && !hasSlot">
      {{ label }}
    </div>
    <div class="b-label m-slot" v-if="hasSlot">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'radio-btn',
    model: {
      prop: 'model',
      event: 'change'
    },
    props: ['model', 'value', 'label', 'hasSlot'],
    data () {
      return {}
    },
    methods: {},
    computed: {
      checked () {
        // eslint-disable-next-line
        return this.model == this.value
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-radio-btn {
    display: flex;
    cursor: pointer;
    align-items: flex-start;
  }
</style>
