$(function () {

    $('#buildtree').on('click', function () {
        var link = $('#pageLink').val();
        buildTree(link);
    });

    $('#buildGraph').on('click', function () {
            root = masterTree;
            update();
    });
    
    $('#buildChildtree').on('click', function () {
        level = 1;
        buildTree(selectedLink , update);
    });

});


var getAnchorProps = function (href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

var currentLink = '';

function buildTree(link, cb) {

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
        
            if(cb) { cb(); }
        })
        .fail(function (data) {
            currentLink = link;
            processResponse({query:{}}, link);
        });
}



var masterTree = { root : true };

var visitedLinks = [];

var level = 0;

function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getByUid (ref, id) {

        if(ref.uid === id ) {
            return ref;
        } else {
            ref.children.forEach(function(child){
                getByUid(child.children, id);           
            });            
        }
    
    return null;

}

function processResponse(data, link) {

    var treeMap = parseLinks(data, link);


    if (level === 0) {

        masterTree.name = link;
        masterTree.uid = rnd(1, 100000);

        var externalLinks = treeMap.others.map(function (link) {
            return {
                name: link,
                ownlink: false,
                children: [],
                uid : rnd(1, 100000)
            };
        });
        var internalLinks = treeMap.same.map(function (link) {
            return {
                name: link,
                ownlink: true,
                children: [],
                uid : rnd(1, 100000)
            };
        });

        masterTree.children = externalLinks.concat(internalLinks);

        //buildLevelOne(masterTree.children);

    } else if (level === 1) {

        var child = masterTree.children.filter(function (node) {
            return node.name == currentLink;
        });

        var externalLinks = treeMap.others.map(function (link) {
            return {
                name: link,
                ownlink: false,
                children: [],
                uid : rnd(1, 100000)
            };
        });
        var internalLinks = treeMap.same.map(function (link) {
            return {
                name: link,
                ownlink: true,
                children: [],
                uid : rnd(1, 100000)
            };
        });

        child[0].children = externalLinks.concat(internalLinks);
    }

    console.log(masterTree)
}

function buildLevelOne() {
    level = 1;

    //masterTree.children.forEach(function (node) {
        buildTree(masterTree.children[0].name);
   // });

}


function parseLinks(data, link) {


    var currentHost = getAnchorProps(link).hostname;
    visitedLinks.push(currentHost);


    var treeMap = {};

    if (!data.query.count) {
        treeMap.name = currentHost;
        treeMap.same = [];
        treeMap.others = [];
        return treeMap;
    }

    var anchors = data.query.results.a;

    anchors = anchors.map(function (link) {
        return link.href.split('?')[0];
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
        console.log(currentHostNames, getAnchorProps(item).hostname)
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
