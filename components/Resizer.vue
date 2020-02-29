<template>
  <div class="b-resizer"
    @mousedown="resizableMouseDown"
    @mouseover="resizableMouseOver"
    @mouseout="resizableMouseOut"
    :class="{'m-draggable' : showResizable, 'm-left': position == 'left', 'm-right': position == 'right' }"
  >
  </div>
</template>

<script>
export default {
  data () {
    return {
      previousX: 0,
      showResizable: false,
      isResizableDrag: false
    }
  },
  props: {
    position: {
      type: String,
      default: 'right'
    }
  },
  methods: {
    resizableMouseOut () {
      if (!this.isResizableDrag) {
        this.showResizable = false
      }
    },
    resizableMouseOver () {
      this.showResizable = true
    },
    resizableMouseDown (e) {
      this.isResizableDrag = true
      this.previousX = e.x
      this.setListeners(true)
      document.body.classList.add('m-resizer-no-select')
    },
    resizableUpListener () {
      this.showResizable = false
      this.isResizableDrag = false
      this.setListeners(false)
      document.body.classList.remove('m-resizer-no-select')
    },
    resizableMoveListener (e) {
      if (this.previousX) {
        const bb = this.$parent.$el.getBoundingClientRect()
        let delta = e.x - this.previousX
        if (this.position === 'left') {
          delta = this.previousX - e.x
        }
        const newWidth = bb.width + delta
        this.$emit('update', newWidth)
      }
      this.previousX = e.x
    },
    setListeners (listen) {
      if (listen) {
        document.addEventListener('mousemove', this.resizableMoveListener, true)
        document.addEventListener('mouseup', this.resizableUpListener, true)
      } else {
        document.removeEventListener('mousemove', this.resizableMoveListener, true)
        document.removeEventListener('mouseup', this.resizableUpListener, true)
      }
    }
  }
}
</script>

<style lang="less" type="text/less">
  @resizer-width: 5px;
  .b-resizer {
    background-color: transparent;
    width: @resizer-width;
    position: absolute;
    top: 0;
    height: 100vh;
    z-index: 1;
    cursor: ew-resize;
    transition: background ease-in-out 0.2s;
    &.m-draggable {
      background: #a1c8fe;
    }
    &.m-left {
      left: -@resizer-width;
    }
    &.m-right {
      right: -@resizer-width;
    }
  }

  .m-resizer-no-select {
    user-select: none;
  }
</style>

