<template>
  <div class="c-index-company b-app-company">
    <div class="b-form m-signup" v-if="form === 'signup'">
      <div class="b-header">{{ $t('company_index.join') }} {{info.name}}</div>
      <form @submit.prevent="submitSignup" class="b-box" autocomplete="off">
        <div class="b-logo">Q</div>
        <div class="b-description">
          {{ $t('company_index.this_is_quwi_workspace') }} <strong>{{info.name}}</strong>.
          {{ $t('company_index.if_you_wish_to_join') }} <strong>{{info.name}}</strong>, {{ $t('company_index.please_complete_the_form') }}.
        </div>
        <active-input name="secret_word" :error="firstErrors.secret_word"
                      :options="{placeholder: $t('Secret word'), type: 'password', autofocus: true}"
                      v-model="secret_word"
                      @input="firstErrors.secret_word=''"></active-input>
        <active-input name="name" :error="firstErrors.name"
                      :options="{placeholder: $t('Name'), type: 'text'}"
                      v-model="name"
                      @input="firstErrors.name=''"></active-input>
        <active-input name="email" :error="firstErrors.email"
                      :options="{placeholder: $t('Email'), type: 'text'}"
                      v-model="email"
                      @input="firstErrors.email=''"></active-input>
        <active-input name="password" :error="firstErrors.password" v-model="password"
                      :options="{type: 'password', placeholder: $t('Password')}"
                      @input="firstErrors.password=''"></active-input>
        <active-input name="passwordConfirm" :error="firstErrors.passwordConfirm"
                      :options="{placeholder: $t('Retype password'), type: 'password'}"
                      v-model="passwordConfirm"
                      @input="firstErrors.passwordConfirm=''"></active-input>
        <div class="b-button">
          <btn @click="submitSignup" :text="$t('company_index.create_new_account')" :loading="this.loading"></btn>
        </div>
        <div class="b-link">
          <a @click.prevent="changeForm('login')" href="#" >{{ $t('company_index.join_with_another_account') }}</a>
        </div>
        <div class="b-link" v-if="backLink">
          <a :href="dashboardUrl">{{ $t('company_index.back_to_my_dashboard') }}</a>
        </div>
      </form>
    </div>

    <div class="b-form m-login" v-if="form === 'login-guest'">
      <div class="b-header">{{ $t('company_index.join') }} {{info.name}}</div>
      <form @submit.prevent="submitLoginGuest" class="b-box"  autocomplete="off">
        <div class="b-logo">Q</div>
        <div class="b-description">
          {{ $t('company_index.this_is_quwi_workspace') }} <strong>{{info.name}}</strong>.
          {{ $t('company_index.if_you_wish_to_join') }} <strong>{{info.name}}</strong>, {{ $t('company_index.please_complete_the_form') }}.
        </div>
        <active-input name="secret_word" :error="firstErrors.secret_word"
                      :options="{placeholder: $t('Secret word'), type: 'password', autofocus: true}"
                      v-model="secret_word"
                      @input="firstErrors.secret_word=''"></active-input>
        <active-input name="email" :error="firstErrors.email"
                      :options="{placeholder: $t('Email'), type: 'text'}"
                      v-model="email"
                      @input="firstErrors.email=''"></active-input>
        <active-input name="password" :error="firstErrors.password" v-model="password"
                      :options="{type: 'password', placeholder: $t('Password')}"
                      @input="firstErrors.password=''; firstErrors.email=''"></active-input>
        <div class="b-button">
          <btn @click="submitLoginGuest" :text="$t('company_index.join_with_quwi_account')" :loading="this.loading"></btn>
        </div>
        <div class="b-link">
          <a @click.prevent="changeForm('signup')" href="#">{{ $t('company_index.create_new_account') }}</a>
        </div>
        <div class="b-link" v-if="backLink">
          <a :href="dashboardUrl">{{ $t('company_index.back_to_my_dashboard') }}</a>
        </div>
      </form>
    </div>


    <div class="b-form m-join" v-if="form === 'login-member' && !$store.getters['webuser/isGuest']">
      <div class="b-header">{{ $t('company_index.join') }} {{info.name}}</div>
      <form @submit.prevent="submitLoginMember" class="b-box"  autocomplete="off">
        <div class="b-logo">Q</div>
        <div class="b-description">
          {{ $t('company_index.hi') }}, {{$store.state.webuser.user.name}}!
          {{ $t('company_index.this_is_quwi_workspace') }} <strong>{{info.name}}</strong>.
          {{ $t('company_index.you_are_already_logged_in') }} {{$store.state.webuser.user.email}}.
        </div>
        <div class="b-description">
          {{ $t('company_index.do_you_wish_to_add_company') }}
        </div>
        <active-input name="secret_word" :error="firstErrors.secret_word"
                      :options="{placeholder: $t('Secret word'), type: 'password', autofocus: true}"
                      v-model="secret_word"
                      @input="firstErrors.secret_word=''"></active-input>
        <div class="b-button">
          <btn @click="submitLoginMember" :text="$t('company_index.yes_add_to_current_account')" :loading="this.loading"></btn>
        </div>
        <div class="b-link">
          <a @click.prevent="changeForm('signup')" href="#">{{ $t('company_index.create_new_account') }}</a>
        </div>
        <div class="b-link" v-if="backLink">
          <a :href="dashboardUrl">{{ $t('company_index.back_to_my_dashboard') }}</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
  import Btn from '~/components/Btn'
  import ActiveInput from '~/components/ActiveInput.vue'

  export default {
    name: 'index-company',
    props: [
      'info'
    ],
    components: {
      ActiveInput,
      Btn
    },
    data: () => ({
      form: null,
      backLink: null,
      secret_word: '',
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      firstErrors: {
        secret_word: '',
        name: '',
        email: '',
        password: '',
        passwordConfirm: ''
      },
      loading: false
    }),
    created () {
      this.form = this.$store.getters['webuser/isGuest'] || this.info.is_signup_only
        ? 'signup' : 'login-member'
      this.backLink = !this.$store.getters['webuser/isGuest']
    },
    computed: {
      dashboardUrl () {
        const uid = this.$store.getters['webuser/company'].uid
        return this.$store.getters['company/createCompanyUrl']({ route: '/dashboard', uid })
      }
    },
    methods: {
      changeForm (form) {
        Object.keys(this.firstErrors).forEach(key => { this.firstErrors[key] = '' })
        switch (form) {
          case 'signup':
            this.form = form
            break
          case 'login':
            this.form = this.$store.getters['webuser/isGuest'] || this.info.is_signup_only
              ? 'login-guest' : 'login-member'
            break
        }
        window.scrollTo(0, 0)
      },
      validateFields (keys) {
        keys.forEach(key => {
          switch (key) {
            case 'secret_word':
              if (!this[key].trim()) {
                this.firstErrors[key] = this.$t('company_index.secret_word_cannot_be_blank')
              }
              break
            case 'passwordConfirm':
              if (this.password !== this.passwordConfirm) {
                this.firstErrors.passwordConfirm = this.$t('company_index.passwords_do_not_match')
              }
              break
            default:
              if (!this[key].trim()) {
                switch (key) {
                  case 'name':
                    this.firstErrors[key] = this.$t('company_index.name_cannot_be_blank')
                    break
                  case 'email':
                    this.firstErrors[key] = this.$t('company_index.email_cannot_be_blank')
                    break
                  case 'password':
                    this.firstErrors[key] = this.$t('company_index.password_cannot_be_blank')
                    break
                }
              }
          }
        })
        return !Object.values(this.firstErrors).some(v => v)
      },
      submitSignup () {
        if (this.loading || !this.validateFields(['secret_word', 'name', 'email', 'password', 'passwordConfirm'])) {
          return
        }
        this.loading = true
        const data = {
          secretWord: this.secret_word,
          name: this.name,
          email: this.email,
          password: this.password
        }
        this.$store.dispatch('webuser/authCoderFromSignup', data)
          .then(() => {
            window.location.replace('/profile')
          })
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
            this.loading = false
          })
      },
      submitLoginMember () {
        if (this.loading || !this.validateFields(['secret_word'])) {
          return
        }
        this.loading = true
        const data = {
          secretWord: this.secret_word
        }
        this.$store.dispatch('webuser/authCoderFromLogged', data)
          .then(() => {
            window.location.replace('/profile')
          })
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
            if (err.response.status === 410) {
              this.lightbox = true
            }
            this.loading = false
          })
      },
      submitLoginGuest () {
        if (this.loading || !this.validateFields(['secret_word', 'email', 'password'])) {
          return
        }
        this.loading = true
        const data = {
          secretWord: this.secret_word,
          email: this.email,
          password: this.password
        }
        this.$store.dispatch('webuser/authCoderFromLogin', data)
          .then(() => {
            window.location.replace('/profile')
          })
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
            this.loading = false
          })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-index-company {
    .b-form {
      .white-form();
      width: 420px;
      margin: 50px auto;

      .b-description {
        margin: 25px 0;
        line-height: 1.4em;
      }
      .b-link {
        margin-top: 25px;
      }
    }
  }
</style>
