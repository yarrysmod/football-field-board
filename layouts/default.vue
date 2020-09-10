<template>
  <v-app dark>

    <v-app-bar fixed app color="primary">
      <v-toolbar-title v-text="title" />
      <v-spacer />
    </v-app-bar>
    <v-main>
      <nuxt />
    </v-main>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      title: 'Football Route Planner',
    }
  },
}
</script>
