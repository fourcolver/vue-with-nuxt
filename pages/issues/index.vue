<template>
  <div class="app-issues-index">
    <template v-if="$route.params.project">
      <create-issue ref="issueForm"></create-issue>
      <drafts-list @draftClick="id => $refs.issueForm.fillFromDraft(id)"></drafts-list>
    </template>
    <div class="b-filters-row" v-if="!isFilteredByTag">
      <div class="b-left">
        <issues-filter v-if="!keywordFilter"></issues-filter>
        <search-input v-else ref="searchInput" :value="searchKeyword"
                      @submit="search" @cancel="disableSearch"
                      wordsLength="6"
                      :inputProps="{placeholder: $t('issues.search.placeholder')}"></search-input>
      </div>
      <div class="b-right">
          <i v-if="!keywordFilter" class="bu-magnifier e-toggle-search" @click="enableSearch"></i>
          <i v-else class="bu-cancel e-toggle-search" @click="disableSearch"></i>
        <issues-menu></issues-menu>
      </div>
    </div>
    <project-files v-if="$store.state.userSettings.is_show_files_section"></project-files>
    <template v-if="!isFilteredByTag">
      <unread-list v-if="hasUnreadSection"></unread-list>
      <starred-list
        v-if="!$store.getters['Issues/getFilter']('is_closed') && $store.state.Issues.starred.length"></starred-list>
      <issues-list></issues-list>
    </template>
    <template v-else>
      <filtered-issues-list></filtered-issues-list>
    </template>
  </div>
</template>
<script>
  import IssuesList from '../../components/issues/IssuesList.vue'
  import CreateIssue from '../../components/issues/CreateIssue.vue'
  import StarredList from '../../components/issues/StarredList.vue'
  import EventsList from '~/components/events/EventsList.vue'
  import DraftsList from '../../components/issues/DraftsList.vue'
  import UnreadList from '../../components/issues/UnreadList.vue'
  import IssuesFilter from '../../components/issues/IssuesFilter.vue'
  import IssuesMenu from '../../components/issues/IssuesMenu.vue'
  import SearchInput from '../../components/SearchInput.vue'
  import { raiseError } from '~/utils/helpers'
  import { isValidSearchKeyword } from '../../utils/issues'
  import ProjectFiles from '../../components/issues/ProjectFiles.vue'
  import FilteredIssuesList from '../../components/issues/FilteredIssuesList.vue'

  export default {
    components: {
      FilteredIssuesList,
      ProjectFiles,
      SearchInput,
      IssuesMenu,
      UnreadList,
      DraftsList,
      EventsList,
      StarredList,
      IssuesList,
      CreateIssue,
      IssuesFilter
    },
    middleware: 'member',
    name: 'issues-index',
    head: {
      title: 'Tickets'
    },
    data () {
      return {
        drafts: [],
        updatingPromise: null,
        project: null,
        isIssueEmpty: true
      }
    },
    fetch ({store, params, app, error}) {
      let lastProject = app.$cookies.get('lastProject')
      let project = params.project || 'all'
      if (lastProject && lastProject !== project) {
        store.commit('Issues/REMOVE_FILTER', 'keyword')
        store.dispatch('updateUserSettings', {issues_filters: store.state.Issues.filters})
      }
      app.$cookies.set('lastProject', project)
      let promises = []
      promises.push(store.dispatch('updateDrafts'))
      promises.push(store.dispatch('Issues/fetch'))
      promises.push(store.dispatch('updateFiles', {project: params.project || null}))
      return Promise.all(promises).catch((e) => raiseError(error, e))
    },
    mounted () {
      window.issuesPage = this
    },
    methods: {
      async search (text) {
        if (this.updatingPromise) {
          await this.updatingPromise
        }
        // если уже отфильтровано и юзер ввел меньше 4 символов, то фильтр сбрасывается
        const needReload = isValidSearchKeyword(text) || this.$store.getters['Issues/isSearch']
        let promises = [this.setKeyword(text)]
        if (needReload) {
          window.$nuxt.$loading.start()
          promises.push(this.$store.dispatch('Issues/fetch').then(() => window.$nuxt.$loading.finish()))
        }
        const p = Promise.all(promises).finally(() => {
          this.updatingPromise = null
        })
        this.updatingPromise = p
        return p
      },
      setKeyword (text) {
        this.$store.commit('Issues/ADD_FILTER', {keyword: text})
        return this.$store.dispatch('updateUserSettings', {issues_filters: this.$store.state.Issues.filters})
      },
      enableSearch () {
        this.setKeyword(null)
        this.$nextTick(() => this.$refs.searchInput.focus())
      },
      async disableSearch () {
        if (this.updatingPromise) {
          await this.updatingPromise
        }
        const oldKeyword = this.searchKeyword
        this.$store.commit('Issues/REMOVE_FILTER', 'keyword')
        let promises = [this.$store.dispatch('updateUserSettings', {issues_filters: this.$store.state.Issues.filters})]
        if (isValidSearchKeyword(oldKeyword)) {
          promises.push(this.$store.dispatch('Issues/fetch'))
        }
        const p = Promise.all(promises).finally(() => {
          this.updatingPromise = null
        })
        this.updatingPromise = p
        return p
      },
      clearFilter () {
        if (this.searchKeyword) {
          this.search('')
        }
      }
    },
    created () {
      this.project = this.$store.getters.activeProject
    },
    computed: {
      keywordFilter () {
        return this.$store.state.Issues.filters.find(el => typeof el.keyword !== 'undefined')
      },
      searchKeyword () {
        return (this.keywordFilter && this.keywordFilter.keyword) ? this.keywordFilter.keyword : ''
      },
      hasUnreadSection () {
        return this.$store.getters['Issues/hasUnreadSection'](this.project)
      },
      needFilterByTag () {
        if (!this.project) {
          return false
        }
        const tag = this.$store.getters['Issues/getActiveTag']
        let needFilter = !!tag && +tag.id_project === +this.project.id
        if (needFilter) {
          this.$store.dispatch('Issues/getFiltered')
        }
        return needFilter
      },
      isFilteredByTag () {
        return this.needFilterByTag && this.$store.state.Issues.filteredIssues.length > 0
      }
    }
  }
</script>
<style lang="less" type="text/less">
  @import "~assets/css/variables.less";
  @import "~assets/css/mixins.less";

  @issues-filter-buttons-width: 2 * @btn-height + 5px;
  .app-issues-index {
    margin: auto;
    &.hide {
      display: none;
    }
    .fade-enter-active, .fade-leave-active {
      transition: opacity 4s;
    }
    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
      opacity: 0;
    }
    .c-starred-list, .c-unread-list {
      margin-bottom: 25px;
    }
    .m-header {
      color: #6f6f6f;
      font-weight: bold;
      padding: 0 20px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      .e-name {
        text-transform: uppercase;
        font-size: .9em;
        color: @red-color;
        margin-right: 10px;
      }
      .e-cnt {
        font-size: .85em;
        float: right;
        color: @red-color;
      }
    }
    .b-filters-row {
      width: @issues-width;
      margin: 25px auto;
      position: relative;
      > .b-left {
        .c-issues-filter {
          margin-right: @issues-filter-buttons-width;
        }
        .c-search-input {
          margin-right: @issues-filter-buttons-width;
        }
      }
      > .b-right {
        position: absolute;
        height: @btn-height;
        display: flex;
        align-items: center;
        right: 0;
        top: 0;
        color: #595959;
        > .e-toggle-search, .c-issues-menu .b-menu-content {
          width: @btn-height;
          height: @btn-height;
          .hover-mixin();
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

      }
      &.disabled {
        opacity: .5;
        pointer-events: none;
      }
    }
  }

</style>
