<template>
  <div class="c-watchers-menu">
    <context-menu trigger="click">
      <span slot="content" class="e-watchers">{{ watchersLabel }}</span>
      <div class="b-watchers" slot="items">
        <checkbox :value="user.id" v-for="user in allUsers" :key="user.id"
                  :label="user.id == $store.state.webuser.user.id ? $t('You') : capitalize(user.name)"
                  v-model="checked"
                  class="b-user"></checkbox>
      </div>
    </context-menu>
  </div>
</template>

<script>
  import { capitalize } from '~/utils/helpers'
  import ContextMenu from '../ContextMenu.vue'
  import Checkbox from '../Checkbox.vue'

  export default {
    components: {
      Checkbox,
      ContextMenu
    },
    name: 'watchers-menu',
    props: ['issue'],
    data () {
      return {
        checked: [],
        excluded: []
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
      capitalize
    },
    computed: {
      watchersLabel () {
        if (this.saved.length) {
          if (this.saved.indexOf(+this.$store.state.webuser.user.id) !== -1) {
            const remainingLength = this.saved.length - 1
            if (remainingLength === 0) {
              return this.$t('You\'re watching')
            } else {
              return `${this.$t('You')} + ${remainingLength} ${this.$tc('comment.watcher', remainingLength)}`
            }
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
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-watchers-menu {
    display: flex;
    justify-content: center;
    .e-watchers {
      min-width: 135px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 15px;
      .hover-mixin();
      font-weight: bold;
      font-size: 0.8em;
      text-transform: uppercase;
    }
    .b-menu-items {
      margin-top: 1px;
      font-size: 14px;
      font-weight: normal;
      color: #000;
      min-width: 125px;
      > .b-watchers {
        .b-user {
          display: block;
          label {
            display: block;
            .hover-mixin(@hover-color);
            line-height: 1em;
            padding: 10px 15px;
          }
        }
      }
    }
  }
</style>