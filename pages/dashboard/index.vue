<template>
  <div class="app-dashboard">
    <events-list v-if="issues.length || $store.state.userSettings.dashboard_filter_project || loading"
                 :class="{'m-loading': loading}" :issues="issues"
                 :headers="headers" @changeProject="updateIssues(true)"></events-list>
    <div v-else-if="welcomeText" class="b-welcome">
      <editor-text :text="welcomeText" :files="welcomeFiles"></editor-text>
    </div>
  </div>
</template>

<script>
  import EventsList from '~/components/events/EventsList.vue'
  import { calculateThumb } from '~/utils/issues'
  import { raiseError } from '~/utils/helpers'
  import EditorText from '../../components/EditorText.vue'
  import { videosAutoPlay } from '~/utils/dom'
  import { debounce } from 'lodash'
  import listeners from '~/utils/mixins/listeners'
  import { DOCS } from '~/utils/dict'

  const getIssues = async (app, store, page) => {
    let filters = {}
    if (store.state.userSettings.dashboard_filter_project) {
      filters.id_project = store.state.userSettings.dashboard_filter_project
    }
    let promises = [
      app.$api.get('issues/with-events', {page, 'per-page': 50, filters}),
      // we have to read projects again here, to be sure
      // there are no events with projects that are not in the store
      store.dispatch('getProjects')
    ]
    return Promise.all(promises).then(async res => {
      let issues = res[0].data.issues
      let headers = res[0].headers
      if (!issues.length) {
        let slug = ''
        if (store.state.webuser.user.role === 'owner') {
          slug = DOCS.welcomeOwner
        } else {
          slug = DOCS.welcomeCoder
        }
        let [welcomeText, welcomeFiles] = await app.$api.get('docs/index', {slug}).then(res => [res.data.doc.text_html, res.data.doc.doc_files])
        return {issues: [], headers: [], welcomeText, welcomeFiles}
      } else {
        for (let k = 0; k < issues.length; k++) {
          let issue = issues[k]
          issue.thumb = calculateThumb(issue.thumb, {maxWidth: 170, maxHeight: 78})
        }
        return {issues, headers}
      }
    })
  }

  export default {
    components: {
      EditorText,
      EventsList
    },
    middleware: 'member',
    sockets: {
      dashboard_event () {
        this.updateIssues(false)
      },
      dashboard_event_read () {
        this.updateIssues(false)
      }
    },
    mixins: [listeners],
    head: {
      title: 'Dashboard'
    },
    data () {
      return {
        issues: [],
        headers: [],
        loading: false,
        welcomeText: '',
        welcomeFiles: []
      }
    },
    methods: {
      updateIssues (loader = true) {
        if (loader) {
          this.loading = true
        }
        getIssues(this, this.$store).then(({issues, headers}) => {
          this.issues = issues
          this.headers = headers
          this.loading = false
        })
      },
      scrollVideos: debounce((vm) => {
        vm.videosAutoPlay()
      }, 500),
      videosAutoPlay () {
        videosAutoPlay(this.$el.querySelectorAll('video.bu-video'))
      }
    },
    computed: {},
    mounted () {
      window.dashboardPage = this
      this.addListener(window, 'scroll', () => {
        this.scrollVideos(this)
      })
    },
    asyncData ({app, store, query, error}) {
      store.dispatch('Issues/updatePriorities')
      return getIssues(app, store).catch((e) => raiseError(error, e))
    }
  }
</script>

<style lang="less" type="text/less">

  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .app-dashboard {
    .c-events-list {
      &.m-loading {
        opacity: .5;
        pointer-events: none;
        cursor: progress !important;
      }
    }
    .b-welcome, .b-no-events {
      .white-box();
      margin: 20px auto;
      width: @issues-width;
      padding: 30px 40px;
    }
    .b-no-events {
      margin-top: 0;
    }
  }
</style>
