function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function expand(d) {
    var children = (d.children)?d.children:d._children;
    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    if(children)
        children.forEach(expand);
}

function collapseAll() {
    root.children.forEach(collapse);
    update(root);
}

function expandAll() {
    expand(root);
    update(root);
}

// Set colors based on file type
function fileColors(d) {
    if(d.type === "database") return "#787f51";
    if(d.type === "documentation") return "#824937";
    if(d.type === "project") return "#000000";
    if(d.type === "code") return "#cd5b1b";
    if(d.type === "root") return "#314d26";
    if(d.type === "visualization") return "#c19408";
    if(d.type === "web_scraping") return "#c8bd92";
}

// Toggle children on click.
function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

var margin = {top: 20, right: 120, bottom: 20, left: 175},
    width = 960 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) {
        return [d.y, d.x];
    });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("projects.json", function(error, flare) {
    if (error) throw error;

    root = flare;
    root.x0 = height / 2;
    root.y0 = 0;

    root.children.forEach(collapse);
    update(root);
});

d3.select(self.frameElement).style("height", "600px");

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
        d.y = d.depth * 180;
    });

    // Update the nodes
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click);

    // Color Nodes
    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("stroke", function (d) {
            return fileColors(d)
        })
        .style("fill", function (d) {
            return fileColors(d)
        });

    nodeEnter.append("text")
        .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) {
            return d.name;
        })
        .style("fill-opacity", 1e-6);

    // Add link if url exists in JSON
    try {
        var nodeShape = nodeEnter.node().getBBox();
        // console.log("nodeShape", nodeShape);

        nodeEnter.append("svg")
            .attr(height = nodeShape.height)
            .attr(width = nodeShape.width);

        nodeEnter.append("a")
            .attr("xlink:href", function (d) {
                return d.url;
            })
            .append("rect")
            .attr("x", -10)
            .attr("y", -nodeShape.height / 2)
            .attr("height", nodeShape.height)
            .attr("width", nodeShape.width + 10)
            .style("fill-opacity", 1e-6);
    } catch (e) {
        // catch TypeError during tree collapse
    }

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("circle")
        .attr("r", 6)
        .style("stroke", function (d) {
            return fileColors(d);
        })
        .style("fill", function(d) {
            return fileColors(d);
        });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}
