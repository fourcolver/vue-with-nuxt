<template>
  <section class="container" :class="{'hide': loaded}">
    <div class="user-login">
      <div class="b-header">{{ $t('Login') }}</div>
      <form @submit.prevent="submitForm" id="login-form" class="b-box">
        <div class="b-logo">Q</div>
        <active-input name="email" :error="firstErrors.email"
                      :options="{placeholder: $t('Email'), type: 'text', autofocus: true}"
                      v-model="email"></active-input>
        <active-input name="password" :error="firstErrors.password" v-model="password"
                      :options="{type: 'password', placeholder: $t('Password')}"></active-input>
        <div class="b-button">
          <btn @click="submitForm" :text="$t('login.btn')" :loading="this.loading"></btn>
          <nuxt-link to="/forgot">{{ $t('Forgot password?') }}</nuxt-link>
        </div>
      </form>
    </div>
  </section>
</template>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/animation.less';
  @import '~assets/css/menu.less';
  @import '~assets/css/libs/load_awesome/load_awesome.less';

  .container.hide {
    display: none;
  }

  .user-login {
    width: 440px;
    .white-form();
    margin: 50px auto;
    .b-button {
      .btn {
        margin-bottom: 20px;
      }
    }
  }
</style>

<script>
  import Btn from '~/components/Btn'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import ActiveInput from '~/components/ActiveInput.vue'
  import { raiseError } from '~/utils/helpers'
  import { invalidateOnesignalCache } from '~/utils/push'

  export default {
    middleware: 'guest',
    layout: 'guest',
    components: {
      ActiveInput,
      Btn,
      FadeoutMessage
    },
    data: () => ({
      email: '',
      password: '',
      error: '',
      loading: false,
      loaded: false,
      afterLoginRedirect: null,
      firstErrors: {
        email: '',
        password: ''
      }
    }),
    created () {
      if (!process.server) {
        this.email = localStorage.getItem('loginEmail') || ''

        // set redirect url and clear the cookie when page is loaded
        const redirect = this.$cookies.get('afterLoginRedirect')
        this.$cookies.remove('afterLoginRedirect', {domain: '.' + process.env.SITE_HOST, path: '/'})
        // redirect to itself is possible b/c of 'guest' middleware
        this.afterLoginRedirect = redirect || '/login'
      }
    },
    methods: {
      submitForm: function () {
        if (this.loading) {
          return
        }
        this.firstErrors = {}
        if (!this.email.trim()) {
          this.firstErrors.email = this.$t('Email can not be blank')
        }
        localStorage.setItem('loginEmail', this.email)
        if (!this.password.trim()) {
          this.firstErrors.password = this.$t('Password can not be blank')
        }
        if (this.firstErrors.email || this.firstErrors.password) {
          return
        }
        this.loading = true
        this.$store.dispatch('webuser/authFromLogin', {email: this.email, password: this.password})
          .then(res => {
            window.location.replace(this.afterLoginRedirect)
            invalidateOnesignalCache(true)
          })
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
            this.loading = false
          })
      }
    },
    asyncData ({app, store, error}) {
      if (store.state.currentHost) {
        return app.$api.get('auth/company-info', {uid: store.state.currentHost})
          .then(() => {})
          .catch(e => raiseError(error, e))
      }
    }
  }
</script>
