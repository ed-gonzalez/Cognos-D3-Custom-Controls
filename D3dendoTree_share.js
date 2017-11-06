/*
 Author: 
 Ed Gonzalez  
 edgonzalez@icdata.io
 www.icdata.io 
 www.linkedin.com/in/ed-gonzalez-9683696
 
	Free for personal and commercial use under the CCA 3.0 license
	I just ask for you give me credit for the code and tell your friends about it.

	* Note this is not production ready code. It is a very simple implementation, and is only meant to get you started using Custom Controls.

 -- Note this is based off of the example created by Mike Bostock https://bl.ocks.org/mbostock/4339083  refactored to work as a Cognos Custom Control.
 -- Added Pan and Zoom functions inspired by a post by Rob Schmuecker http://bl.ocks.org/robschmuecker/7880033

-- Usage

    Pass data to control through query
    Each column represents a level in the hierarchy 
    The First column should be a rollup of the entire hierarchy
    Last Column should be a measure that will be rolled up.  

 */

define(["http://d3js.org/d3.v3.min.js", "jquery"], function(d3) {
    "use strict";

    var myHierarchy = {};
    //d3 variables =
    var svg = '';
    var x = '';
    var y = '';
    var width = '',
        height = '',
        radius = '',
        arc = '';
    var tree = '',
        root = '';
    var i = 0,
        duration = 750;
    var diagonal;
    var diameter = 300;
    var links;

    function d3tree() {};

    d3tree.prototype.initialize = function(oControlHost, fnDoneInitializing, oDataStore) {
        //Add CSS file reference to report.  This only contains a few simple settings that can be hard codded if needed
        $("head link[rel='stylesheet']").last().after("<link href='http://localhost/controls/sunburst/d3tree.css' rel='stylesheet' />");
        fnDoneInitializing();
    }

    d3tree.prototype.draw = function(oControlHost) {

        var partition = d3.layout.partition()
            .value(function(d) {
                return d.size;
            });
        var margin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 120
            },
            width = 960 - margin.right - margin.left,
            height = 960 - margin.top - margin.bottom;

        tree = d3.layout.tree()
            .size([height, width]);

        diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });

        svg = d3.select(oControlHost.container).append("svg")
            .attr("id", "chart")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .call(d3.behavior.zoom().on("zoom", function() {
                svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
            }))
            .append("g")
            .attr('id', 'chartBody')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        partition.nodes(myHierarchy);
        root = myHierarchy;
        root.x0 = height / 2;
        root.y0 = 0;
        root.children.forEach(collapse);
        update(root, oControlHost.configuration);

    };

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function update(source, config) {

        var radialDiagonal = d3.svg.diagonal.radial()
            .projection(function(d) {
                return [d.y, d.x / 180 * Math.PI];
            });

        // Compute the new tree layout.

        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);


        var nodes = tree.nodes(root).reverse();
        links = tree.links(nodes);

        nodes.forEach(function(d) {
            d.y = d.depth * 180;
        });

        var node = svg.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .attr("id", function(d) {
                name = d.name
                return name.replace(' ', '_');
            }).attr("value", function(d) {
                return d.value;
            }).on("mouseover", mouseover)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .attr("id", function(d) {
                name = d.name
                return 'txt_' + name.replace(' ', '_');
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 1e-6);

        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 7)
            .style("fill", function(d) {
                //Adding Random color as an example
                var clr = customColor(config);
                return clr;
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

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

        var link = svg.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("id", function(d) {
                name = d.target.name
                return 'link_' + name.replace(' ', '_');
            })
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    }

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

    d3tree.prototype.setData = function(oControlHost, oDataStore) {

        //Pass data to function to build out hierarchy
        var mychildren = this.getChildren(0, 0, 0, oDataStore.json)
        myHierarchy = mychildren[0];
    };

    d3tree.prototype.getChildren = function(idx, col, pCol, myJson) {

        //Looping through Data to build Hierarchical JSON 

        var rows_Length = myJson.rows.length;
        var childname1 = 'na'
        var children = [];
        //Child Loop-------------------------------------------------
        for (var jRow = 0; jRow < rows_Length; jRow++) {

            if (myJson.rows[jRow][pCol] == idx) {
                var idx2 = myJson.rows[jRow][col];
                var child2 = {};

                if (childname1 != myJson.columns[col]['values'][idx2]) {
                    child2['name'] = myJson.columns[col]['values'][idx2];
                    var mychildren = []
                    if (col + 2 < myJson.columns.length) {
                        //Down the rabit hole!!!
                        mychildren = this.getChildren(idx2, col + 1, col, myJson)
                    }
                    child2['children'] = mychildren;
                    if (col + 2 == myJson.columns.length) {
                        child2['size'] = myJson.rows[jRow][col + 1];
                    }
                    children.push(child2);
                    childname1 = myJson.columns[col]['values'][idx2];
                } //end if   
            } //end if
        } //end Child loop  

        return children;
    }

    //***************** Mouse Over ************************/
    function mouseover(d) {
        var sequenceArray = getAncestors(d);
        var sequenceCnt = sequenceArray.length - 1

        //Reset all values from previous hover/mouseover
        $('.link').css('stroke', '#ccc');
        $('circle').css('stroke', "lightsteelblue");

        //Highlight path links on SVG Tree
        var name = d.name;
        $('#' + name.replace(' ', '_')).css('stroke', 'red');
        $('#link_' + name.replace(' ', '_')).css('stroke', 'red');
        $('#txt_' + name.replace(' ', '_')).addClass('hoverText');

        //Loop through linage and aggregate all children values 
        if (sequenceCnt > -1) {
            var lastChild = sequenceArray[sequenceCnt].name;
            var lastChildTot = d3.format(",")(parseInt(sequenceArray[sequenceCnt].value));

            //Variable lastChildTot contains the aggregated value to the point being hovered over 

        } else {
            //if sequenceCnt < -1 the reset total and call mouse leave to reset all hover actions
            mouseleave(d);
        }
    }

    function mouseleave(d) {
        // Hide the breadcrumb trail
    }

    // Given a node in a partition layout, return an array of all of its ancestor
    // nodes, highest first, but excluding the root.
    function getAncestors(node) {
        var path = [];
        var current = node;
        while (current.parent) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }

    function customColor(config) {
        var clrs = [];

        if (!config) {
            clrs = ["#feebe2", "#fbb4b9", "#f768a1", "#c51b8a", "#7a0177"];
        } else {
            clrs = config.colors;
        }

        var x = Math.floor((Math.random() * 5) + 1);

        return clrs[x];
    }

    return d3tree;
});