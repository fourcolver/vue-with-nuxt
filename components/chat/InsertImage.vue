<template>
  <div class="c-chat-insert-image b-modal-overlay" @click="$emit('cancel')">
    <div class="b-modal" @click.stop="">
      <div class="b-img">
        <img :src="image"/>
      </div>
      <div class="b-caption">
        <div class="e-label">{{ $t('chat.insert_image.caption') }}</div>
        <input ref="caption" @keypress.enter="submit" @keydown.esc="$emit('cancel')" type="text"
               v-model="caption" class="e-input" maxlength="1000">
      </div>
      <div class="b-buttons">
        <div class="b-button m-cancel" @click="$emit('cancel')">{{ $t('chat.btn_cancel')}}</div>
        <div class="b-button m-ok"
             @click="submit">
          {{ $t('chat.btn_send')}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'insert-image',
    props: ['image'],
    data () {
      return {
        caption: ''
      }
    },
    methods: {
      submit () {
        this.$emit('submit', this.caption)
      }
    },
    computed: {},
    mounted () {
      this.$nextTick(() => this.$refs.caption && this.$refs.caption.focus())
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/chat.less';

  .c-chat-insert-image {
    @blue-color: #2975dc;
    .b-modal {
      .b-img {
        text-align: center;
        background: rgb(241, 241, 241);
        margin-bottom: 20px;
        img {
          max-width: 100%;
          max-height: calc(100vh ~'-' 220px);
        }
      }
      .b-caption {
        margin-bottom: 15px;
        .e-label {
          color: @blue-color;
          margin-bottom: 3px;
          font-size: 0.9em;
        }
        input {
          outline: none;
          border: none;
          border-bottom: 2px solid @blue-color;
          width: 100%;
          padding: 3px 0;
        }
      }
    }
  }
</style>