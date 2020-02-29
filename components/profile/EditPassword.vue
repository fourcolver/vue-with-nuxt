<template>
  <div class="b-edit-password">
    <form class="app-form" @submit.prevent="submit">

      <div class="b-row">
        <div class="b-label">
          <label for="password_old">{{ $t('Old password') }}</label>
        </div>
        <div class="b-input">
          <input type="password" autofocus="autofocus" name="password_old" v-model="password_old" id="password_old">
        </div>
      </div>

      <div class="b-row">
        <div class="b-label">
          <label for="user_password">{{ $t('New password') }}</label>
        </div>
        <div class="b-input">
          <input type="password" name="password" v-model="password" id="user_password">
        </div>
      </div>

      <div class="b-row">
        <div class="b-label">
          <label for="retype_password">{{ $t('Retype password') }}</label>
        </div>
        <div class="b-input">
          <input type="password" name="password_retype" v-model="password_retype" id="retype_password">
        </div>
      </div>

      <div class="b-row">
        <div :class="{'error': isError, 'b-message': true}">
          <fadeout-message :message="message" @hide="message=null"></fadeout-message>
        </div>
        <button class="btn btn-light-grey" type="button" @click="$router.push('/profile')">{{ $t('Back') }}</button>
        <btn @click="submit" :text="$t('Save')" :loading="this.sending"></btn>
      </div>
    </form>
  </div>
</template>

<script>
  import Btn from '~/components/Btn'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import { getErrorFromResponse } from '~/utils/helpers'
  import { mapState } from 'vuex'

  export default {
    name: 'edit-password',
    components: {
      Btn,
      FadeoutMessage
    },
    computed: {
      ...mapState('webuser', ['user'])
    },
    data () {
      return {
        password_old: null,
        password: null,
        password_retype: null,
        message: null,
        isError: null,
        sending: false,
        timer: null
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
        let errorMsg = null
        if (!this.password.trim()) {
          errorMsg = this.$t('Password can not be blank')
        } else if (this.password !== this.password_retype) {
          errorMsg = this.$t('Passwords do not match')
        }
        if (errorMsg) {
          this.setMessage(errorMsg, true)
          return
        }
        this.sending = true

        let params = {
          old_password: this.password_old,
          new_password: this.password
        }
        this.$api.put('users/change-password', params)
          .then(() => {
            this.setMessage(this.$t('Password has been changed'))
            this.timer = setTimeout(() => { this.$router.push('/profile') }, 3000)
          })
          .catch((err) => {
            this.setMessage(getErrorFromResponse(err), true)
          })
          .finally(() => {
            this.sending = false
          })
      }
    },
    beforeDestroy () {
      this.timer && clearTimeout(this.timer)
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .b-edit-password {
    margin-bottom: 20px;
    form {
      .b-input {
        .e-errors {
          font-size: 12px;
          color: @red-color;
          margin-top: 5px;
        }
      }

      .b-row {
        @w-label: 130px;
        margin-bottom: 20px;
        display: flex;
        min-height: 30px;
        &:last-child {
          margin-bottom: 0;
        }
        &:after { .after-clearfix; }
        .b-label {
          width: @w-label;
        }
        .b-input {
          flex-grow: 1;
          &:after { .after-clearfix; }
        }
        .btn {
          margin-left: 15px;
          min-width: 100px;
        }
        .b-message {
          flex-grow: 1;
          display: inline-flex;
          align-items: center;
          color: @green-color;
          &.error {
            color: @red-color;
          }
        }

      }
    }
  }
</style>
