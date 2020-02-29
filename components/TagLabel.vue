<template>
  <div class="b-tag-label" v-if="tagName" :class="{'m-arrow': endArrow}">
    <div class="e-tag" @click="$emit('click')">
      <span v-if="removable" class="e-remove">&times;</span>
      {{ tagName }}
    </div>
    <span v-if="endArrow" class="e-separator">
      >
    </span>
  </div>
</template>

<script>
  import { capitalize } from '../utils/helpers'

  export default {
    name: 'tag-label',
    props: {
      tag: null,
      endArrow: {
        'default': true
      },
      showParent: {
        'default': true
      },
      tag1: null,
      removable: null
    },
    computed: {
      tags () {
        return this.$store.state.Issues.tags
      },
      tagObject () {
        return this.findById(this.tag)
      },
      tagName () {
        if (this.tag1) {
          return capitalize(this.tag1)
        }
        const tagObj = this.tagObject
        return tagObj ? tagObj.name : ''
      }
    },
    methods: {
      findById (id) {
        return this.tags.find(el => el.id.toString() === id.toString()) || null
      }
    }
  }
</script>

<style lang="less">
  @import '~assets/css/mixins.less';
  .b-tag-label {
    display: inline-flex;
    font-weight: bold;
    max-width: 280px;
    overflow: hidden;
    white-space: nowrap;
    &:not(.m-arrow) {
      margin-right: 3px;
    }
    .e-separator {
      font-weight: normal;
      color: #bbb;
      display: inline;
      margin: 0 3px;
    }
    .e-tag {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline;
      .e-remove {
        margin: 0 2px 0 4px;
        vertical-align: top;
        display: none;
      }
      &:hover {
        .e-remove {
          display: inline;
        }
      }
    }
    &.has-hover .e-tag {
      .hover-mixin();
      padding: 3px;
    }
  }
</style>
