<template>
  <div class="app-users-index">
    <div class="app-top-container top-row">
      <div class="b-center">
        <div class="b-left">
          {{ $t('Users') }}
        </div>
        <div class="b-right">
          <btn class="e-create-user" :text="$t('New user')" @click="$router.push('/users/edit')"></btn>
        </div>
      </div>
    </div>
    <div class="b-search-section">
      <secret-word class="b-secret-word"></secret-word>
      <div class="e-can-search">{{ $t('users.can_search') }}</div>
      <div class="b-search">
        <div class="b-input">
          <input v-model="searchKeyword" :placeholder="$t('users.search_placeholder')" class="e-search-input"
                 @keyup.esc.stop="cancelSearch" @keypress.enter="search"/>
          <div class="e-close" @click="cancelSearch" v-show="searchKeyword.trim().length">
            <i class="bu-cross"></i>
          </div>
        </div>
        <div class="b-button">
          <btn @click="search" :loading="searching" :text="$t('users.search')"></btn>
        </div>
      </div>
    </div>
    <div class="b-users" v-cloak>
      <context-menu trigger="click" class="b-settings" autoClose="true" v-if="!showSearchResults">
        <span slot="content">
          <i class="bu-gear"></i>
        </span>
        <div slot="items" class="b-items">
          <div class="b-item">
            <a class="e-toggle-link link-button" @click="toggleInactive">
              {{ $t(userSettings.hide_inactive_users ? 'Show inactive' : 'Hide inactive') }}
            </a>
          </div>
        </div>
      </context-menu>

      <template v-if="!showSearchResults">
        <template v-if="users.length">
          <user-box v-for="user in activeUsers" :user="user" :key="user.id"></user-box>
          <user-box v-if="!userSettings.hide_inactive_users"
                    v-for="user in inActiveUsers" :user="user" :key="user.id"></user-box>
        </template>
        <div class="b-empty" v-else>{{ $t('No users found') }}</div>
      </template>
      <template v-else>
        <template v-if="foundUsers.length">
          <div class="b-found-users">
            <div class="b-user" v-for="user in foundUsers">
              <div class="b-left">
                <avatar :src="user.avatar_url" :name="user.name" size="45"></avatar>
              </div>
              <div class="b-middle">
                <div class="b-top">
                  <div class="e-name" v-html="highlight(capitalize(user.name)) "></div>
                  <div class="e-nic" v-html="highlight(user.username)"></div>
                </div>
                <div class="b-bottom">
                  <div class="e-about" v-if="user.aboutme">{{ user.aboutme }}</div>
                </div>
              </div>
              <div class="b-right">
                <btn :text="$t('users.search.invite')" @click="invite(user)"></btn>
              </div>
            </div>
          </div>
          <pagination :headers="foundUsersHeaders" template="2_buttons"></pagination>
        </template>
        <div class="b-empty" v-else>{{ $t('users.search.not_found') }}</div>
      </template>
    </div>

  </div>
</template>

<script>
  import UserBox from '~/components/users/UserBox.vue'
  import Btn from '~/components/Btn.vue'
  import ContextMenu from '~/components/ContextMenu.vue'
  import SecretWord from '~/components/users/SecretWord.vue'
  import { mapState } from 'vuex'
  import { raiseError, capitalize, clearString } from '~/utils/helpers'
  import Avatar from '../../components/Avatar.vue'
  import Pagination from '../../components/Pagination.vue'

  export default {
    components: {
      Pagination,
      Avatar,
      Btn,
      UserBox,
      ContextMenu,
      SecretWord
    },
    middleware: ['member', 'owner'],
    data () {
      return {
        users: [],
        foundUsers: [],
        foundUsersHeaders: {},
        searchPage: 1,
        searchKeyword: '',
        showSearchResults: false,
        searching: false,
        resultsKeyword: ''
      }
    },
    head: {
      title: 'Users'
    },
    computed: {
      ...mapState(['userSettings']),
      activeUsers () {
        return this.users.filter(val => val.status !== 'deleted')
      },
      inActiveUsers () {
        return this.users.filter(val => val.status === 'deleted')
      }
    },
    methods: {
      toggleInactive () {
        const params = {hide_inactive_users: +!this.userSettings.hide_inactive_users}
        this.$store.dispatch('updateUserSettings', params).catch(() => {
          alert(this.$t('Operation cannot be done now'))
        })
      },
      search () {
        if (!this.searchKeyword.trim().length) {
          return
        }
        this.searching = true
        this.$api.get('users/by-keyword', {
          keyword: this.searchKeyword,
          'per-page': 20,
          page: this.$route.query.page || 1
        }).then(res => {
          this.foundUsers = res.data.users
          this.foundUsersHeaders = res.headers
          this.showSearchResults = true
          this.resultsKeyword = this.searchKeyword
          this.searching = false
        })
      },
      cancelSearch () {
        this.searchKeyword = ''
        this.showSearchResults = false
        let query = {...this.$route.query}
        delete query.page
        this.$router.push(query)
      },
      highlight (term) {
        const pos = term.toLowerCase().indexOf(this.resultsKeyword)
        if (pos !== -1) {
          return clearString(term.substring(0, pos) + '<span class="e-highlight">' + term.substring(pos, pos + this.resultsKeyword.length) + '</span>' + term.substring(pos + this.resultsKeyword.length))
        } else return term
      },
      invite (user) {
        let route = {
          path: '/users/edit',
          query: {
            name: capitalize(user.name),
            email: user.email,
            keyword: this.resultsKeyword
          }
        }
        if (this.$route.query.page) {
          route.query.page = this.$route.query.page
        }
        this.$router.push(route)
      },
      capitalize
    },
    mounted () {
      window.usersIndex = this
      let query = {...this.$route.query}
      delete query.keyword
      this.$router.push({query})
    },
    watch: {
      searchKeyword: function (val) {
        if (val === '' && this.showSearchResults) {
          this.showSearchResults = false
        }
      },
      '$route.query.page': function () {
        this.search()
      }
    },
    async asyncData ({app, error, query}) {
      let promises = [app.$api.get('users-manage', {sort: 'is_active-,dta_create'})]
      if (query.keyword) {
        promises.push(app.$api.get('users/by-keyword', {keyword: query.keyword, 'per-page': 20, page: query.page || 1}))
      }
      let res = await Promise.all(promises).catch(e => raiseError(error, e))
      return {
        users: res[0].data.users,
        foundUsers: res[1] ? res[1].data.users : [],
        foundUsersHeaders: res[1] ? res[1].headers : {},
        showSearchResults: !!res[1],
        searchKeyword: query.keyword || '',
        resultsKeyword: query.keyword || ''
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .app-users-index {
    .top-row {
      .top-row();
      height: @app-top-container-height;
      margin-bottom: 15px;
      .b-center {
        height: 100%;
        display: flex;
        align-items: center;
        width: @center-width;
        margin: auto;
        .b-left {
          flex: 1;
          font-size: 1.1em;
          font-weight: bold;
        }
      }
    }
    .b-search-section {
      .white-box();
      width: @center-width;
      margin: auto;
      margin-bottom: 20px;
      .e-can-search {
        padding: 0 20px;
      }
      .b-search {
        padding: 20px;
        display: flex;
        width: @center-width;
        > .b-input {
          flex: 1;
          margin-right: 10px;
          position: relative;
          input {
            .search-input();
            padding-right: 32px;
          }
          .e-close {
            .search-input-close();
            height: 32px;
            width: 32px;
          }
        }
      }
    }
    .b-users {
      margin: 0 auto 50px auto;
      width: @center-width;
      position: relative;
      .b-settings {
        position: absolute;
        right: -40px;
        top: 0;
        z-index: 2;
        .b-trigger {
          padding: 8px;
          .hover-mixin(true);
        }
      }

      .b-empty {
        margin: 15px 0;
        text-align: center;
        background: #fff;
        box-shadow: @box-shadow;
        padding: 15px;
      }

      .b-buttons {
        text-align: right;
        margin-bottom: 20px;
      }
    }
    .b-found-users {
      .b-user {
        .white-box();
        display: flex;
        padding: 10px 20px;
        margin-bottom: 6px;
        height: 90px;
        > .b-left {
          margin-right: 20px;
          display: flex;
          align-items: center;
        }
        > .b-middle {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin-right: 10px;
          overflow: hidden;
          .e-name, .e-about, .e-nic {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .e-highlight {
            background: #ffffaf;
          }
          > .b-top {
            flex: 1;
            .e-name {
              margin-bottom: 2px;
            }
          }
          .b-bottom {
          }
        }
        > .b-right {
          display: flex;
          align-items: center;
        }
      }
    }
  }
</style>

