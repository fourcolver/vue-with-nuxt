<template>
  <div class="app-layout">
    <nav class="app-navbar">
      <a @click.stop.prevent="$router.push('/')" href="/" class="app-quwi">
        Q
      </a>
    </nav>
    <section id="content">
      <nuxt/>
    </section>
  </div>
</template>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  body {
    background-color: #f4f4f4;
  }
  .app-layout {
    .app-navbar {
      display: flex;
    }

  }
</style>
