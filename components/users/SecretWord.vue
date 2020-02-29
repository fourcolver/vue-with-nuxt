<template>
  <div class="c-secret-word">
    <div class="b-section-copy">
        <div class="b-row-text">{{ $t('secret_word.anybody_can_join')}}:</div>
        <div class="b-row-link">
          <strong>{{ createAbsoluteUrl() }}</strong>
          <div class="b-button">
            <span class="b-btn-copy" @click="doCopy">{{ $t('Copy') }}</span>
            <fadeout-message v-if="copiedMessage" class="b-success-message" :message="copiedMessage" @hide="copiedMessage = null" delay="1000"></fadeout-message>
          </div>
        </div>
    </div>

    <div class="b-section-form">
      <div class="b-defined" v-if="company.secret_word">
        <span>{{ $t('secret_word.not_defined') }}.</span>
        <span class="e-link" @click="changeEditMode(true)">{{ $t('secret_word.change') }}</span>
        <span class="e-link" @click="remove">{{ $t('secret_word.delete') }}</span>
      </div>

      <div class="b-can-define" v-else>
        {{ $t('secret_word.you_can_define') }}.
        <div class="b-set-link">
          <span class="e-link" @click="changeEditMode(true)">{{ $t('secret_word.set_secret_word') }}</span>
        </div>
      </div>
    </div>

    <lightbox class="b-lightbox" v-if="editMode" @hide="editMode=false">
      <div class="b-close"><i class="bu-cancel" @click="changeEditMode(false)"></i></div>
      <div class="b-input">
        <input type="password" maxlength="20" ref="secret_word" autofocus="autofocus" name="secret_word" autocomplete="off" v-model="secret_word" @keyup.enter="apply" :placeholder="$t('Secret word')">
        <btn :text="$t('secret_word.apply')" @click="apply" :loading="this.sending"></btn>
      </div>
      <fadeout-message v-if="error" class="b-error" :message="error" @hide="error=null"></fadeout-message>
    </lightbox>
  </div>
</template>

<script>
  import Btn from '~/components/Btn'
  import { mapGetters } from 'vuex'
  import FadeoutMessage from '~/components/FadeoutMessage.vue'
  import Lightbox from '~/components/Lightbox.vue'
  import { getErrorFromResponse } from '~/utils/helpers'

  export default {
    name: 'secret-word',
    components: {
      Btn,
      FadeoutMessage,
      Lightbox
    },
    props: [
    ],
    data () {
      return {
        secret_word: '',
        sending: false,
        editMode: false,
        error: null,
        copiedMessage: null
      }
    },
    computed: {
      ...mapGetters({
        company: 'webuser/company',
        createAbsoluteUrl: 'company/createAbsoluteUrl'
      })
    },
    methods: {
      changeEditMode (isEdit) {
        if (isEdit) {
          this.secret_word = this.company.secret_word ? this.company.secret_word : ''
          this.editMode = true
          this.$nextTick(() => {
            this.$refs.secret_word.focus()
            this.$refs.secret_word.select()
          })
        } else {
          this.editMode = false
        }
      },
      apply () {
        if (this.sending) {
          return
        }
        if (!this.secret_word.trim()) {
          this.error = this.$t('secret_word.cannot_be_blank')
          return
        }
        this.sending = true
        this.$api.put('companies/update-profile', {secret_word: this.secret_word})
          .then(res => {
            this.$store.commit('webuser/SET_COMPANY', res.data.company)
            this.changeEditMode(false)
          })
          .catch(err => {
            this.error = getErrorFromResponse(err)
          })
          .finally(() => {
            this.sending = false
          })
      },
      remove () {
        if (this.sending) {
          return
        }
        if (confirm(this.$t('secret_word.are_you_sure'))) {
          this.sending = true
          this.$api.put('companies/update-profile', {secret_word: null})
            .then(res => {
              this.$store.commit('webuser/SET_COMPANY', res.data.company)
            })
            .catch(err => {
              alert(getErrorFromResponse(err))
            })
            .finally(() => {
              this.sending = false
            })
        }
      },
      doCopy () {
        this.$copyText(this.createAbsoluteUrl())
          .then(() => {
            this.copiedMessage = this.$t('secret_word.link_copied')
          })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-secret-word {
    padding: 20px;
    .b-section-copy {
      text-align: center;
      .b-row-link {
        margin-top: 5px;
        position: relative;
        &:hover {
          .b-button {
            display: block;
          }
        }
        .b-button {
          position: absolute;
          right: 0;
          top: 0;
          display: none;
          .b-btn-copy {
            position: relative;
            top: -1px;
            padding: 2px 5px;
            border-radius: 5px;
            background: #2668c1;
            color: #fff;
            font-size: 10px;
            cursor: pointer;
          }
          .b-success-message {
            position: absolute;
            right: 100%;
            padding-right: 10px;
            top: 1px;
            font-size: 12px;
            color: @red-color;
          }
        }
      }
    }
    .b-section-form {
      margin-top: 20px;
      .e-link {
        color: @blue-color;
        &:hover {
          text-decoration: underline;
        }
      }
      .b-defined {
        text-align: center;
        > span {
          padding-right: 10px;
        }
      }
      .b-can-define {
        line-height: 1.4em;
        .b-set-link {
          padding-top: 15px;
          text-align: center;
        }
      }
    }

    .b-lightbox {
      .b-content {
        width: 350px !important;
        height: 95px;
        padding: 30px 30px 0 30px !important;
        position: relative;
        .b-close {
          display: none;
          position: absolute;
          right: 0;
          top: 0;
          font-size: 14px;
          cursor: pointer;
          color: @basic-blue;
          padding: 3px;
          .hover-mixin(@hover-light);
        }
        .b-input {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          height: 35px;
          input[type=text], input[type=password] {
            flex: 1;
            border: 1px solid #dbdbdb;
            border-radius: 5px;
            outline: none;
            font-size: .9em;
            &:focus {
              border-color: #777;
            }
            padding: 6px 10px;
            height: 32px;
          }
          .btn {
            flex: 0 0 70px;
            height: 32px;
            margin-left: 5px;
            /*border-radius: 2px;*/
          }
        }
        .b-error {
          margin-top: 5px;
          font-size: 12px;
          color: @red-color;
        }
      }
    }
  }
</style>
