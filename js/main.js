requirejs.config({
    baseUrl: ".",
    urlArgs: "t=" + Date.now(),
    paths: {
        "jquery": "//cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery",
        "jquery-ui": "//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui",
        "jquery-ui/ui": "//cdn.jsdelivr.net/npm/jquery-ui@1.12.1/ui",
        "jquery-csv": "//cdnjs.cloudflare.com/ajax/libs/jquery-csv/1.0.5/jquery.csv",
        "three": "//cdnjs.cloudflare.com/ajax/libs/three.js/106/three"
    }
});

requirejs(["three", "js/Cloth", "jquery"], function(Three, Cloth) {
});
