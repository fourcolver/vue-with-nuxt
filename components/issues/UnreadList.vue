<template>
  <div class="c-unread-list" :class="{loading: $store.state.loading}">
    <div class="b-issues">
      <issue @markDone="id => removeFromOpen(id)"
             @markRead="id => removeFromUnRead(id)" v-for="issue in $store.state.Issues.unread" :key="issue.id"
             :issue="issue" section="unread"></issue>
    </div>
  </div>
</template>

<script>
  import Issue from './Issue.vue'

  export default {
    components: {
      Issue
    },
    name: 'unread-list',
    data () {
      return {}
    },
    methods: {
      removeFromOpen (id) {
        let issue = this.$store.state.Issues.unread.find(el => +el.id === +id)
        if (issue) {
          issue.status = 'done'
          issue.is_open = 0
          // let status = this.$store.getters.getIssuesFilter('status')
          // if (!status || status === 'open') {
          this.$store.state.Issues.unread.splice(this.$store.state.Issues.unread.indexOf(issue), 1)
          // }
          this.$api.put('events/read', {id_issue: issue.id})
        }
      },
      async removeFromUnRead (id) {
        let issue = this.$store.state.Issues.unread.find(el => +el.id === +id)
        if (issue) {
          issue.is_read = 1
          await this.$api.put('events/read', {id_issue: issue.id})
          this.$store.state.Issues.unread.splice(this.$store.state.Issues.unread.indexOf(issue), 1)
        }
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-unread-list {
    width: @issues-width;
    margin: 0 auto;
    &.loading {
      opacity: .5;
      pointer-events: none;
    }
  }
</style>
