<template>
  <div class="app-profile-index" v-cloak>
    <div class="b-page-content">
      <edit-profile :user="user" @update="update"></edit-profile>
      <coders-profile :profile="codersProfile" v-if="user.role !== 'owner'"></coders-profile>
      <edit-company v-if="user.role === 'owner'"></edit-company>
      <notifications-settings :config="notificationsData"></notifications-settings>
      <plan-info v-if="user.role === 'owner'"></plan-info>
      <app-links></app-links>
      <misc-settings></misc-settings>
    </div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import EditProfile from '~/components/profile/EditProfile'
  import EditCompany from '~/components/profile/EditCompany'
  import LogoutLink from '~/components/LogoutLink.vue'
  import NotificationsSettings from '../../components/profile/NotificationsSettings.vue'
  import PlanInfo from '../../components/profile/PlanInfo.vue'
  import AppLinks from '../../components/profile/AppLinks.vue'
  import CodersProfile from '../../components/profile/CodersProfile.vue'
  import MiscSettings from '../../components/profile/MiscSettings.vue'

  export default {
    components: {
      MiscSettings,
      CodersProfile,
      AppLinks,
      PlanInfo,
      NotificationsSettings,
      EditProfile,
      EditCompany,
      LogoutLink
    },
    middleware: 'member',
    computed: {
      ...mapState('webuser', ['user']),
      ...mapGetters('webuser', ['company'])
    },
    head: {
      title: 'Profile'
    },
    data () {
      return {
        emailCategories: 'test1'
      }
    },
    methods: {
      update (user) {
        this.$store.commit('webuser/SET_USER', user)
        this.$store.dispatch('getCompanyUsers')
      }
    },
    async fetch ({ store }) {
      if (store.state.webuser && store.state.webuser.user && store.state.webuser.user.role === 'owner') {
        await store.dispatch('getCompanyProfileOptions')
      }
    },
    async asyncData ({app, store}) {
      let promises = [
        app.$api.get('settings-notifications').then(res => res.data)
      ]
      if (store.state.webuser.user.role !== 'owner') {
        promises.push(app.$api.get('coders-profile').then(res => res.data.coders_profile))
      }
      let data = await Promise.all(promises)
      return {
        notificationsData: data[0],
        codersProfile: data[1] || null
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .app-profile-index {
    @profile-width: @center-width + 60px;
    .app-top-container {
      .top-row;
      .b-center {
        line-height: @app-top-container-height - 2;
        width: @profile-width;
        margin: auto;
        font-size: 18px;
        font-weight: bold;
        &:after { .after-clearfix }
        @w-right: 100px;
        .b-left {
          margin-right: @w-right;
          .str-truncate;
        }
        .b-right {
          float: right;
          width: @w-right;
          text-align: right;
          .b-logout {
            display: inline-block;
            line-height: @app-top-container-height - 2;
            padding: 0 15px;
            cursor: pointer;
            .hover-mixin(false);
          }
        }
      }
    }
    .b-page-content {
      padding: 20px 0;
      width: @profile-width;
      margin: auto;
    }
  }
</style>

