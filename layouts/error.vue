<template>
  <div class="b-container">
    <div v-if="error.statusCode !== 401">
      <h1 v-if="error.statusCode === 404">{{ $t('Page not found') }}</h1>
      <h1 v-else-if="error.statusCode === 410">{{ $t('You are trying to access expired page') }}</h1>
      <h1 v-else>[{{ error.statusCode }}] {{ error.message }}</h1>
      <nuxt-link to="/">{{ $t('Home page') }}</nuxt-link>
      <div class="b-debug">{{ JSON.stringify(error)}}</div>
    </div>
  </div>
</template>

<script>
  export default {
    props: ['error'],
    layout: 'error_layout'
  }
</script>

<style lang="less" type="text/less">
  .b-container {
    display:flex;
    text-align: center;
    justify-content: center;
    align-items:center;
    position:absolute;
    top:0;
    left:0;
    right:0;
    bottom:0;
    h1 {
      margin-bottom: 20px;
    }
    .b-debug {
      font-size: 10px;
      color: grey;
      /*width: 75%;*/
      margin: 25px auto;
    }
  }
</style>
