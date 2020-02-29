<template>
  <section class="container" v-cloak>
    <div class="user-forgot">
      <div class="b-header">{{ $t('Forgot password') }}</div>
      <form @submit.prevent="submit" id="forgot-form" class="b-box">
        <div class="b-logo">Q</div>
        <active-input name="email" :error="firstErrors.email" :options="{placeholder: $t('Email'), type: 'text'}"
                      v-model="email"></active-input>
        <div :class="{'error': isError, 'b-message': true}">
          <fadeout-message :message="message" :delay="5000" @hide="message=null"></fadeout-message>
        </div>
        <div class="b-button">
          <btn @click="submit" :text="$t('Send')" :loading="this.sending"></btn>
          <nuxt-link to="/login">{{ $t('Cancel') }}</nuxt-link>
        </div>
      </form>
    </div>
  </section>
</template>

<script>
  import Btn from '~/components/Btn'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import ActiveInput from '~/components/ActiveInput.vue'

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
      message: null,
      isError: null,
      sending: false,
      firstErrors: {
        email: ''
      }
    }),
    created () {
      if (!process.server) {
        this.email = localStorage.getItem('loginEmail') || ''
      }
    },
    methods: {
      setMessage (msg, isError) {
        this.message = msg
        this.isError = isError || false
      },
      submit () {
        if (this.sending) {
          return
        }
        if (!this.email.trim()) {
          this.firstErrors.email = this.$t('Email can not be blank')
          return
        }
        this.sending = true
        localStorage.setItem('loginEmail', this.email)
        let host = window.location.host.split(':')[0]
        host = host.replace(process.env.SITE_HOST, '')
        const companyUid = host ? host.replace('.', '') : null

        this.$api.post('forgot-password', {email: this.email, company_uid: companyUid})
          .then((res) => {
            this.setMessage(this.$t('Link to reset your password has been sent to your email'))
            setTimeout(() => {
              this.$router.push('/login')
            }, 3000)
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
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/animation.less';
  @import '~assets/css/menu.less';
  @import '~assets/css/libs/load_awesome/load_awesome.less';

  .user-forgot {
    .white-form();
    width: 440px;
    margin: 50px auto;
    .btn {
      margin-bottom: 20px;
    }
    .b-message {
      margin-bottom: 30px;
      color: @green-color;
    }
  }
</style>
