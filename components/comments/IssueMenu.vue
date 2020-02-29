<template>
  <div class="b-issue-menu">
    <dropdown
      class="light-hover"
      direction="auto"
      v-if="assignUsers && assignUsers.length"
      name="assignee"
      :label="$t('Assign')"
      empty="Nobody"
      :selected="issue.id_assigned_user"
      :onChange="setAssignee"
      :options="assignUsers">
    </dropdown>

    <dropdown
      class="light-hover"
      direction="auto"
      v-if="canEdit && activeProjects.length > 1 "
      name="project"
      :label="$t('Project')"
      :options="activeProjects"
      :onChange="setProject"
      :selected="issue.id_project">
    </dropdown>

    <dropdown
      class="light-hover"
      direction="auto"
      name="status"
      :label="$t('Status')"
      :options="statusOptions"
      :onChange="setStatus"
      :selected="issue.status">
    </dropdown>

    <a v-if="this.canEdit" class="e-control-link m-delete" @click.prevent="remove">{{ $t('issue.status.delete') }}</a>

    <template v-if="!['closed', 'resolved'].includes(issue.status)">
      <context-menu trigger="click" class="b-estimate-menu"
                    v-if="$store.state.webuser.user.id === issue.id_assigned_user">
        <span slot="content" class="e-control-link">
          <i class="bu-clock"></i>
          <template v-if="issue.spent_time && issue.estimated_time">
            <div class="b-spent">
              <div class="e-spent e-time-label">
                {{ spentH + ':' + spentM }} / {{ estimateH + ':' + estimateM}}
              </div>
              <div class="b-bar">
                 <div class="e-progress" :style="{width: (spentPercent > 100 ? 100 : spentPercent) + '%'}"></div>
              </div>
            </div>
          </template>

            <span v-if="!issue.spent_time && issue.estimated_time"
                  class="e-estimate e-time-label">{{ estimateH + ':' + estimateM}}</span>
        </span>
        <div slot="items">
          <div class="b-row">
            <div class="e-label">{{ $t('Time') }}:</div>
            <div class="e-value">
              <input maxlength="3" v-model="estimateH" class="m-hour"/>
              <span class="e-colon">:</span>
              <input maxlength="3" v-model="estimateM" class="m-minute"/>
            </div>
          </div>
        </div>
      </context-menu>
      <context-menu trigger="click" ref="dueDateMenu"
                    class="b-due-date-calendar"
                    :disabled="issue.is_block_due_on && !$store.getters['webuser/checkAccess']('owner')"
                    :class="{'m-overdue': isOverdue}">
        <div class="e-control-link" slot="content">
          <i class="bu-lock e-lock" v-if="issue.is_block_due_on"></i>
          <span class="e-title">{{ $t('issuemenu.due_on') +
          (issue.dta_due_on ? ': ' + $date(issue.dta_due_on).format('D MMM') : '')
            }}</span>
        </div>
        <div slot="items">
          <date-picker @selected="d => setDueDate(d)" :disabled="d => d.isBefore($date().startOf('day'))"></date-picker>
        </div>
      </context-menu>
      <context-menu autoClose="1" trigger="click" direction="left" class="b-due-date-menu"
                    v-if="$store.getters['webuser/checkAccess']('owner') || (!issue.is_block_due_on && issue.dta_due_on)">
        <div slot="content">
          <i class="bu-down-dir"></i>
        </div>
        <div slot="items">
          <div v-if="issue.dta_due_on" @click="setDueDate(null)" class="b-item">
            {{ $t('issue_menu.reset_deadline') }}
          </div>
          <div v-if="$store.getters['webuser/checkAccess']('owner')" @click="lockDueDate" class="b-item">
            {{ $t('issue_menu.' + (issue.is_block_due_on ? 'unlock_due_date' : 'lock_due_date')) }}
          </div>
        </div>
      </context-menu>
      <watchers-menu :issue="issue"></watchers-menu>
    </template>
  </div>
</template>

<script>
  import Dropdown from '../Dropdown.vue'
  import TagLabel from '../TagLabel.vue'
  import ContextMenu from '../ContextMenu.vue'
  import DatePicker from '../DatePicker.vue'
  import { getErrorFromResponse } from '~/utils/helpers'
  import { getStatusOptions } from '~/utils/issues'
  import { mapGetters } from 'vuex'
  import WatchersMenu from './WatchersMenu.vue'

  export default {
    name: 'issue-menu',
    props: {
      issue: {
        default: () => ({
          id_project: 0,
          id_category: 0,
          id_assigned_user: 0,
          is_bug: 0,
          name: '',
          dta_close: '',
          status: 'open'
        })
      }
    },
    components: {
      WatchersMenu,
      DatePicker,
      ContextMenu,
      TagLabel,
      Dropdown
    },
    data () {
      return {
        // если да, то сайдбар с тегами открыт и активный тег станет тегом задачи
        selectingTag: false,
        closeStatuses: [
          {id: 'closed', name: this.$t('Close')},
          {id: 'resolved', name: this.$t('Resolve')}
        ]
      }
    },
    computed: {
      ...mapGetters({
        'createProjectUrl': 'company/createProjectUrl'
      }),
      activeProjects () {
        return this.$store.state.projects.filter(el => el.is_active)
      },
      canEdit () {
        return this.$store.state.webuser.authItems.owner || +this.issue.id_user === +this.$store.state.webuser.user.id
      },
      assignUsers () {
        return this.$store.state.assignUsers.filter(el => (el.id_projects.indexOf(+this.issue.id_project) !== -1) && el.is_active)
      },
      estimateH: {
        get () {
          return Math.floor(this.issue.estimated_time / 3600) || 0
        },
        set (val) {
          this.updateTime(val, null)
        }
      },
      estimateM: {
        get () {
          let minutes = Math.floor((this.issue.estimated_time - this.estimateH * 3600) / 60) || '00'
          if (minutes.toString().length === 1) {
            minutes = '0' + minutes
          }
          return minutes
        },
        set (val) {
          this.updateTime(null, val)
        }
      },
      spentH () {
        return Math.floor(this.issue.spent_time / 3600)
      },
      spentM () {
        let minutes = Math.floor((this.issue.spent_time - this.spentH * 3600) / 60)
        if (minutes.toString().length === 1) {
          minutes = '0' + minutes
        }
        return minutes
      },
      spentPercent () {
        return Math.ceil(this.issue.spent_time / this.issue.estimated_time * 100)
      },
      isOverdue () {
        return this.issue.status === 'open' && this.$date(this.issue.dta_due_on).isBefore(this.$date().startOf('day'))
      },
      statusOptions () {
        return getStatusOptions(this)
      }
    },
    methods: {
      updateTime (h, m) {
        this.issue.estimated_time = (h || this.estimateH) * 3600 + (m || this.estimateM) * 60
        this.$api.put('issues/' + this.issue.id, {estimated_time: this.issue.estimated_time})
      },
      setReplyFormFocus () {
        let input = document.querySelector('.b-reply-form textarea')
        if (input) {
          input.focus()
        }
      },
      updateIssue () {
        const fields = ['id_category', 'is_bug', 'name', 'id_project']
        let data = {}
        for (let k in fields) {
          data[fields[k]] = this.issue[fields[k]]
        }
        return this.$api.put('issues/' + this.issue.id, data)
      },
      setAssignee (val, name) {
        this.issue.id_assigned_user = val
        this.issue.assignee_name = name
        this.$api.put('issues/assign?id=' + this.issue.id, {id_assigned_user: val})
        this.setReplyFormFocus()
      },
      setProject (val) {
        this.issue.id_project = val
        this.issue.id_category = null
        let project = this.$store.getters['company/getProject'](val)
        if (project) {
          this.$api.put('issues/project?id=' + this.issue.id, {id_project: val}).then(() => {
            let route = {...this.$route}
            route.params.project = project.uid
            this.$router.replace(route)
          })
        }
      },
      setStatus (val) {
        this.issue.status = val
        this.$api.put('issues/status?id=' + this.issue.id, {status: val}).then(res => {
          this.issue.dta_close = res.data.issue.dta_close
          this.$store.dispatch('getProjects')
        })
      },
      remove () {
        if (confirm(this.$t('issue.delete_confirm'))) {
          this.$emit('remove')
          this.$api.delete('issues/' + this.issue.id).then(() => {
            this.$router.push(this.createProjectUrl(this.$route.params.project))
          })
        }
      },
      toggleTagSelection () {
        this.selectingTag = !this.selectingTag
        this.$store.commit('SET_SIDEBAR_FORCE_SHOW', this.selectingTag)
      },
      clickOutsideMenu (e) {
        const sidebar = document.querySelector('.b-sidebar')
        if (sidebar && !sidebar.contains(e.target)) {
          this.closeTagSelection()
        }
      },
      closeTagSelection () {
        if (this.$store.state.sidebarForceShow) {
          this.selectingTag = false
          this.$store.commit('SET_SIDEBAR_FORCE_SHOW', this.selectingTag)
        }
      },
      setDueDate (d) {
        this.$refs.dueDateMenu.toggle(false)
        this.$api.put('issues/due-on?id=' + this.issue.id, {
          dta_due_on: d ? d.clone().startOf('day').utcOffset(0).format('YYYY-MM-DD HH:mm:ss') : null
        }).then(() => {
          this.issue.dta_due_on = d ? d.format('YYYY-MM-DD') : null
        }).catch(err => alert(getErrorFromResponse(err)))
      },
      lockDueDate () {
        this.issue.is_block_due_on = !this.issue.is_block_due_on
        this.$api.put('issues/change-block-due-on?id=' + this.issue.id, {is_block_due_on: this.issue.is_block_due_on})
      }
    },
    created () {
      let component = this
      this.$store.subscribe((mutation, state) => {
        if (!component.selectingTag) {
          return false
        }
        // if (mutation.type === 'SET_ACTIVE_TAG') {
        // REMOVE_ISSUES_FILTER
        if (mutation.type === 'Issues/ADD_FILTER' && Object.keys(mutation.payload)[0] === 'id_category') {
          this.issue.id_category = Object.values(mutation.payload)[0]
          this.updateIssue()
        } else if (mutation.type === 'Issues/REMOVE_TAG') {
          if (this.issue.id_category === mutation.payload) {
            this.issue.id_category = null
            this.updateIssue()
          }
        }
      })
    },
    mounted () {
      window.issueMenu = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .b-issue-menu {
    margin: 0 0 30px 0;
    display: flex;
    align-items: center;
    line-height: @btn-height;
    a {
      /*display: block;*/
      max-width: 150px;
      overflow-x: hidden;
      text-overflow: ellipsis;
      font-size: .8em;
    }
    //.dropdown-mixin;
    .b-dropdown {
      height: @btn-height;
      a.dropdown-toggle {
        max-width: 150px;
      }
      .dropdown-menu {
        max-height: 250px;
        overflow-y: auto;
      }
      a {
        font-size: .8em;
      }
    }
    .b-dropdown, .b-context-menu {
      margin-right: 10px;
    }

    .e-control-link {
      &:not(:last-child) {
        margin-right: 10px;
      }
      padding: 0 8px;
      display: inline-flex;
      .link-button();
      .hover-mixin();
      .b-tag-label {
        margin-right: 0;
        max-width: 100%;
      }
      /*display: block;*/
      /*&:hover {*/
        /*text-decoration: underline;*/
      /*}*/
      &.m-resolve, &.m-reopen {
        margin-right: 0;
      }
      &.m-delete {
        color: @red-color;
      }
    }
    .b-context-menu {
      height: @btn-height;
      .b-menu-content {
        display: flex;
      }
      .b-menu-items {
        margin-bottom: 15px;
        min-width: 110px;
        .e-control-link {
          display: block;
          margin: 0;
          padding: 0 15px;
        }
      }
    }
    .b-estimate-menu {
      i.bu-clock {
        position: relative;
      }
      .e-time-label {
        margin-left: 5px;
        position: relative;
        text-transform: none;
      }
      .b-spent {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        .e-spent {
          z-index: 1;
        }
        .b-bar {
          width: 100%;
          background: @hover-dark;
          height: 2px;
          position: absolute;
          bottom: 5px;
          border-radius: 4px;
          .e-progress {
            height: 2px;
            background: black;
            z-index: 1;
            border-radius: 4px;
          }
        }
      }
      .b-menu-items {
        padding: 10px;
        .b-row {
          display: flex;
          align-items: center;
          .e-label {
            min-width: 50px;
          }
          .e-value {
            display: flex;
            align-items: center;
            input {
              outline: none;
            }
            input[type=range] {
              cursor: pointer;
            }
            .m-hour, .m-minute {
              width: 2em;
            }
            .e-colon {
              margin: 0 5px;
            }
          }
        }
      }
    }
    .b-context-menu.b-due-date-calendar {
      margin-right: 0;
    }
    .b-due-date-calendar {
      &.disabled {
        .b-menu-content {
          .e-control-link {
            background: transparent !important;
            cursor: default !important;
          }
        }
      }
      &.disabled:not(.m-overdue) {
        opacity: .5;
      }
      .b-menu-content {
        .e-lock {
          margin-right: 3px;
          font-size: 1.1em;
        }
      }
      &.m-overdue {
        .b-menu-content {
          .e-control-link {
            color: #fff;
            background: @red-color;
          }
        }
      }
    }
    .b-due-date-menu {
      .b-menu-content {
        @size: 20px;
        width: @size;
        height: @size;
        margin-top: (@btn-height - @size)/2 - 1px;
        .hover-mixin();
        justify-content: center;
        align-items: center;
      }
      .b-menu-items {
        .b-item {
          padding: 0 15px;
          .hover-mixin();
        }
      }
    }
  }
</style>
