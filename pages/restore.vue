<template>
  <section class="container" v-cloak>
    <div class="user-restore">
      <div class="b-header">
        <h1>{{ $t('Restore password') }}</h1>
      </div>
      <div class="b-box">
        <div class="b-logo">Q</div>
        <template v-if="isErrorLayout">
          <div class="b-error">
            <div class="e-error">{{ message }}</div>
          </div>
        </template>
        <template v-else>
          <form @submit.prevent='submit' id="restore-form">
            <active-input :options="{placeholder: $t('New password'), autofocus: true, type: 'password'}"
                          v-model="new_password" :error="firstErrors.new_password"
                          name="new_password"></active-input>
            <active-input :options="{placeholder: $t('Password retype'), type: 'password'}"
                          v-model="password_retype" name="password_retype"
                          :error="firstErrors.password_retype"></active-input>
            <div class="b-message" v-if="message">{{ message }}</div>
            <div class="b-button">
              <btn @click="submit" :text="$t('Save')" :loading="this.sending"></btn>
            </div>
          </form>
        </template>
        <nuxt-link class="e-cancel" to="/login">{{ $t('Cancel') }}</nuxt-link>
      </div>
    </div>
  </section>
</template>

<script>
  import { getErrorFromResponse } from '~/utils/helpers'
  import Btn from '~/components/Btn'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import ActiveInput from '../components/ActiveInput.vue'

  export default {
    middleware: 'guest',
    components: {
      ActiveInput,
      Btn,
      FadeoutMessage
    },
    data: () => ({
      new_password: '',
      password_retype: '',
      token: null,
      message: null,
      isError: null,
      sending: false,
      isErrorLayout: false,
      firstErrors: {
        new_password: '',
        password_retype: ''
      }
    }),
    asyncData ({store, params, error, app}, cb) {
      if (!params.token) {
        cb(null, {isError: true, message: 'This link is not valid', isErrorLayout: true})
      }
      return app.$api.get('forgot-password/check', {token: params.token})
        .then(() => {
          if (!store.getters['webuser/isGuest']) {
            store.dispatch('webuser/logout')
          }
          cb(null, {token: params.token})
        })
        .catch(err => {
          cb(null, {isError: true, message: getErrorFromResponse(err), isErrorLayout: true})
        })
    },
    methods: {
      setMessage (msg, isError) {
        this.message = msg
        this.isError = isError || false
      },
      submit: function () {
        if (this.sending) {
          return
        }
        if (!this.new_password.trim()) {
          this.firstErrors.new_password = this.$t('Password can not be blank')
          return
        } else if (this.new_password !== this.password_retype) {
          this.firstErrors.password_retype = this.$t('Passwords do not match')
          return
        }
        this.sending = true

        this.$api.put('forgot-password/update?token=' + this.token, {new_password: this.new_password})
          .then((res) => {
            this.setMessage(this.$t('Password has been successfully changed'))
            setTimeout(() => { this.$router.push('/login') }, 3000)
          })
          .catch((err) => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
          })
          .finally(() => {
            this.sending = false
          })
      }
    },
    mounted () {
      window.restoreForm = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/animation.less';
  @import '~assets/css/menu.less';
  @import '~assets/css/libs/load_awesome/load_awesome.less';

  .user-restore {
    .white-form();
    width: 440px;
    margin: 50px auto;
    .b-error {
      .e-error {
        color: @red-color;
        font-size: 1.2em;
      }
    }
    .b-message {
      color: @green-color;
      margin-bottom: 20px;
    }
    .e-cancel {
      margin-top: 20px;
      display: block;
    }
  }
</style>
