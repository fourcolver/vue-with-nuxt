<template>
  <div class="app-invite-index" v-cloak>
    <div class="b-error-wrap" v-if="error">
      <div class="b-error e-error">
        <div class="e-message">{{ $t(error) }}</div>
        <btn :text="$t('Continue')" @click="$router.push(isGuest ? '/login' : '/')"></btn>
      </div>
    </div>

    <div class="white-form" v-else>
      <div class="b-box">
        <div class="b-logo">Q</div>
        <div class="b-text">
          <p>{{ $t('Hi') }} {{recipient.name}},</p>
          <div class="b-message">
            <avatar size="60" :src="company.owner_avatar" :name="company.owner_name"></avatar>
            <span>
              {{company.owner_name}} (<a :href="'mailto:' + company.owner_email">{{company.owner_email}}</a>)
              {{ $t('invited you to join the team on Quwi project management and time tracking system') }}.
            </span>
          </div>
          <nuxt-link to="/help">{{$t('What is Quwi and how it can help me?')}}</nuxt-link>
        </div>

        <div v-if="isAnotherAccount">
          <div class="user-signup" v-if="isSignup">
            <form @submit.prevent='signup' id="signup-form">
              <div class="b-inputs">
                <active-input name="name" :error="firstErrors.name" :options="{placeholder: $t('Name'), type: 'text'}"
                              v-model="name"></active-input>
                <active-input ref="emailInput" name="email" :error="firstErrors.email"
                              :options="{placeholder: $t('Email'), type: 'text'}"
                              v-model="email"></active-input>
                <active-input name="password" :error="firstErrors.password"
                              :options="{placeholder: $t('Password'), type: 'password'}"
                              v-model="password"></active-input>
                <active-input name="passwordConfirm" :error="firstErrors.passwordConfirm"
                              :options="{placeholder: $t('Retype password'), type: 'password'}"
                              v-model="passwordConfirm"></active-input>
              </div>
              <div class="b-button">
                <btn :loading="loading" :text="$t('Create new account')" @click="signup"></btn>
                <a href="#" class="b-change-form"
                   @click.prevent="isSignup = false; firstErrors = {}">{{ $t('I already have an account') }}</a>
              </div>
            </form>
          </div>

          <div class="user-signup" v-else>
            <form @submit.prevent='signup' id="login-form">
              <div class="b-inputs">
                <active-input name="email" :error="firstErrors.email"
                              :options="{placeholder: $t('Email'), type: 'text'}"
                              v-model="email"></active-input>
                <active-input name="password" :error="firstErrors.password"
                              :options="{placeholder: $t('Password'), type: 'password'}"
                              v-model="password"></active-input>
              </div>
              <div class="b-button">
                <btn :loading="loading" :text="$t('I already have an account')" @click="login"></btn>
                <a href="#" @click.prevent="isSignup = true; firstErrors = {}">{{ $t('Create new account') }}</a>
              </div>
            </form>
          </div>
        </div>

        <div v-else>
          <div v-if="checkAccess('owner')">
            <div class="b-text">
              <p v-html="$t('invite.team_owner_warning')"></p>
            </div>
            <div class="b-button">
              <btn :text="$t('Create new account as a Worker')" @click="isAnotherAccount = true; isSignup = true"></btn>
              <nuxt-link to="/">{{ $t('invite.owner_return') }}</nuxt-link>
            </div>
          </div>

          <div v-else>
            <div class="b-text">
              <p>{{ $t('You are already logged in as') }} {{ $store.state.webuser.user.name }}
                ({{ $store.state.webuser.user.email }}).</p>
              <p>{{ $t('Accept this invitation and add the project to your current account?') }}</p>
            </div>
            <div class="b-buttons">
              <div class="b-left">
                <btn :text="$t('No, create new')" class="btn btn-light-grey" @click="isAnotherAccount=true"></btn>
              </div>
              <div class="b-middle">
                <fadeout-message :message="errorAccept" @hide="errorAccept = null"></fadeout-message>
              </div>
              <div class="b-right">
                <btn :text="$t('Yes')" class="" @click="accept"></btn>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import Btn from '../components/Btn.vue'
  import ActiveInput from '../components/ActiveInput.vue'
  // import { login } from '~/utils/user'
  import { getErrorFromResponse } from '~/utils/helpers'
  import { mapGetters } from 'vuex'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import Avatar from '../components/Avatar.vue'

  export default {
    layout: 'guest',
    components: {
      Avatar,
      ActiveInput,
      Btn,
      FadeoutMessage
    },
    data: () => ({
      password: '',
      passwordConfirm: '',
      email: '',
      name: '',
      firstErrors: {},
      loading: false,
      company: {},
      recipient: {},
      isAnotherAccount: true,
      isSignup: true,
      confirmedToken: null,
      errorAccept: '',
      error: ''
    }),
    computed: {
      ...mapGetters({
        isGuest: 'webuser/isGuest',
        checkAccess: 'webuser/checkAccess'
      })
    },
    methods: {
      accept () {
        if (this.loading) {
          return
        }
        this.loading = true
        this.$store.dispatch('webuser/authFromInviteLogged', this.confirmedToken).then(() => {
          const url = this.$store.getters['company/createUrl']('/')
          window.location.replace(url)
        }).catch(err => {
          this.errorAccept = getErrorFromResponse(err)
          this.loading = false
        })
      },
      signup () {
        if (this.loading) {
          return
        }
        // validate
        if (!this.validateSignup()) {
          return
        }
        // submit
        this.loading = true
        this.$store.dispatch('webuser/authFromInviteNew', {
          token: this.confirmedToken,
          name: this.name,
          email: this.email,
          password: this.password
        }).then(() => {
          const url = this.$store.getters['company/createUrl']('/')
          window.location.replace(url)
        }).catch(err => {
          if (err.response && err.response.data && err.response.data.first_errors) {
            this.firstErrors = {...err.response.data.first_errors}
            if (this.firstErrors.token) {
              this.firstErrors.name = this.firstErrors.token
            }
          }
          this.loading = false
        })
      },
      validateSignup () {
        this.firstErrors = {}
        if (!this.name.trim()) {
          this.firstErrors.name = this.$t('Name can not be blank')
        }
        if (!this.email.trim()) {
          this.firstErrors.email = this.$t('Email can not be blank')
        }
        if (!this.password.trim()) {
          this.firstErrors.password = this.$t('Password can not be blank')
        }
        if (this.password !== this.passwordConfirm) {
          this.firstErrors.passwordConfirm = this.$t('Passwords do not match')
        }
        return Object.keys(this.firstErrors).length === 0
      },
      login () {
        if (this.loading) {
          return
        }
        this.loading = true
        this.$store.dispatch('webuser/authFromInviteLogin', {
          token: this.confirmedToken,
          email: this.email,
          password: this.password
        }).then(() => {
          const url = this.$store.getters['company/createUrl']('/')
          window.location.replace(url)
        }).catch(err => {
          if (err.response && err.response.data && err.response.data.first_errors) {
            this.firstErrors = {...err.response.data.first_errors}
            if (this.firstErrors.token) {
              this.firstErrors.email = this.firstErrors.token
            }
          }
          this.loading = false
        })
      }
    },
    asyncData ({query, store, app}, cb) {
      app.$api.get('invite', {token: query.token}).then(async (res) => {
        cb(null, {
          recipient: res.data.recipient,
          company: res.data.company,
          name: res.data.recipient ? res.data.recipient.name : '',
          email: res.data.recipient ? res.data.recipient.email : '',
          confirmedToken: query.token,
          isAnotherAccount: store.getters['webuser/isGuest'],
          isSignup: res.data.recipient ? !res.data.recipient.existing_user : true
        })
      }).catch((err) => {
        if (err.response.status === 417) {
          cb(null, {error: getErrorFromResponse(err)})
        }
      })
    },
    mounted () {
      window.invitePage = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/menu.less';

  .app-invite-index {
    .b-error-wrap {
      margin: 80px auto;
      text-align: center;
      .b-error {
        .white-box();
        display: inline-block;
        padding: 20px;
        text-align: center;
        .e-message {
          margin-bottom: 20px;
        }
      }
    }

    .white-form {
      margin: 25px auto;
      width: 440px;
      .b-box {
        .b-text {
          line-height: 1.45em;
          .b-message {
            display: flex;
            align-items: center;
            margin-bottom: 15px;

            span {
              text-align: left;
              margin-left: 20px;
            }
          }
          .b-avatar {
            display: inline-block;
            vertical-align: middle;
            img {
              vertical-align: bottom;
            }
          }
          p {
            margin: 0 0 15px 0;
            em {
              font-weight: bold;
              color: @red-color;
              font-style: normal;
            }
          }
        }
        .b-buttons {
          display: flex;
          align-items: center;
          .b-left {
            padding-right: 15px;
          }
          .b-middle {
            flex-grow: 1;
            padding-right: 15px;
            color: @red-color;
            text-align: right;
          }
        }
        .btn {
          margin-bottom: 20px;
        }
        .b-error {
          .e-message {
            font-size: 1.3em;
            margin: 20px 0;
          }
          .white-box();
          margin: 50px 0;
          text-align: center;
        }
        .user-signup {
          width: 310px;
          margin: 50px auto;
        }
      }
    }
  }
</style>
