/** Class implementing the bubble view. */
class Bubble {

    constructor(data) {

        this.sort = [];
        this.data = data;

        this.height = 900;
        this.width = 900;

        this.circleScale = d3.scaleLinear()
            .domain([
                d3.min(this.data.map(d => +d.total)),
                d3.max(this.data.map(d => +d.total))
            ])
            .range([3, 12]);


        this.axisScale = d3.scaleLinear()
            .domain([
                d3.min(this.data.map(d => +d.position)),
                d3.max(this.data.map(d => +d.position))
            ])
            .range([0, this.width]);

        this.percentScale = d3.scaleLinear()
            .domain([-100, 100])
            .range([10, 140]);

        this.percentRScale = d3.scaleLinear()
            .domain([
                d3.min(this.data.map(d => +d.percent_of_r_speeches)),
                d3.max(this.data.map(d => +d.percent_of_r_speeches))
            ])
            .range([0, 65]);

        this.frequencyScale = d3.scaleLinear()
            .domain([0, 1])
            .range([10, 140]);

        this.colorScale = d3.scaleOrdinal(d3.schemeSet2);

        this.categories = d3.map(this.data, function (d) { return d.category; }).keys();

        let body = d3.select('body');

        body.append("br");
        body.append("button").text("Group By Topic").attr('id', 'switch').on('click', () => this.groupByTopic());
        body.append("button").text("Show Extremes").attr('id', 'highlighter').on('click', () => this.showExtremes());
        body.append("br");

        body.append("div").attr('height', 50).attr('flex-basis', 700).attr('id', 'label-group-outer');

        let labelGroupOuter = d3.select('#label-group-outer');
        labelGroupOuter.append("div").classed('label', true).attr('id', 'label-group-inner');
        let labelGroupInner = d3.select('#label-group-inner');
        labelGroupInner.append("div").classed('leaning-div-left', true).text('Democratic Leaning');
        labelGroupInner.append("div").classed('leaning-div-right', true).text('Republic Leaning');

        body.append('svg').attr('height', this.height).attr('width', this.width).attr('id', 'bubble-container');
        body.append('div').attr('id', 'table-container').classed('table-div', true);

        var brush = d3.brush()
            .on("brush", () => this.highlightBrushed())
            .on("end", () => this.updateTable());

        let bubbleSvg = d3.select('#bubble-container');

        let brushGroup = bubbleSvg.append("g").attr('id', 'brush-container');
        brushGroup.call(brush);
        brushGroup.on('click', () => this.handleGroupClick());

        bubbleSvg.append('g').attr('id', 'bubbleChartGroup');

        let axisGroup = bubbleSvg.append('g');
        let xAxis = d3.axisBottom();
        xAxis.scale(this.axisScale);
        axisGroup
            .attr("class", "axis")
            .call(xAxis
                .ticks(12)
                .tickFormat(Math.abs));

        this.count = 0;

        this.createTable(this.data);
    }


    createGroup() {

        var t = d3.transition()
            .duration(600)
            .ease(d3.easeLinear);

        var t1 = d3.transition()
            .duration(0)
            .ease(d3.easeLinear);

        d3.select('#switch').classed('custom-button-active', false).on('click', () => this.groupByTopic());;

        let bubbleChartGroup = d3.select('#bubbleChartGroup');

        bubbleChartGroup.on('.brush', null);
        this.createTable(this.data);

        let texts = bubbleChartGroup.selectAll('text').data(this.categories);

        let textsEnter = texts.enter().append('text');

        texts.exit().remove();

        texts = texts.merge(textsEnter);

        texts
            .text(d => d)
            .attr('class', 'category-label')
            .transition(t)
            .attr('y', -10);

        let circles = bubbleChartGroup.selectAll('circle').data(this.data);

        let circleEnter = circles.enter().append('circle');

        circles.exit().remove();

        circles = circles.merge(circleEnter);

        let titles = circles.selectAll('title');

        titles.remove();

        circles
            .classed('bubble', true)
            .style("fill", (d, i) => this.colorScale(this.categories.indexOf(d.category)))
            .transition(this.count > 0 ? t : t1)
            .attr('cx', d => d.sourceX)
            .attr('cy', d => d.sourceY + 100)
            .attr('r', d => this.circleScale(d.total));


        circles.append('title').text(d => this.tooltipRenderer(d));

        circles.on("mouseover", function () { d3.select(this).classed('bubble-highlight', true) });
        circles.on("mouseout", function () { d3.select(this).classed('bubble-highlight', false) });

        this.count = 1;

    }


    groupByTopic() {
        var t = d3.transition()
            .duration(600)
            .ease(d3.easeLinear);

        d3.select('#switch').classed('custom-button-active', true).on('click', () => this.createGroup());;

        let bubbleChartGroup = d3.select('#bubbleChartGroup');

        bubbleChartGroup.on('.brush', null);
        this.createTable(this.data);

        let texts = bubbleChartGroup.selectAll('text').data(this.categories);

        let textsEnter = texts.enter().append('text');

        texts.exit().remove();

        texts = texts.merge(textsEnter);

        texts
            .text(d => d)
            .attr('class', 'category-label')
            .transition(t)
            .attr('y', d => this.getMoveY(d) + 40);

        let circles = bubbleChartGroup.selectAll('circle').data(this.data);

        let circleEnter = circles.enter().append('circle');

        circles.exit().remove();

        circles = circles.merge(circleEnter);

        circles
            .classed('bubble', true)
            .style("fill", (d, i) => this.colorScale(this.categories.indexOf(d.category)))
            .transition(t)
            .attr('cx', d => d.moveX)
            .attr('cy', d => d.moveY + 100)
            .attr('r', d => this.circleScale(d.total));

        circles.on("mouseover", function () { d3.select(this).classed('bubble-highlight', true) });
        circles.on("mouseout", function () { d3.select(this).classed('bubble-highlight', false) });
    }


    showExtremes() {
        d3.selectAll('#overlay').style('display', 'block');
        d3.selectAll('#overlay').on('click', () => this.hideExtremes());
        let fact1 = d3.selectAll('circle').filter((d) => {
            return d.phrase == 'climate change'
        })
        let fact2 = d3.selectAll('circle').filter((d) => {
            return d.phrase == 'prison'
        })

        let fact1x = fact1._groups[0][0].getAttribute('cx'); 
        let fact1y = Math.abs(fact1._groups[0][0].getAttribute('cy'))+210;

        let fact2x = fact2._groups[0][0].getAttribute('cx');
        let fact2y = Math.abs(fact2._groups[0][0].getAttribute('cy'))+210;
        console.log(fact1y);
        d3.selectAll('#fact1').attr('style', 'position: absolute; top: '+ fact1y +'px;left: '+fact1x+'px');
        d3.selectAll('#fact2').attr('style', 'position: absolute; top: '+ fact2y +'px;left: '+fact2x+'px');
    }


    hideExtremes() {
        d3.selectAll('#overlay').style('display', 'none');
    }


    getMoveY(d) {
        for (var word of this.data) {
            if (word.category == d) return word.moveY;
        }
    }


    tooltipRenderer(d) {
        var tip = d.phrase.charAt(0).toUpperCase() + d.phrase.substring(1, d.phrase.length) + '\n' + 'R+ ' + Math.abs(d.position).toFixed(2) + '%' + '\n'
            + 'In ' + (d.total * 100 / 50) + '% of speeches.';
        return tip;
    }


    createTable(tableData) {
        let tableGroup = d3.select('#table-container');
        tableGroup.selectAll('table').remove();
        let table = tableGroup.append('table');

        var header = table.append("thead").append("tr");

        header
            .selectAll("th")
            .data(['Phrase', 'Frequency', 'Percentages', 'Total'])
            .enter()
            .append("th")
            .text(function (d) { return d; })
            .attr('id', (d, i) => 'column' + i)
            .on("click", (d) => {
                this.sortByAttribute(d);
            });

        let percentageHeader = d3.select('#column2');

        let frequencyHeader = d3.select('#column1');

        let percentageAxisSVG = percentageHeader.append('svg')
            .attr('height', '20')
            .attr('width', '150')
            .style('margin-top', '10');

        let percentageAxisGroup = percentageAxisSVG.append('g');

        let pxAxis = d3.axisBottom();
        pxAxis.scale(this.percentScale);
        percentageAxisGroup
            .call(pxAxis
                .ticks(3)
                .tickFormat(Math.abs));

        let frequencyAxisSVG = frequencyHeader.append('svg')
            .attr('height', '20')
            .attr('width', '150')
            .style('margin-top', '10');

        let frequencyAxisGroup = frequencyAxisSVG.append('g');

        let fxAxis = d3.axisBottom();
        fxAxis.scale(this.frequencyScale);
        frequencyAxisGroup
            .call(fxAxis
                .ticks(3)
                .tickFormat(Math.abs));

        table.append('tbody');

        let tbodySelection = table.select('tbody');

        let trSelection = tbodySelection.selectAll('tr').data(tableData);

        let trEnterSelection = trSelection.enter().append('tr');

        trSelection.exit().remove();

        trSelection = trSelection.merge(trEnterSelection);

        let tdSelection = trSelection.selectAll('td')
            .data(function (d, i) {
                var dataArr = new Array();
                dataArr.push({ 'value': d.phrase, 'index': i, 'type': 'text' });
                dataArr.push({ 'value': Math.abs(d.position / 100).toFixed(2), 'index': i, 'type': 'bar', 'category': d.category });
                dataArr.push({ 'value': [d.percent_of_d_speeches, d.percent_of_r_speeches], 'index': i, 'type': 'bars' });
                dataArr.push({ 'value': d.total, 'index': i, 'type': 'text' });
                return dataArr;
            });

        let tdEnterSelection = tdSelection.enter().append("td");

        tdSelection.exit().remove();

        tdSelection = tdSelection.merge(tdEnterSelection);

        let tdBarSelection = tdSelection.filter((d) => {
            return d.type == 'bar'
        })

        tdBarSelection.append('svg').attr('height', 20).attr('width', 150).style('margin-left', 10);

        tdBarSelection.selectAll('svg').append('g');

        let groups = tdBarSelection.selectAll('g');

        groups.append('rect');

        let rects = groups.selectAll('rect');

        rects.attr('height', 20)
            .attr('width', d => this.frequencyScale(d.value))
            .style('fill', d => this.colorScale(this.categories.indexOf(d.category)));

        let tdTextSelection = tdSelection.filter((d) => {
            return d.type == 'text'
        })

        tdTextSelection.html(d => d.value);

        let tdBarsSelection = tdSelection.filter((d) => {
            return d.type == 'bars'
        })

        tdBarsSelection.append('svg').attr('height', 20).attr('width', 150).style('margin-left', 10);

        tdBarsSelection.selectAll('svg').append('g').classed('republic', true);

        let barGroups = tdBarsSelection.selectAll('.republic');

        barGroups.append('rect');

        let barRects = barGroups.selectAll('rect');

        barRects.attr('height', 20)
            .attr('x', 70.5)
            .attr('width', d => this.percentRScale(d.value[1]))
            .style('fill', '#4db6ac');

        barRects.append('title').text(d => 'R ' + d.value[1]);

        tdBarsSelection.selectAll('svg').append('g').classed('democratic', true);

        let barGroups2 = tdBarsSelection.selectAll('.democratic');

        barGroups2.append('rect');

        let barRects2 = barGroups2.selectAll('rect');

        barRects2.attr('height', 20)
            .attr('width', d => this.percentRScale(d.value[0]))
            .attr('transform', 'translate(70.5, 0) scale(-1, 1)')
            .style('fill', '#e64a19');

        barRects2.append('title').text(d => 'D ' + d.value[0]);
    }


    sortByAttribute(d){
        var asc = false;
        if(this.sort.indexOf(d) == -1) {
            this.sort.push(d);
            asc = true;
        }
        else {
            this.sort.splice(this.sort.indexOf(d), 1);
        } 
        switch (d) {
            case 'Phrase': 
                if(asc) this.data = this.data.slice().sort((a, b) => d3.ascending(a.phrase, b.phrase));
                else this.data = this.data.slice().sort((a, b) => d3.descending(a.phrase, b.phrase));
                break;
            case 'Total': 
                if(asc) this.data = this.data.slice().sort((a, b) => d3.ascending(parseInt(a.total), parseInt(b.total)));
                else this.data = this.data.slice().sort((a, b) => d3.descending(parseInt(a.total), parseInt(b.total)));
                break;
            case 'Frequency': 
                if(asc) this.data = this.data.slice().sort((a, b) => d3.ascending(parseInt(Math.abs(a.position)), parseInt(Math.abs(b.position))));
                else this.data = this.data.slice().sort((a, b) => d3.descending(parseInt(Math.abs(a.position)), parseInt(Math.abs(b.position / 100))));
                break;
            case 'Percentages': 
                if(asc) this.data = this.data.slice().sort((a, b) => d3.ascending(a.percent_of_d_speeches - a.percent_of_r_speeches, b.percent_of_d_speeches - b.percent_of_r_speeches));
                else this.data = this.data.slice().sort((a, b) => d3.descending(a.percent_of_d_speeches - a.percent_of_r_speeches, b.percent_of_d_speeches - b.percent_of_r_speeches));
                break;
        }

        this.createTable(this.data);
    }


    highlightBrushed() {
        if (!d3.event.sourceEvent) return;
        let bubbleChartGroup = d3.selectAll('#bubbleChartGroup');
        var brush_coords = d3.event.selection,
            x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
        var that = this;
        bubbleChartGroup.selectAll('circle')
            .style("fill", function (d) {
                var cx = d3.select(this).attr('cx');
                var cy = d3.select(this).attr('cy');
                if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1)
                    return that.colorScale(that.categories.indexOf(d.category));
                else
                    return "#EAEAEA";
            })
            .classed("brushed", function (d) {
                var cx = d3.select(this).attr('cx');
                var cy = d3.select(this).attr('cy');
                return (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1)
            });

        if (!d3.event.selection) return;

        var d_brushed = d3.selectAll(".brushed").data();
        this.tableData = d_brushed;

        this.createTable(this.tableData);
    }


    handleGroupClick() {
        let bubbleChartGroup = d3.selectAll('bubbleChartGroup');
        bubbleChartGroup.on('.brush', null);
        d3.selectAll('circle')
            .style("fill", (d) => {
                return this.colorScale(this.categories.indexOf(d.category));
            })
        this.createTable(this.data);
    }

}