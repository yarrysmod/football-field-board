<template>
  <v-container>
    <v-row fluid justify="center">
      <v-col md="6" sm="8" xs="12">
        <v-card>
          <football-field></football-field>
        </v-card>
      </v-col>
    </v-row>
    <v-row fluid justify="center">
      <v-col md="6" sm="8" xs="12">
        <edit-bar></edit-bar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import FootballField from '@/components/football-field'
import EditBar from '@/components/edit-bar'

export default {
  components: {
    FootballField,
    EditBar,
  },
}
</script>
