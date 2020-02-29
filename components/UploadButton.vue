<template>
  <div class="e-upload" :data-uid="_uid" @click="start" :class="{'m-inactive': locked}">
    <input type="file" :multiple="maxFiles > 1" @change="handleUpload">
    <i v-if="showIcon" class="bu-upload-cloud"></i>
    <slot></slot>
  </div>
</template>

<script>
  import { formatFileSize } from '~/utils/helpers'
  export default {
    props: {
      onUpload: {},
      maxFiles: {
        default: 5
      },
      maxSize: {
        default: 1e8
      },
      showIcon: {
        default: true
      },
      allowedExtensions: {
        default: () => []
      },
      locked: {
        default: false
      }
    },
    name: 'upload-button',
    methods: {
      handleUpload (e) {
        const filesCount = e.target.files.length
        const files = e.target.files
        if (!filesCount) {
          return
        }
        if (this.allowedExtensions) {
          const regex = new RegExp('(' + this.allowedExtensions.join('|') + ')$')
          if (!regex.test(e.target.value.toLowerCase())) {
            alert(this.$t('Invalid file type'))
            return
          }
        }
        if (filesCount > this.maxFiles) {
          alert(this.$t('Maximum files can be uploaded simultaneously') + ': ' + this.maxFiles)
          return
        }
        let totalSize = 0
        for (let k in files) {
          if (!files.hasOwnProperty(k)) {
            continue
          }
          if (files[k].size) {
            totalSize += parseInt(files[k].size)
          }
        }
        if (totalSize > this.maxSize) {
          alert(this.$t('upload_button.large_file' + (this.maxFiles > 1 ? 's' : '')) + ' ' + formatFileSize(this.maxSize))
          return
        }
        this.onUpload(e)
      },
      start (e) {
        if (this.locked) {
          return
        }
        const uid = this.$el.getAttribute('data-uid')
        const fileInput = document.querySelector(`[data-uid="${uid}"] input[type="file"]`)
        fileInput.value = ''
        fileInput.click()
      }
    }
  }
</script>

<style lang="less">
  @import '~assets/css/mixins.less';

  .e-upload {
    &:not(.m-inactive) {
      .hover-mixin(true);
    }
    &.m-inactive {
      opacity: .5;
    }
    padding: 4px;
    cursor: pointer;
    input[type=file] {
      visibility: hidden;
      width: 1px;
      height: 1px;
      position: absolute;
    }
    i {
      &:before {
         width: 1.5em;
       }

    }

  }
</style>
