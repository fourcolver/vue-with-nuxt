<template>

  <div class="c-starred-list" :class="{loading: $store.state.loading}">
    <div class="m-header">
      <div class="b-left">
        <span class="e-name"><i class="bu-star"></i></span>
        <span class="e-cnt">{{ $store.state.Issues.starred.length }}</span>
      </div>
    </div>
    <issue @markDone="id => read(id, true)" @markRead="id => read(id)"
           v-for="issue in $store.state.Issues.starred" :issue="issue"
           :key="issue.id" section="starred"></issue>
  </div>
</template>

<script>
  import Issue from './Issue.vue'

  export default {
    name: 'starred-list',
    components: {
      Issue
    },
    data () {
      return {}
    },
    methods: {
      read (id, isDone = false) {
        let issue = this.$store.state.Issues.starred.find(el => +el.id === +id)
        if (issue) {
          if (isDone) {
            issue.status = 'done'
            issue.is_open = 0
          }
          issue.unread_events = 0
          issue.is_read = 1
          this.$api.put('events/read', {id_issue: issue.id})
        }
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-starred-list {
    width: @issues-width;
    margin: 0 auto;
    &.loading {
      opacity: .5;
      pointer-events: none;
    }
    .m-header {
      .e-name {
        margin-right: 3px;
        font-size: 1em;
        .bu-star {
          color: #666;
        }
      }
      .e-cnt{
        color: #777;
        font-weight: normal;
      }
    }
  }
</style>
