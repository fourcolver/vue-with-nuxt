<template>
  <div>
    <div class="b-issues-list" :class="{loading: $store.state.loading}">

      <div v-if="priorities" v-for="(issues, priorityGroupNum) in priorities" class="b-priority-block">

        <div class="b-priority-header m-header" v-if="issues.length && $store.state.Issues.countsByPriority.length">
          <priority-label :weight="issues[0].priority_weight"></priority-label>
          <span class="e-cnt">{{ getCountByPriority(issues[0].priority_weight) }}</span>
        </div>

        <issue @markDone="id => removeFromOpen(id)"
               @markRead="id => removeFromUnRead(id)"
               v-for="issue in issues" :issue="issue" :key="issue.id"></issue>
      </div>

      <div v-if="!priorities.length && !$store.state.Issues.starred.length && !$store.state.Issues.unread.length" class="b-empty">
        <div class="e-label">
          {{ $t('No tickets found') }}
        </div>
        <div class="b-reset" v-if="!$store.getters['Issues/isFilterDefault']"
             @click="$store.dispatch('Issues/resetFilter')">{{ $t('Reset filter') }}</div>
      </div>


      <div class="b-footer-row" v-if="$store.state.Issues.countTotal">
        <div class="b-left">
          <issues-stats></issues-stats>
        </div>
        <div class="b-right">
          <pagination v-if="$store.state.Issues.countTotal && $store.state.Issues.headers"
                    :headers="$store.state.Issues.headers" class="b-pagination" template="2_buttons"></pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import TagLabel from '~/components/TagLabel.vue'
  import Dropdown from '~/components/Dropdown.vue'
  import Issue from './Issue.vue'
  import IssuesStats from './IssuesStats.vue'
  import PriorityLabel from '~/components/PriorityLabel.vue'
  import Pagination from '../Pagination.vue'

  export default {
    components: {
      Pagination,
      PriorityLabel,
      TagLabel,
      Dropdown,
      Issue,
      IssuesStats
    },
    name: 'issues-list',
    computed: {
      pageNumbers () {
        let numbers = []
        let cnt = 10
        let cntPages = this.$store.state.Issues.issuesPagesCnt
        let page = this.$route.query.page || 1
        let start = page - cnt / 2
        if (start < 1) {
          start = 1
        }
        let end = start + cnt - 1
        if (end > cntPages) {
          end = cntPages
        }
        for (let i = start; i <= end; i++) {
          numbers.push(i)
        }
        return numbers
      },
      priorities () {
        if (this.$store.state.loading && this._priorities && this._priorities.length) {
        // if (this._priorities && this._priorities.length) {
          return this._priorities
        }
        // explode into section if we requested countByPriorities stats
        if (!this.$store.state.Issues.countsByPriority.length) {
          this._priorities = this.$store.state.Issues.issues.length ? [this.$store.state.Issues.issues] : []
          return this._priorities
        }
        var h = {}
        var keys = []
        for (let k in this.$store.state.Issues.issues) {
          let issue = this.$store.state.Issues.issues[k]
          if (!h[issue.priority_weight]) {
            h[issue.priority_weight] = []
            keys.push(issue.priority_weight)
          }
          h[issue.priority_weight].push(issue)
        }
        var ret = []
        keys.sort().reverse()
        for (let k in keys) {
          ret.push(h[keys[k]])
        }
        this._priorities = ret
        return ret
      }
    },
    data () {
      return {
        stateOptions: [
          {
            id: 'all',
            name: this.$t('All')
          },
          {
            id: 'open',
            name: this.$t('Open')
          },
          {
            id: 'closed',
            name: this.$t('Closed')
          }
        ],
        _priorities: []
      }
    },
    methods: {
      getCountByPriority (id) {
        const item = this.$store.state.Issues.countsByPriority.find(el => el.priority_weight.toString() === id.toString())
        return item && item.count ? item.count : null
      },
      removeFromOpen (id) {
        let issue = this.$store.state.Issues.issues.find(el => +el.id === +id)
        if (issue) {
          issue.status = 'done'
          issue.is_open = 0
          if (!this.$store.getters['Issues/getFilter']('is_closed')) {
            this.$store.state.Issues.issues.splice(this.$store.state.Issues.issues.indexOf(issue), 1)
          }
          this.$api.put('events/read', {id_issue: issue.id})
        }
      },
      removeFromUnRead (id) {
        let issue = this.$store.state.Issues.issues.find(el => +el.id === +id)
        if (issue) {
          issue.is_read = 1
          issue.unread_events = 0
          this.$api.put('events/read', {id_issue: issue.id})
        }
      }
    },
    watch: {
      '$route.query.page': function () {
        this.$store.dispatch('Issues/fetch')
      }
    },
    mounted () {
      window.issuesList = this
    },
    beforeDestroy () {
      window.issuesList = null
    }
  }
</script>
<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/issues.less';
</style>
