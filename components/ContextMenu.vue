<template>
  <div class="b-context-menu"
       :class="{['direction-' + computedDirection.x]: true,  ['direction-' + computedDirection.y]: true, disabled}"
       :data-uid="_uid">
    <div class="b-trigger" v-click-outside="clickOutside" @click="click" @mouseover="mouseover" @mouseleave="mouseleave"
         v-key-escape="escape">
      <div class="b-menu-content">
        <slot name="content">
          Context menu
        </slot>
      </div>
      <div v-if="preload ? true : open" v-show="preload ? open : true" class="b-menu-items" :class="itemsClasses" @click="clickInside" @mouseenter="cancelClose">
        <div v-if="scrollable" class="b-scroll" v-bar>
          <slot name="items">
            Items
          </slot>
        </div>
        <slot name="items" v-else>Items</slot>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'context-menu',
    props: [
      'trigger',
      'direction',
      'delay',
      'autoClose',
      'disabled',
      'forceOpen',
      'preload',
      'anchor',
      'closeDelay',
      'itemsClasses',
      'itemsStyle',
      'scrollable'
    ],
    data () {
      return {
        open: false,
        handle: null,
        closeTimeout: null,
        computedDirection: {
          x: 'right',
          y: 'bottom'
        }
      }
    },
    methods: {
      click (event) {
        if (this.disabled || this.trigger !== 'click') return
        this.toggle(!this.open)
      },
      clickOutside (event) {
        if (this.trigger !== 'click') return
        this.toggle(false)
      },
      mouseover (event) {
        if (this.disabled || this.trigger !== 'hover') return
        if (this.delay) {
          if (!this.handle) {
            this.handle = setTimeout(() => this.toggle(true), this.delay)
          }
        } else {
          this.toggle(true)
        }
      },
      mouseleave (event) {
        if (this.trigger !== 'hover') return
        const close = () => this.toggle(false)
        if (!this.closeDelay) {
          close()
        } else {
          this.closeTimeout = window.setTimeout(close, this.closeDelay)
        }
      },
      escape (event) {
        this.toggle(false)
      },
      toggle (val) {
        clearTimeout(this.handle)
        this.handle = null
        this.open = val
        this.$emit(this.open ? 'open' : 'close')
        if (val) {
          this.setDirection()
        }
      },
      clickInside (e) {
        if (this.autoClose) {
          this.toggle(false)
        }
        e.stopPropagation()
      },
      cancelClose () {
        if (this.closeTimeout) {
          window.clearTimeout(this.closeTimeout)
          this.closeTimeout = null
        }
      },
      setDirection () {
        if (Array.isArray(this.direction)) {
          this.computedDirection.x = this.direction[0]
          this.computedDirection.y = this.direction[1]
        } else {
          if (this.direction) {
            this.computedDirection.x = this.direction
          } else {
            if (this.$el.getBoundingClientRect().right + this.$el.offsetWidth > window.innerWidth) {
              this.computedDirection.x = 'left'
            } else {
              this.computedDirection.x = 'right'
            }
          }
          if (this.$el.getBoundingClientRect().bottom + this.$el.offsetHeight + 10 > window.innerHeight) {
            this.computedDirection.y = 'top'
          } else {
            this.computedDirection.y = 'bottom'
          }
        }
      }
    },
    mounted () {
      if (this.forceOpen) {
        this.open = true
      }
      if (this.anchor) {
        window[this.anchor] = this
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .b-context-menu {
    position: relative;
    display: inline-block;
    .b-menu-content {
      display: inline-block;
      cursor: pointer;
    }
    .b-menu-items {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1000;
      white-space: nowrap;
      .dropdown-mixin();
      .b-items {
        padding: 0;
        .b-item {
          > a{
            text-decoration: none;
            display: block;
            padding: 10px 15px;
            &:hover {
              background: @hover-color;
            }
          }
        }
      }
    }
    &.direction-left {
      .b-menu-items {
        left: auto;
        right: 0;
        text-align: left;
      }
    }
    &.direction-top {
      .b-menu-items {
        top: auto;
        bottom: 100%;
        margin-bottom: 0 !important;
      }
    }
  }
</style>
