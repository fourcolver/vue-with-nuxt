<template>
  <div class="b-sidebar"
       @mouseout="hide"
       :class="{'m-locked': isLocked, 'has-hover': hasHover && !isHidden, 'm-top': isOnTop}"
       :style="computedStyle">
    <div v-if="!isHidden" class="b-sidebar-handle"></div>
    <resizer ref="resizer" @update="updateWidth"></resizer>
  </div>
</template>
<script>
  import ProjectsBar from './ProjectsBar.vue'
  import Listeners from '~/utils/mixins/listeners'
  import Resizer from '~/components/Resizer.vue'

  import { debounce } from '~/utils/helpers'

  export default {
    name: 'sidebar',
    props: ['hidden'],
    mixins: [Listeners],
    components: {
      ProjectsBar,
      Resizer
    },
    data () {
      return {
        hasHover: true,
        mode: 'tags',
        isOnTop: true
      }
    },
    methods: {
      hideProjects () {
        const duration = 0.3
        const el = document.querySelector('.b-projects')
        if (!el) {
          return
        }
        el.style.transition = `opacity ${duration}s`
        el.style.opacity = 0
        let hideTimer = setTimeout(() => {
          this.mode = 'tags'
          el.style.opacity = el.style.transition = ''
          el.removeEventListener('mouseenter', cancelFunc)
        }, duration * 1000)
        let cancelFunc = () => {
          clearTimeout(hideTimer)
          el.style.opacity = el.style.transition = ''
          el.removeEventListener('mouseenter', cancelFunc)
        }
        el.addEventListener('mouseenter', cancelFunc)
      },
      scrollHandler () {
        this.isOnTop = window.scrollY === 0
      },
      hide (e) {
        if (!this.$el.contains(e.toElement) && !this.$refs.resizer.isResizableDrag) {
          this.$el.classList.remove('visible')
        }
      },
      debouncedUpdateUserSettings: debounce((vm, val) => {
        vm.$store.dispatch('updateUserSettings', { cats_bar_width: val })
      }, 1000),
      updateWidth (newWidth) {
        if (newWidth > this.maxSidebarWidth) {
          newWidth = this.maxSidebarWidth
        }
        this.$store.commit('SET_SIDEBAR_ZOOM_WIDTH', 0)
        this.$store.commit('SET_SIDEBAR_WIDTH', newWidth)
        this.debouncedUpdateUserSettings(this, newWidth)
      },
      checkBoundaries () {
        if (this.sidebarWidth > this.maxSidebarWidth) {
          this.$store.commit('SET_SIDEBAR_ZOOM_WIDTH', this.maxSidebarWidth)
        } else {
          this.$store.commit('SET_SIDEBAR_ZOOM_WIDTH', 0)
        }
      },
      handleResize () {
        if (this.sidebarWidth > this.maxSidebarWidth) {
          this.$store.commit('SET_SIDEBAR_ZOOM_WIDTH', this.maxSidebarWidth)
        } else {
          this.$store.commit('SET_SIDEBAR_ZOOM_WIDTH', 0)
        }
      }
    },
    computed: {
      isHidden () {
        return true
      },
      isLocked () {
        return false
      },
      sidebarWidth () {
        return this.$store.state.sidebarWidth
      },
      sidebarZoomWidth () {
        return this.$store.state.sidebarZoomWidth
      },
      computedStyle () {
        let width = this.sidebarZoomWidth ? this.sidebarZoomWidth : this.sidebarWidth
        return {
          width: `${width}px`
        }
      }
    },
    mounted () {
      this.addListener(window, 'scroll', this.scrollHandler)
      window.addEventListener('resize', this.handleResize)
      this.handleResize()

      this.$store.commit('SET_SIDEBAR_COMPONENT', this)
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.handleResize)
      this.$store.commit('SET_SIDEBAR_COMPONENT', null)
    }
  }
</script>
<style lang="less" type="text/less">

  @import '~assets/css/variables.less';

  .b-sidebar, .b-sidebar-handle {
    position: fixed;
    height: 100%;
    z-index: 2;
  }

  .b-sidebar {
    padding-top: @navbar-height;
    width: @sidebar-width;
    visibility: hidden;
    opacity: 0;
    background: #fafafa;
    border-right: 1px solid #b5b5b5;
    display: flex;
    z-index: 2;
    .b-sidebar-handle {
      position: absolute;
      left: @sidebar-width;
      top: 0;
      width: @sidebar-width;
      display: none;
    }
    &.has-hover:hover, &.m-locked, &.visible {
      visibility: visible;
      opacity: 1;
      transition: none;
    }
    transition: opacity .3s linear, visibility .3s linear;
    &.m-locked {
      transition: none !important;
    }
    &:not(.has-hover) {
      visibility: hidden;
    }
    > .b-logo {
      border-bottom: 1px solid #636363;
      width: 100%;
      height: @navbar-height;
    }
    &.m-top {
      .b-project-selector .b-logo {
        background: #fafafa;
        width: calc(~'100% + 1px');
      }
      .b-project-selector .b-projects .b-logo {
        width: 100%;
      }
    }
  }


</style>
