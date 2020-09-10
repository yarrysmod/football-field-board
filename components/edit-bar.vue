<template>
  <div :style="{height: footerHeight + 'px'}">
    <v-footer
      fixed
      padless
      ref="footer"
    >
      <v-card
        flat
        tile
        width="100%"
        class="text-center"
      >
        <v-card-text>
          insert functionality here area here
        </v-card-text>
      </v-card>
    </v-footer>
  </div>
</template>

<script>
export default {
  data: () => ({
    footerHeight: 0,
  }),
  mounted () {
    this.footerHeight = this.$refs.footer.$el.getBoundingClientRect().height;
  }
}
</script>
