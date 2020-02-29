<template>

  <div class="c-hover-events"
       :class="{visible: visible && computedPosition}"
       :style="{top: computedPosition + 'px'}"
       @mouseleave="hide"
       @mouseenter="$emit('mouseenter')">
    <small-event v-for="event in lastEvents" :key=" 'se_' + event.id" :event="event" :showRead="false"
                 :showProject="false"></small-event>
  </div>
</template>

<script>
  import TagLabel from '~/components/TagLabel.vue'
  import SmallEvent from '../events/SmallEvent.vue'

  export default {
    components: {
      SmallEvent,
      TagLabel
    },
    props: {
      isVisible: Boolean,
      position: Number
    },
    name: 'hover-events',
    data () {
      return {
        viewportHeight: null,
        currentIssueNumber: null
      }
    },
    mounted: function () {
      this.updateViewportHeight()
      window.addEventListener('resize', this.updateViewportHeight)
      window.hoverEvents = this
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.updateViewportHeight)
    },
    computed: {
      visible () {
        return this.$route.name === 'company.comments.project' && this.lastEvents.length > 0 && this.isVisible
      },
      computedPosition () {
        if (this.visible && this.position && this.$el && this.$el.getBoundingClientRect) {
          let height = this.$el.getBoundingClientRect().height
          if (height) {
            let margin = 10
            let halfHeightList = Math.round(height / 2)
            let position = this.position - halfHeightList
            let maxTop = document.querySelector('.app-navbar').getBoundingClientRect().height + margin
            let maxBottom = this.viewportHeight - margin - height
            if (position > maxTop) {
              if (position < maxBottom) {
                return position
              }
              return maxBottom
            }
            return maxTop
          }
        }
      },
      lastEvents () {
        let project = this.$store.getters['company/getProject'](this.$route.params.project)
        if (!project) {
          return this.$store.state.unreadEvents.slice(0, 3)
        }
        return this.$store.state.unreadEvents.filter(el => +el.id_project === +project.id).sort((a, b) => +this.$date(b.dta_create) > this.$date(a.dta_create) ? 1 : -1).slice(0, 3)
      }
    },
    methods: {
      updateViewportHeight () {
        this.viewportHeight = window.innerHeight
      },
      hide () {
        this.$emit('mouseleave')
      }
    }
  }
</script>

<style lang="less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-hover-events {
    .white-box();
    position: absolute;
    left: 69px;
    top: 55px;
    z-index: 2;
    visibility: hidden;
    width: 400px;
    padding: 10px 0;
    &.visible {
      visibility: visible;
    }
    .c-small-event {
      .b-issue-click {
        padding: 5px 10px;
      }
    }
  }
</style>
