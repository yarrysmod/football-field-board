<template>
  <div>
    <svg ref="field" v-bind:viewBox="`0 0 ${dimensions.x} ${dimensions.y}`"></svg>
  </div>
</template>

<script lang="ts">
import * as d3 from "d3";
import Vue from "vue";
import EditBar from "./edit-bar.vue";

export interface SpotProperties {
  circleElement: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>,
  textElement: d3.Selection<SVGTextElement, unknown, HTMLElement, any>
  routeDetails?: any, // TODO
}

type SpotPosition = { x: number, y: number };

export default Vue.extend({
  name: 'FootballField',
  components: {EditBar},
  data: function () {
    const fiveYards = 5;
    const tenYards = fiveYards * 2;
    const numberZones = 4;
    const paddingYards = 1;
    const factor = 30;

    const padding = paddingYards * factor;
    const fieldWidth = tenYards * factor;
    const fieldHeight = fiveYards * numberZones * factor;
    const gridTickSize = fieldWidth / 12;

    return {
      fiveYards,
      tenYards,
      numberZones,

      paddingYards,
      padding,

      fieldWidth,
      fieldHeight,
      gridTickSize,

      dimensions: {
        x: fieldWidth + padding * 2,
        y: fieldHeight + padding * 2,
      },

      colors: {
        stroke: '#aaa',
        field: {
          stroke: '#aaa',
          fill: '#fff'
        },
        spot: {
          idle: {
            stroke: '#aaa',
            fill: '#fff'
          },
          active: {
            stroke: '#359b56',
            fill: '#fffb00'
          }
        }
      },
      spots: [] as SpotProperties[],
      spotSize: padding / 2,
    };
  },

  methods: {
    clientDrawFieldLines(field: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
      const tickValueFontSize = '8px';

      field
        .style('color', this.colors.field.stroke)
        .attr('fill', this.colors.field.fill)
        .append('rect')
        .attr('width', this.dimensions.x)
        .attr('height', this.dimensions.y);

      const data = [-5, 0, 5, 10];
      const scale = d3.scaleLinear()
        .domain([Math.min(...data), Math.max(...data)])
        .range([this.fieldHeight, 0]);

      field.append("g")
        .style('font-size', tickValueFontSize)
        .attr("transform", `translate(${this.padding}, ${this.padding})`)
        .call(d3.axisLeft(scale).ticks(data.length));

      field.append("g")
        .style('font-size', tickValueFontSize)
        .attr("transform", `translate(${this.padding + this.fieldWidth}, ${this.padding})`)
        .call(d3.axisRight(scale).ticks(data.length));

      const lineIterations = [
        {
          className: 'fiveYardGrid',
          length: data.length,
          x1: 0,
          x2: this.fieldWidth,
        },
        {
          className: 'oneYardGridLeft',
          length: data.length * 4,
          x1: this.padding,
          x2: this.padding * 2,
          strokeLineCap: 'round',
        },
        {
          className: 'oneYardGridRight',
          length: data.length * 4,
          x1: this.fieldWidth - this.padding * 2,
          x2: this.fieldWidth - this.padding,
          strokeLineCap: 'round',
        },
      ];

      for (const {className, length, x1, x2, strokeLineCap = ''} of lineIterations) {
        field.selectAll(`line.${className}`)
          .data(scale.ticks(length))
          .enter()
          .append("line")
          .attr("fill", this.colors.field.fill)
          .attr("stroke", this.colors.field.stroke)
          .attr("class", className)
          .attr("transform", `translate(${this.padding}, ${this.padding + 0.5})`)
          .attr("x1", x1)
          .attr("x2", x2)
          .attr("y1", function (d) {
            return scale(d)
          })
          .attr("y2", function (d) {
            return scale(d)
          })
          .attr("stroke-width", "1px")
          .attr('stroke-linecap', strokeLineCap);
      }
    },

    clientDrawInnerField(field: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
      const innerField = field
        .append('svg')
        .attr('viewBox', `-${this.padding} -${this.padding} ${this.dimensions.x} ${this.dimensions.y}`);

      innerField
        .append('rect')
        .attr('width', this.fieldWidth)
        .attr('height', this.fieldHeight)
        .attr('fill', 'transparent');

      return innerField;
    },

    clientDrawSpot(
      innerField: d3.Selection<ElementTagNameMap["svg"], unknown, HTMLElement, any>,
      spotPosition: SpotPosition,
      doReturnDummyCircle: boolean = false
    ) {
      const spot: SpotProperties = {
        circleElement: innerField
          .append("circle")
          .style("fill", this.colors.spot.idle.fill)
          .style('stroke', this.colors.spot.idle.stroke)
          .attr("r", this.spotSize)
          .style('stroke-width', this.spotSize / 10),
        textElement: innerField
          .append("text")
          .style('fill', this.colors.spot.idle.stroke)
          .attr("text-anchor", 'middle')
          .attr("alignment-baseline", 'middle')
          .attr('font-weight', 'bold'),
      };

      this.clientPositionSpot(spot, spotPosition);

      if (!doReturnDummyCircle) {
        spot.circleElement
          .on('click', () => {
            d3.event.stopPropagation();
            console.log('clicked'); // TODO: pop up edit menu etc.
          })
          .on('mouseover', () => d3.event.stopPropagation())
          .on('mousedown', () => d3.event.stopPropagation())

        this.spots.push(spot);
      }

      return spot;
    },

    clientPositionSpot(spot: SpotProperties, spotPosition: SpotPosition) {
      spot.circleElement
        .attr("cx", spotPosition.x)
        .attr("cy", spotPosition.y);

      spot.textElement
        .attr("dx", spotPosition.x)
        .attr("dy", spotPosition.y);
    },

    clientGetGridPosition(target: d3.ContainerElement) {
      const mousePosition = d3.mouse(target);
      const xOffset = mousePosition[0] % this.gridTickSize;
      const yOffset = mousePosition[1] % this.gridTickSize;
      const offsetThreshold = this.gridTickSize / 2;

      return {
        x: mousePosition[0] - xOffset + (xOffset > offsetThreshold ? offsetThreshold : 0),
        y: mousePosition[1] - yOffset + (yOffset > offsetThreshold ? offsetThreshold : 0),
      };
    },

    clientInitEventListener(innerField: d3.Selection<ElementTagNameMap["svg"], unknown, HTMLElement, any>) {
      const resetPosition = -999;
      const temporarySpot = this.clientDrawSpot(innerField, {x: resetPosition, y: resetPosition}, true);

      innerField
        .on('click', () => {
          this.clientDrawSpot(innerField, this.clientGetGridPosition(d3.event.currentTarget));
        })
        .on('mousemove', () => {
          this.clientPositionSpot(temporarySpot, this.clientGetGridPosition(d3.event.currentTarget));
        })
        .on('mouseout', () => {
          this.clientPositionSpot(temporarySpot, {x: resetPosition, y: resetPosition});
        })
    }
  },

  mounted() {
    const field = d3.select(
      // @ts-ignore
      this.$refs.field
    );

    this.clientDrawFieldLines(field);

    const innerField = this.clientDrawInnerField(field);

    this.clientInitEventListener(innerField);
  },
})
</script>
