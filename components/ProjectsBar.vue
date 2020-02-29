<template>
  <div class="c-projects-bar">
    <div class="b-projects">
      <logo v-for="project in sortedProjects"
            :key="project.id"
            v-if="project.is_active"
            :projectUid="project.uid"
            :link="false"
            class="b-project"
            :class="{'m-current': currentProject === project.uid}"
            @click.stop="select(project.uid, $event)"
            @mouseenter.native="showMenu(project, $event)"
            @mouseleave.native="hideMenu">
      </logo>
    </div>

    <hover-events
      :isVisible="isMenuVisible"
      :position="menuPosition"
      @mouseleave="hideMenu"
      @mouseenter="showMenu">
    </hover-events>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import Logo from './Logo.vue'
  import HoverEvents from '~/components/events/HoverEvents.vue'
  import Listeners from '~/utils/mixins/listeners'
  import _ from 'lodash'

  export default {
    components: {
      Logo,
      HoverEvents
    },
    name: 'projects-bar',
    mixins: [Listeners],
    data () {
      return {
        isMenuVisible: false,
        menuPosition: null
      }
    },
    computed: {
      ...mapState('Issues', ['countTotal']),
      ...mapGetters({
        checkAccess: 'webuser/checkAccess',
        createProjectUrl: 'company/createProjectUrl'
      }),
      currentProject () {
        return this.$route.params.project || null
      },
      canBeActiveProject () {
        return ['company.issues.all', 'company.issues.project', 'company.comments.project'].includes(this.$route.name)
      },
      sortedProjects () {
        return _.orderBy(this.$store.state.projects, 'position')
      }
    },
    watch: {
      '$route.query.issue': 'hideMenu'
    },
    methods: {
      hideMenu () {
        this.timer = setTimeout(() => {
          this.isMenuVisible = false
        }, 100)
      },
      showMenu (project, event) {
        if (!project || project.uid === this.currentProject) {
          if (this.timer) clearTimeout(this.timer)
          if (project) {
            let rect = event.target.getBoundingClientRect()
            this.menuPosition = Math.round(rect.top + ((rect.bottom - rect.top) / 2))
          }
          this.isMenuVisible = true
        }
      },
      activate (force) {
        let showProjects
        if (typeof force !== 'undefined') {
          showProjects = force
        } else {
          showProjects = !this.isMenuOpen
        }
        this.$parent.mode = showProjects ? 'projects' : 'tags'
      },
      select (uid, e) {
        const route = this.createProjectUrl(uid)
        if (e.ctrlKey) {
          window.open(this.$router.resolve(route).href).focus()
        } else {
          this.$router.push(route)
          if (uid && this.$route.params.project === uid) {
            this.$store.dispatch('Issues/fetch')
          }
        }
      },
      openMenu (e) {
        if (!process.server) {
          this.$refs.ctxMenu.open(e)
        }
      },
      onSort (conf) {
        if (conf.moved && conf.moved.element) {
          const project = conf.moved.element
          this.$api.put('projects/' + project.id, {position: conf.moved.newIndex + 1})
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-projects-bar {
    background: #fafafa;
    padding-top: @navbar-height;
    border-right: 1.5px solid #ccc;
    border-top-color: transparent;
    width: @projects-bar-width;
    height: 100%;
    z-index: 102;
    position: fixed;
    &:hover + .b-sidebar.has-hover {
      opacity: 1;
    }
    & + .b-sidebar {
      left: @projects-bar-width;
    }
    .b-projects {
      max-height: calc(100% ~'-' @navbar-height);
      padding-top: 5px;
      .b-project {
        margin-bottom: 1px;
        position: relative;
        width: @projects-bar-width - 2;
        overflow: visible;
        &:not(.m-current), &.m-all {
          .b-logo {
            .e-logo {
              &:hover {
                & + .e-name {
                  visibility: visible;
                  transition-delay: .3s;
                  transition-property: visibility;
                }
              }
            }
          }
        }
        &.m-current {
          .b-logo {
            .e-logo:not(.click) {
              &:before {
                transform: scale3d(1, 1, 1);
              }
            }
          }
        }
      }
    }
    .b-controls {
      position: absolute;
      bottom: 0;
      height: @app-top-container-height;
      width: 100%;
      .e-control {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        cursor: pointer;
        &:hover {
          background-color: @hover-dark;
          padding: 5px;
        }
      }
      .b-menu-content {
        top: 0;
      }
      .b-menu-items {
        padding: 10px 15px;
        font-size: 14px;
        right: -10px;
      }
    }
  }

  #projects-bar-context-menu {
    .dropdown-mixin();
    .e-control-link {
      padding: 8px 10px;
      text-decoration: none;
      white-space: nowrap;
      &:hover {
        background: @hover-color;
        text-decoration: none !important;
      }
      .link-button();
      display: block;
    }
  }
</style>
