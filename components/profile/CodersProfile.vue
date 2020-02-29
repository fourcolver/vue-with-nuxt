<template>

  <div class="c-coders-profile">
    <form class="app-form" @submit.prevent="submit">
      <div class="b-title">
        {{ $t('coders_profile.title') }}
      </div>
      <div class="b-body">
        <div class="b-row m-toggle">
          <div class="b-label">
            <toggle v-model="_profile.is_shared"></toggle>
          </div>
          <div class="b-input">
            <div class="e-label">{{ $t('coders_profile.is_shared')}}</div>
          </div>
        </div>
        <template v-if="_profile.is_shared">
          <div class="b-row">
            <div class="b-label">
              <label for="">{{ $t('coders_profile.username') }}</label>
            </div>
            <div class="b-input">
              <active-input ref="usernameInput" name="username" v-model="_profile.username"
                            :options="{maxlength: 32}"
                            pattern="[a-z0-9]"
                            :error="firstErrors.username"></active-input>
            </div>
          </div>
          <div class="b-row m-aboutme">
            <div class="b-label">
              <label for="">{{ $t('coders_profile.aboutme')}}</label>
            </div>
            <div class="b-input">
              <active-input tag="textarea" name="aboutme" v-model="_profile.aboutme" :error="firstErrors.aboutme"
                            :options="{rows: 2, maxlength: 70}"
                            :events="{focus: e => this.isCounterVisible = true, blur: e => this.isCounterVisible = false}"></active-input>
            </div>
          </div>
        </template>
        <div class="b-bottom">
          <div class="b-left">
            <fadeout-message :message="message" @hide="message = ''"></fadeout-message>
          </div>
          <div class="b-right">
            <div class="e-counter" v-show="_profile.is_shared && isCounterVisible">
              {{ $t('coders_profile.left_chars') + ': ' + leftChars }}
            </div>
            <btn :text="$t('coders_profile.save')" :loading="sending" @click="submit"></btn>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
  import Toggle from '../Toggle.vue'
  import ActiveInput from '../ActiveInput.vue'
  import Btn from '../Btn.vue'
  import FadeoutMessage from '../FadeoutMessage.vue'

  export default {
    components: {
      FadeoutMessage,
      Btn,
      ActiveInput,
      Toggle
    },
    name: 'coders-profile',
    props: ['profile'],
    data () {
      return {
        _profile: {},
        sending: false,
        message: '',
        isCounterVisible: false,
        firstErrors: {
          username: '',
          aboutme: ''
        }
      }
    },
    methods: {
      submit () {
        this.sending = true
        this.$api.put('coders-profile/update', this._profile)
          .then(() => {
            this.message = this.$t('coders_profile.success_message')
          })
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
          })
          .finally(() => {
            this.sending = false
          })
      }
    },
    computed: {
      leftChars () {
        return 70 - (this._profile.aboutme ? this._profile.aboutme.length : 0)
      }
    },
    created () {
      this._profile = this.profile
    },
    mounted () {
      window.codersProfile = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-coders-profile {
    margin-bottom: 20px;
    .b-row {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      .b-label {
        width: 140px;
      }
      .b-input {
        flex: 1;
        .c-active-input {
          width: 300px;
        }
        input, textarea {
          .text-input();
        }
      }
      &.m-aboutme {
        align-items: flex-start;
        .c-active-input {
          width: 100% !important;
          textarea {
            resize: none;
          }
        }
      }
      &.m-toggle {
        .b-label {
          text-align: center;
        }
      }
    }
    .b-bottom {
      display: flex;
      align-items: center;
      > .b-left {
        flex: 1;
        color: @green-color;
      }
      > .b-right {
        display: flex;
        align-items: center;
        .e-counter {
          margin-right: 15px;
          color: rgb(195, 197, 208);
        }
      }
    }
  }
</style>
