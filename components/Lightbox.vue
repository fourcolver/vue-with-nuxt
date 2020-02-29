<template>
  <div class="c-lightbox">
    <div class="b-main-wrap" v-key-escape="hide" @click="hide">
        <div class="b-content" @click.stop="()=>{}">
          <slot>
            <div class="b-main">
              {{ message }}
              <btn :text="button" class="b-button" @click="hide"></btn>
            </div>
          </slot>
        </div>
    </div>
  </div>
</template>

<script>
  import Btn from '~/components/Btn'

  export default {
    name: 'lightbox',
    components: {
      Btn
    },
    props: {
      message: {
        default: ''
      },
      button: {
        default: 'Ok'
      }
    },
    methods: {
      hide () {
        this.$emit('hide')
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-lightbox {
    @top-height: 46px;
    z-index: 9999;
    height: 100%;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.7);
    touch-action: none;
    .b-main-wrap {
      position: absolute;
      width: 100vw;
      height: calc(100vh ~'-' @top-height);
      display: flex;
      align-items: center;
      justify-content: center;
      top: @top-height;
      left: 0;
      .b-content {
        background: #fff;
        width: 300px;
        padding: 25px;
        margin: 0 auto;
        .b-main {
          text-align: center;
          .b-button {
            margin-top: 15px;
          }
        }
      }
    }
  }
</style>
