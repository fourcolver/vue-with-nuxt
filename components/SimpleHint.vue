<template>
  <transition name="fade-default">
    <div class="b-simple-hint" data-uid="_uid" :data-position="position" v-click-outside="hide" v-key-escape="hide">
      <slot></slot>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'simple-hint',
    props: [
      'position',
      'autohide'
    ],
    methods: {
      hide () {
        this.$emit('hide')
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .b-simple-hint {
    @bg-color: #c0494a;
    @border-color: #904241;
    @top-padding: 5px;
    @arrow-size: 8px;
    background-color: @bg-color;
    border: @border-color solid 1px;
    color: #fff;
    padding: @top-padding 15px;
    border-radius: 6px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, .175);

    position: absolute;
    z-index: 100;

    &[data-position=top] {
      bottom: 100%;
      margin-bottom: @arrow-size;
      left: 0;
      &:after {
        content: " ";
        position: absolute;
        top: 100%; /* At the bottom of the tooltip */
        /*left: 50%;*/
        left: 20%;
        margin-left: -@arrow-size + 1;
        border-width: @arrow-size - 1;
        border-style: solid;
        border-color: @bg-color transparent transparent transparent;
      }
      &:before {
        content: " ";
        position: absolute;
        top: 100%; /* At the bottom of the tooltip */
        /*left: 50%;*/
        left: 20%;
        margin-left: -@arrow-size;
        border-width: @arrow-size;
        border-style: solid;
        border-color: @border-color transparent transparent transparent;
      }
    }

    &[data-position=right] {
      top: -5px;
      left: 105%;
      &:after {
        content: " ";
        position: absolute;
        top: 50%;
        right: 100%; /* To the left of the tooltip */
        margin-top: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent @bg-color transparent transparent;
      }
    }
    &[data-position=left] {
      top: -5px;
      right: 105%;
      &:after {
        content: " ";
        position: absolute;
        top: 50%;
        left: 100%; /* To the right of the tooltip */
        margin-top: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent transparent @bg-color;
      }
    }
    &[data-position=bottom] {
      top: calc(100% + 15px);
      left: 0;
      &:after {
        content: " ";
        position: absolute;
        bottom: 100%;  /* At the top of the tooltip */
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent @bg-color transparent;
      }
    }
  }
</style>
