<template>
  <section class="container" :class="{'hide': loaded}">
    <div class="user-signup">
      <div class="b-header">{{ $t('Signup') }}</div>
      <form @submit.prevent='submitForm' id="login-form" class="b-box">
        <div class="b-inputs">
          <active-input name="name" :error="firstErrors.name"
                        :options="{autofocus: true, placeholder: $t('signup.company_name'), type: 'text'}"
                        v-model="name"></active-input>
          <active-input :error="firstErrors.company_uid" class="m-domain" name="company_uid" v-model="domain"
                        :options="{placeholder: $t('Сompany URL'), type: 'text'}">
            <div class="b-label m-left" slot="before">
              {{ projectDomain }}
            </div>
          </active-input>
          <active-input name="email" :error="firstErrors.email"
                        :options="{placeholder: $t('Email'), type: 'text'}"
                        v-model="email"></active-input>
          <active-input name="password" :error="firstErrors.password"
                        :options="{placeholder: $t('Password'), type: 'password'}" v-model="password"></active-input>
        </div>
        <div class="b-button">
          <btn :disabled="isSubmitDisabled" :loading="loading" :text="$t('signup.btn')" @click="submitForm"></btn>
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
  @import '~assets/css/signup.less';

</style>

<script>
  import Btn from '../components/Btn.vue'
  import ActiveInput from '../components/ActiveInput.vue'

  export default {
    head () {
      if (process.env.NODE_ENV === 'production') {
        return {
          script: [
            { src: '//script.crazyegg.com/pages/scripts/0086/2325.js', async: 'true' }
          ]
        }
      } else {
        return {}
      }
    },
    middleware: 'guest',
    layout: 'guest',
    components: {
      ActiveInput,
      Btn
    },
    data: () => ({
      email: '',
      password: '',
      name: '',
      domain: '',
      firstErrors: {},
      loading: false,
      loaded: false
    }),
    computed: {
      projectDomain () {
        return `${process.env.SITE_PROTOCOL}://${process.env.SITE_HOST}/`
      },
      isSubmitDisabled () {
        return !this.email.trim() || !this.password.trim() || !this.name.trim() || !this.domain.trim()
      }
    },
    mounted () {
      if (this.$route.query.email) {
        this.email = this.$route.query.email
        let query = {...this.$route.query}
        delete query.email
        this.$router.replace({query})
      }
      window.scroll(0, 0)
    },
    methods: {
      submitForm () {
        if (this.loading) {
          return
        }
        // validate
        if (!this.validate()) {
          return
        }
        // submit
        this.loading = true
        this.$store.dispatch('webuser/authFromSignup', {
          email: this.email,
          password: this.password,
          name: this.name,
          domain: this.domain
        }).then(res => {
          const url = this.$store.getters['company/createUrl']('/upgrade')
          window.location.replace(url)
        }).catch(err => {
          if (err.response && err.response.data && err.response.data.first_errors) {
            this.firstErrors = {...err.response.data.first_errors}
          }
          this.loading = false
        })
      },
      validate () {
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
        if (!this.domain.trim()) {
          this.firstErrors.company_uid = this.$t('signup.empty_domain')
        }
        return Object.keys(this.firstErrors).length === 0
      }
    }
  }
</script>
