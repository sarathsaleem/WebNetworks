$(function () {

    $('#buildtree').on('click', function () {
        var link = $('#pageLink').val();
        buildTree(link);
    });


});


var getAnchorProps = function (href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

var currentLink = '';

function buildTree(link) {

    if (level > 10) {
        return;
    }

    var query = "select DISTINCT(href) from html where url='" + link + "' and xpath='//a'";
    var getPath = "http://query.yahooapis.com/v1/public/yql?q=" + query + "&format=json";
    currentLink = link;
    $.get(getPath)
        .done(function (data) {
            currentLink = link;
            processResponse(data, link);
        });
}



var masterTree = {};

var visitedLinks = [];

var level = 0;

function processResponse(data, link) {

    var treeMap = parseLinks(data, link);


    if (level === 0) {
        masterTree.name = link;
        masterTree.children = treeMap.others;

        visitedLinks.push(link);

        buildLevelOne(masterTree.children);

    } else if (level === 1) {

        var child = masterTree.children.filter(function (node) {
            return node.name == currentLink;
        });

        child[0].children = treeMap.others;
        child[0].children = child[0].children.map(function (link) {
            return {
                name: link,
                size: 100
            };
        });
        

    }


    console.log(masterTree);

 
}

setTimeout(function () {
    root = masterTree;
    update();
}, 10000);

function buildLevelOne() {
    level = 1;

    masterTree.children = masterTree.children.map(function (link) {
        return {
            name: link,
            children: []
        };
    });

    masterTree.children.forEach(function (node) {
        buildTree(node.name);
    });

}


function parseLinks(data, link) {

    var currentHost = getAnchorProps(link).hostname;


    var treeMap = {};

    if (!data.query.count) {
        treeMap.name = currentHost;
        treeMap.same = [];
        treeMap.others = [];
        return treeMap;
    }

    var anchors = data.query.results.a;

    anchors = anchors.map(function (link) {
        return link.href;
    });

    //unique
    anchors = anchors.filter(function (item, pos) {
        return anchors.indexOf(item) == pos;
    });

    //remove non links
    anchors = anchors.filter(function (item, pos) {
        return item.indexOf('/') > 0;
    });


    var currentHostNames = [currentHost, getAnchorProps('/').hostname];

    var sameHostLinks = [],
        otherHosts = [];

    anchors.forEach(function (item) {

        if (currentHostNames.indexOf(getAnchorProps(item).hostname) > -1) {
            sameHostLinks.push(item);
        } else {
            otherHosts.push(item);
        }
    });

    treeMap.name = currentHost;
    treeMap.same = sameHostLinks;
    treeMap.others = otherHosts;

    return treeMap;

}