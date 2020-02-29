<template>
  <div class="c-issue-star">
    <i @click="toggle" class="e-star"
       :class=" issue.is_starred ? 'bu-star m-active' : 'bu-star-empty' "></i>
  </div>
</template>

<script>
  export default {
    name: 'issue-star',
    props: ['issue'],
    data () {
      return {}
    },
    methods: {
      toggle () {
        const starred = +!this.issue.is_starred
        this.$store.dispatch('Issues/setStarred', {id: this.issue.id, is_starred: starred})
        this.$emit('change', starred)
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-issue-star {
    left: -38px;
    position: absolute;
    cursor: pointer;
    .e-star {
      font-size: 1.3em;
      padding: 2px 0;
      color: #c7c7c7;
      &:hover, &.m-active {
        color: @red-color;
      }
    }
  }
</style>