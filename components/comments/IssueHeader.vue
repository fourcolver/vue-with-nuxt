<template>
  <div class="c-issue-header">
    <div class="b-left">
      <avatar-menu :userId="issue.id_user" size="25" direction="right"></avatar-menu>
      <div class="e-name">{{ capitalize($store.getters.getCompanyUser(issue.id_user).name) }}</div>
    </div>
    <div class="b-center"></div>
    <div class="b-right">
      <template v-if="issue.id_assigned_user && issue.spent_time">
        <progress-bar v-if="percentDone" :percent="percentDone"></progress-bar>
        <span class="e-time">{{ secondsToHIS(issue.spent_time, 'h:i')}}</span>
      </template>
      <div class="b-participants" v-if="issue.participants">
        <avatar-menu v-for="user in issue.participants" :userId="user.id" :key="user.id" size="25"
                     direction="left"></avatar-menu>
      </div>
    </div>
    <div class="b-watchers">
      <context-menu trigger="click">
        <span slot="content" class="e-watchers">{{ watchersLabel }}</span>
        <div class="b-watchers" slot="items">
          <checkbox :value="user.id" v-for="user in allUsers" :key="user.id"
                    :label="user.id == $store.state.webuser.user.id ? $t('You') : capitalize(user.name)" v-model="checked"
                    class="b-user"></checkbox>
        </div>
      </context-menu>
    </div>
  </div>
</template>


<script>
  import { formatDate, secondsToHIS } from '~/utils/time'
  import { calculatePercentDone } from '~/utils/issues'
  import ContextMenu from '../ContextMenu.vue'
  import Checkbox from '../Checkbox.vue'
  import TagLabel from '../TagLabel.vue'
  import IssueStar from '../IssueStar.vue'
  import PriorityDropdown from '~/components/PriorityDropdown.vue'
  import PriorityLabel from '~/components/PriorityLabel.vue'
  import ProgressBar from '../ProgressBar.vue'
  import { mapGetters } from 'vuex'
  import moment from 'moment'
  import Btn from '../Btn.vue'
  import Suggestions from '../Suggestions.vue'
  import SimpleHint from '../SimpleHint.vue'
  import Avatar from '../Avatar.vue'
  import { capitalize } from '~/utils/helpers'
  import AvatarMenu from './AvatarMenu.vue'

  export default {
    components: {
      AvatarMenu,
      Avatar,
      SimpleHint,
      Suggestions,
      Btn,
      ProgressBar,
      IssueStar,
      TagLabel,
      Checkbox,
      ContextMenu,
      PriorityDropdown,
      PriorityLabel
    },
    name: 'issue-header',
    props: ['issue'],
    methods: {
      save () {
        if (this.added.length || this.removed.length) {
          let data = {}
          if (this.removed.length) {
            data.id_watchers_exclude_add = this.removed
          }
          if (this.added.length) {
            data.id_watchers_exclude_del = this.added
          }
          this.$api.put('issues/watchers?id=' + this.issue.id, data)
          let excluded = []
          for (let k in this.allUsers) {
            const id = +this.allUsers[k].id
            if (this.checked.indexOf(id) === -1) {
              excluded.push(id)
            }
          }
          this.excluded = excluded
          let issue = {...this.issue}
          issue.watchersExclude = []
          excluded.forEach(id => issue.watchersExclude.push({id_user: id}))
          this.$store.commit('Issues/SET_ISSUE', issue)
        }
      },
      toggleBug () {
        this.issue.is_bug = +!this.issue.is_bug
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, is_bug: this.issue.is_bug})
      },
      editSubject () {
        this.editing = 'subject'
        this.newSubject = this.issue.name || ''
        this.$nextTick(() => this.$refs.newSubject.select())
      },
      editTag () {
        this.editing = 'tag'
        this.newTag = ''
        this.$nextTick(() => this.$refs.newTag.select())
      },
      tagEnter () {
        if (this.$refs.suggest.getSelected()) {
          this.$refs.suggest.enter()
        } else if (this.newTag) {
          this.saveTag()
        } else if (!this.newTag) {
          this.editing = null
        }
      },
      subjectEnter () {
        if (this.newSubject.trim()) {
          this.saveSubject()
        } else {
          this.editing = null
        }
      },
      saveSubject () {
        this.issue.name = capitalize(this.newSubject)
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, name: this.issue.name})
        this.editing = null
      },
      removeSubject () {
        this.issue.name = ''
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, name: ''})
      },
      async saveTag (tag = null) {
        const minLength = 3
        if (!tag && this.newTag) {
          if (this.newTag.length < minLength) {
            this.tagError = this.$tc('issue_header.tag_too_short', null, {n: minLength})
            return
          } else {
            let project = this.$store.getters['company/getProject'](this.$route.params.project)
            if (!project) {
              return
            }
            let createdTag = await this.$api.post('categories', {
              name: this.newTag,
              id_project: project.id
            }).then(res => res.data.category)
            if (!createdTag) {
              this.tagError = this.$t('issue_header.tag_not_created')
            }
            tag = createdTag.id
          }
        }
        this.issue.id_category = tag
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, id_category: this.issue.id_category})
        this.editing = null
      },
      removeTag () {
        this.issue.id_category = null
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, id_category: null})
      },
      secondsToHIS,
      formatDate (dta, format) {
        return formatDate(dta, format, this.$i18n.locale)
      },
      capitalize
    },
    data () {
      return {
        checked: [],
        excluded: []
      }
    },
    mounted () {
      window.issueHeader = this
    },
    computed: {
      ...mapGetters(['getDateTimeFormatFor']),
      dateFormat () {
        let nowYear = moment().get('year')
        let issueYear = moment(this.issue.dta_create).get('year')
        return nowYear === issueYear ? this.getDateTimeFormatFor('issuesdWithoutYear') : this.getDateTimeFormatFor('issues')
      },
      watchersLabel () {
        if (this.saved.length) {
          if (this.saved.indexOf(+this.$store.state.webuser.user.id) !== -1) {
            const remainingLength = this.saved.length - 1
            if (remainingLength === 0) {
              return this.$t('You\'re watching')
            } else {
              return `${this.$t('You')} + ${remainingLength} ${this.$tc('comment.watcher', remainingLength)}`
            }s
          } else {
            return this.saved.length.toString() + ' ' + this.$tc('comment.watcher', this.saved.length)
          }
        }
        return this.$t('no watchers')
      },
      allUsers () {
        let users = []
        users = this.$store.state.assignUsers.filter(el => {
          return el.id_projects.indexOf(+this.issue.id_project) > -1 && el.is_active
        })
        return users
      },
      added () {
        let users = []
        for (let i = 0; i < this.checked.length; i++) {
          if (this.saved.indexOf(this.checked[i]) === -1) {
            users.push(this.checked[i])
          }
        }
        return users
      },
      removed () {
        let users = []
        for (let i = 0; i < this.saved.length; i++) {
          if (this.checked.indexOf(this.saved[i]) === -1) {
            users.push(this.saved[i])
          }
        }
        return users
      },
      saved () {
        let users = []
        const allUsers = this.allUsers
        for (let k in allUsers) {
          const id = allUsers[k].id
          if (this.excluded.indexOf(id) === -1) {
            users.push(id)
          }
        }
        return users
      },
      percentDone () {
        return calculatePercentDone(this.issue)
      },
      canEdit () {
        return this.$store.state.webuser.authItems.owner || +this.issue.id_user === +this.$store.state.webuser.user.id
      }
    },
    created () {
      let checked = []
      for (let k in this.allUsers) {
        checked.push(+this.allUsers[k].id)
      }
      this.checked = checked
      if (this.issue.watchersExclude) {
        for (let k in this.issue.watchersExclude) {
          const id = +this.issue.watchersExclude[k].id_user
          this.excluded.push(id)
          if (this.checked.indexOf(id) !== -1) {
            this.checked.splice(this.checked.indexOf(id), 1)
          }
        }
      }
    },
    watch: {
      checked: {
        handler: function () {
          this.save()
        },
        deep: true
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-issue-header {
    font-size: .8em;
    color: #6f6f6f;
    @top-row-height: 52px;
    background: @light-background;
    height: 42px;
    width: 100%;
    padding: 0 15px;
    display: flex;
    position: relative;
    z-index: 1;
    .b-left {
      display: flex;
      max-width: 250px;
      > .c-avatar-menu {
        margin-right: 15px;
      }
      > .e-name {
        color: #000;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1rem;
      }
    }
    > .b-center {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      flex: 1;
    }
    .b-right {
      max-width: 300px;
      .c-progress-bar, .e-time {
        margin-right: 15px;
      }
      .c-progress-bar {
        .e-bar {
          background: #dcdcdc;
        }
      }
      .e-time {
        color: #000;
      }
      .b-participants {
        display: flex;
        .c-avatar-menu {
          margin-right: 5px;
        }
      }
    }
    > div {
      display: flex;
      align-items: center;
      height: 100%;
    }
  }

  .lang-ru-RU {
    .c-issue-header {
      > .b-watchers {
        .e-watchers {
          min-width: 168px;
        }
      }
    }
  }
</style>
