// where the data is
// the number of rows to display
// the id of the 'container' where it will be placed
var build_table = function(filepath, nrows, container){
d3.csv(filepath,
       function(error, rows) {

    // how much of the data to display
    data = rows.slice(0,nrows)

    // the columns you'd like to display
    var columns = Object.keys(rows[0])

    // for (var i = 0; i < data.length; i++) {
    //     for (var key in data[i]) {
    //         console.log(key)
    //         console.log(isNaN(data[i][key]))
    //     }
    // }

    var table = d3.select("#"+ container).append("table")
                    .attr("border", '1px solid black');
    var thead = table.append("thead");
    var tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
            .text(function(column) { return column; });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .attr("align", "center");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return row[column];
            });
        })
        .enter()
        .append("td")
            .text(function(d) { return d; });
});
}
