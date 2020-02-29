<template>
  <div class="stats-screenshots">
    <div class="b-top">
      <div class="e-back">
        <nuxt-link :to="backUrl">&lt; {{ $t('Back') }}</nuxt-link>
      </div>
    </div>
    <div class="b-screenshots" v-if="screens.length"
         v-infinite-scroll="loadMore"
         infinite-scroll-disabled="loadDisabled"
         infinite-scroll-distance="10">
      <screenshots-list @screenClick="item => $refs.viewer.show(item)"
                        :showUser="false"
                        :class="{loading}" :user="user"
                        @delete="getScreens({userId: user.id})"></screenshots-list>
      <screenshots-viewer @next="loadMore" :selectable="true"
                          ref="viewer" :screens="screens" :currentUser="user" :isLoadMore="true"
                          :headers="headers"></screenshots-viewer>
    </div>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import ScreenshotsList from '../../components/stats/ScreenshotsList.vue'
  import { raiseError } from '~/utils/helpers'
  import ScreenshotsViewer from '../../components/stats/ScreenshotsViewer.vue'

  export default {
    components: {
      ScreenshotsViewer,
      ScreenshotsList
    },
    data () {
      return {
        loading: false,
        page: 1
      }
    },
    fetch ({store, query, app, error}) {
      let userId = query.id || store.state.webuser.user.id
      let promises = [
        store.dispatch('stats/getScreens', {userId})
      ]
      return Promise.all(promises).catch((e) => raiseError(error, e))
    },
    methods: {
      ...mapActions({
        getScreens: 'stats/getScreens'
      }),
      async loadMore () {
        this.loading = true
        await this.getScreens({
          userId: this.user.id,
          page: ++this.page,
          filters: {
            dta_to: this.$date(this.screens.find(el => !el.is_instant).dta).unix()
          }
        })
        this.loading = false
      }
    },
    computed: {
      ...mapState({
        screens: state => state.stats.screens,
        headers: state => state.stats.screensHeaders
      }),
      loadDisabled () {
        return this.loading || +this.headers['x-pagination-page-count'] <= this.page
      },
      user () {
        const userId = this.$route.query.id || this.$store.state.webuser.user.id
        return this.$store.state.companyUsers.find(el => +el.id === +userId)
      },
      backUrl () {
        const isOwner = this.$store.state.webuser.user.role === 'owner'
        if (isOwner) {
          return {path: '/stats/user', query: {id: this.user.id}}
        }
        return '/my-stats'
      }
    },
    mounted () {
      window.statsScreenshotsPage = this
    }
  }
</script>

<style lang="less" type="text/less">
  .stats-screenshots {
    @import '~assets/css/mixins.less';
    > .b-top {
      display: flex;
      position: relative;
      margin-bottom: 15px;
      .e-back {
        position: absolute;
        font-size: .8em;
        text-transform: uppercase;
        top: 10px;
        left: 10px;
        font-weight: bold;
        white-space: nowrap;
        a {
          color: #2975dc;
        }
      }
    }
  }
</style>