<template>
  <span class="e-img">
    <protected-image :preview="width && finalWidth == width" :src="src" :width="finalWidth" :height="finalHeight"></protected-image>
  </span>
</template>

<script>
  import ProtectedImage from './ProtectedImage.vue'

  export default {
    components: {ProtectedImage},
    name: 'fluid-image',
    props: [
      'src',
      'width',
      'height',
      'maxWidth',
      'preview'
    ],
    computed: {
      _needsResize () {
        return this.width && this.maxWidth && this.height && this.width > this.maxWidth
      },
      finalWidth () {
        return this._needsResize ? this.maxWidth : this.width
      },
      finalHeight () {
        return this._needsResize ? (this.maxWidth / this.width * this.height) : this.height
      }
    }
  }
</script>