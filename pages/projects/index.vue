<template>
  <div class="app-projects-index">
    <div class="app-top-container top-row">
      <div class="b-center">
        <div class="b-left">
          {{ $t('Projects') }}
        </div>
        <div class="b-right">
          <btn @click="$router.push({path: '/projects/edit'})" :text="$t('Create')"></btn>
        </div>
      </div>
    </div>
    <div class="b-projects">
      <context-menu trigger="click" class="b-settings" autoClose="true">
        <span slot="content">
          <i class="bu-gear"></i>
        </span>
        <div slot="items" class="b-items">
          <div class="b-item">
            <a class="e-toggle-link link-button" @click="toggleInactive">
              {{ $t(userSettings.hide_inactive_projects ? 'Show inactive' : 'Hide inactive') }}
            </a>
          </div>
        </div>
      </context-menu>

      <draggable :list="activeProjects" @end="saveMove" :move="() => !sending">
        <project-box v-for="project in activeProjects" :key="project.id" :project="project"></project-box>
      </draggable>

      <project-box v-if="!userSettings.hide_inactive_projects"
         v-for="project in inActiveProjects" :key="project.id" :project="project"></project-box>
    </div>
  </div>
</template>

<script>
  import Btn from '~/components/Btn.vue'
  import ContextMenu from '~/components/ContextMenu.vue'
  import ProjectBox from '~/components/projects/ProjectBox.vue'
  import { getErrorFromResponse, raiseError } from '~/utils/helpers'
  import { mapState } from 'vuex'
  import draggable from 'vuedraggable'
  import _ from 'lodash'

  export default {
    components: {
      ContextMenu,
      Btn,
      ProjectBox,
      draggable
    },
    middleware: ['member', 'owner'],
    head: {
      title: 'Projects'
    },
    data () {
      return {
        inActiveProjects: [],
        activeProjects: [],
        sending: false
      }
    },
    computed: {
      ...mapState(['userSettings'])
    },
    methods: {
      saveMove (e) {
        if (e.newIndex === e.oldIndex) {
          return false
        }
        this.sending = true
        let project = this.activeProjects[e.newIndex]
        return this.$api.put('projects-manage/update?id=' + project.id, {position: e.newIndex + 1}).then(res => {
          this.activeProjects.forEach((el, index) => {
            el.position = index + 1
            const stateProject = this.$store.state.projects.find(p => +p.id === +el.id)
            if (stateProject) {
              stateProject.position = el.position
            }
          })
        }).catch(err => {
          this.activeProjects = _.orderBy(this.activeProjects, ['position'])
          alert(getErrorFromResponse(err))
        }).finally(() => {
          this.sending = false
        })
      },
      toggleInactive () {
        const params = {hide_inactive_projects: +!this.userSettings.hide_inactive_projects}
        this.$store.dispatch('updateUserSettings', params).catch(() => {
          alert(this.$t('Operation cannot be done now'))
        })
      }
    },
    asyncData ({app, error}) {
      return app.$api.get('projects-manage').then(res => {
        return {
          inActiveProjects: _.orderBy(res.data.projects.filter(p => !p.is_active), ['position']),
          activeProjects: _.orderBy(res.data.projects.filter(p => p.is_active), ['position'])
        }
      }).catch((e) => raiseError(error, e))
    }
  }
</script>

<style lang="less" type="text/less">
  @import "~assets/css/variables.less";
  @import "~assets/css/mixins.less";

  .app-projects-index {
    .app-top-container {
      .top-row;
      display: flex;
      align-items: center;
      .b-center {
        width: @center-width;
        margin: auto;
        display: flex;
        > .b-left {
          flex: 1;
          font-weight: bold;
          font-size: 1.1em;
        }
        > div {
          display: flex;
          align-items: center;
        }
      }
    }
    .b-projects {
      margin: 15px auto 50px auto;
      width: @center-width;
      position: relative;

      .b-settings {
        position: absolute;
        right: -40px;
        top: 0;
        z-index: 2;
        .b-trigger {
          padding: 8px;
          .hover-mixin(true);
        }
      }

      .b-buttons {
        text-align: right;
        margin-bottom: 20px;
      }
    }
  }
</style>
