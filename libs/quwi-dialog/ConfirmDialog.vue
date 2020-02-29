<template>
  <div class="c-confirm-dialog" :class="{}" v-show="visible" v-key-escape="() => close()" @click="close()">
    <div class="b-modal" @click.stop="">
      <div class="b-body" v-html="text"></div>
      <div class="b-buttons">
        <div v-if="!isAlert" class="b-button b-cancel" @click="close()">{{ noLabel || $t('dialog.confirm.no')}}
        </div>
        <div class="b-button b-confirm" @click="confirm()">{{ yesLabel || $t('dialog.confirm.yes')
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import listeners from '~/utils/mixins/listeners'

  export default {
    name: 'confirm-dialog',
    props: ['text', 'yesLabel', 'noLabel', 'onConfirm', 'onCancel', 'isAlert'],
    data () {
      return {
        visible: true
      }
    },
    mixins: [listeners],
    methods: {
      confirm () {
        if (typeof this.onConfirm === 'function') {
          this.onConfirm()
        }
        this.close(false)
      },
      close (isCancel = true) {
        if (isCancel && typeof this.onCancel === 'function') {
          this.onCancel()
        }
        this.$emit('close')
      }
    },
    mounted () {
      this.addListener(document, 'keypress', e => {
        if (e.keyCode === 13) {
          this.confirm()
        }
      })
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .c-confirm-dialog {
    .fullscreen-modal();
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    .b-modal {
      .white-box;
      min-width: 400px;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      .b-body {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.1em;
        line-height: 1.3em;
        padding: 10px 20px 10px 20px;
      }
      .b-buttons {
        display: flex;
        justify-content: flex-end;
        padding: 5px 20px 10px 20px;
        .b-button {
          .tg-button();
        }
      }
    }
  }
</style>
