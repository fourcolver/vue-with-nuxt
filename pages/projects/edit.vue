<template>
  <div class="app-projects-edit" data-uid="_uid">
    <div class="app-top-container top-row">
      <div class="b-center">
        <button class="btn btn-light-grey" type="button" @click="$router.push('/projects')">{{ $t('Back') }}</button>
      </div>
    </div>
    <div class="b-page-content">
      <edit-project :project="project" :users="users" @update="update"></edit-project>
    </div>
  </div>
</template>

<script>
  import EditProject from '~/components/projects/EditProject.vue'
  import { raiseError, capitalize } from '~/utils/helpers'

  export default {
    components: {
      EditProject
    },
    head: {
      title: 'Projects'
    },
    data () {
      return {
        project: {},
        users: []
      }
    },
    methods: {
      update (project) {
        this.project = project
        this.$store.commit('UPDATE_PROJECT', {...project})
        if (!this.$route.query.id) {
          this.$router.replace('/projects/edit?id=' + project.id)
        }
      },
      capitalize
    },
    mounted () {
      window.editProject = this
    },
    async asyncData ({route, error, app}) {
      let promises = [
        app.$api.get('users-manage', {sort: 'is_active-,dta_create'})
      ]
      if (route.query.id) {
        promises.push(app.$api.get('projects-manage/' + route.query.id))
      }
      return Promise.all(promises).then(res => {
        return {
          users: res[0].data.users,
          project: res[1] ? res[1].data.project : {}
        }
      }).catch((e) => raiseError(error, e))
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .app-projects-edit {
    .app-top-container {
      .top-row;
      display: flex;
      align-items: center;
      .b-center {
        width: @center-width;
        margin: auto;
        font-size: 18px;
        font-weight: bold;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .b-page-content {
      padding: 20px 0;
      width: @center-width;
      margin: auto;
    }
  }
</style>
