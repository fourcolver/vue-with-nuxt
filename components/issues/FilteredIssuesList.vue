<template>
  <div class="c-filtered-issues-list">
    <div class="b-header">
      Tasks with tag "{{ $store.getters['Issues/getActiveTag'].name }}"
    </div>
    <div class="b-issues-list" :class="{loading: $store.state.loading}">

      <issue @markDone="id => removeFromOpen(id)"
             @markRead="id => removeFromUnRead(id)"
             v-for="issue in issues" :issue="issue" :key="issue.id"></issue>

      <div class="b-footer-row">
        <div class="b-left">
        </div>
        <div class="b-right">
          <pagination v-if="headers"
                      :headers="headers" pageVar="filtered_page" class="b-pagination" template="2_buttons"></pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Issue from './Issue.vue'
  import Pagination from '../Pagination.vue'
  import { mapState } from 'vuex'

  export default {
    components: {
      Pagination,
      Issue
    },
    name: 'filtered-issues-list',
    data () {
      return {
        //
      }
    },
    methods: {
      removeFromOpen (id) {
        let issue = this.issues.find(el => +el.id === +id)
        if (issue) {
          issue.status = 'done'
          issue.is_open = 0
          this.issues.splice(this.issues.indexOf(issue), 1)
          this.$api.put('events/read', {id_issue: issue.id})
        }
      },
      removeFromUnRead (id) {
        let issue = this.issues.find(el => +el.id === +id)
        if (issue) {
          issue.is_read = 1
          issue.unread_events = 0
          this.$api.put('events/read', {id_issue: issue.id})
        }
      }
    },
    computed: {
      ...mapState('Issues', {issues: 'filteredIssues'}),
      ...mapState('Issues', {headers: 'filteredIssuesHeaders'})
    },
    watch: {
      '$route.query.filtered_page': function () {
        this.$store.dispatch('Issues/getFiltered')
      }
    },
    mounted () {
      window.filteredIssuesList = this
    },
    beforeDestroy () {
      window.filteredIssuesList = null
      this.$store.commit('Issues/SET_FILTERED', {issues: [], headers: {}})
      let query = {...this.$route.query}
      if (query.filtered_page) {
        delete query.filtered_page
        this.$router.push(query)
      }
    }
  }
</script>
<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/issues.less';

  .b-header {
    width: @issues-width;
    margin: 15px auto;
  }
</style>
