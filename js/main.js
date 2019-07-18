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
    $(function(){
        let inputs = {};

        let $canvas = $("#canvas");
        $canvas.height($canvas.width());
        canvasRect = $canvas[0].getBoundingClientRect();
        
        let scene = new Three.Scene();
        let renderer = new Three.WebGLRenderer();
        let dim = { w: $canvas.width(), h: $canvas.height() };
        renderer.setSize(dim.w, dim.h);
        $canvas.append(renderer.domElement);
        
        let network = new Cloth(scene, dim.w * 0.05 , dim.h * 0.05 ,
                                dim.w * 0.9, dim.h * 0.9, 15, 15);

        
        // Bloat by 10% in all directions to get the view bounds
        let camera = new Three.OrthographicCamera(
            0, dim.w,
            dim.h, 0,
            -1000, 1000)
        scene.add(camera);
        
        function event2ray(e) {
            let ortho = (camera instanceof Three.OrthographicCamera);

            let pos = new Three.Vector3(
                2 * (e.clientX - canvasRect.left) / canvasRect.width - 1,
                1 - 2 * (e.clientY - canvasRect.top) / canvasRect.height,
                ortho ? -1 : 0.5 /* important */);
            
            pos.unproject(camera);

            let tgt;
            if (ortho) {
                let dir = new Three.Vector3(0, 0, -1);
                dir.transformDirection(camera.matrixWorld);
                tgt = pos.clone().add(dir);
            } else {
                tgt = pos;
                pos = camera.position;
            }
            return new Three.Line3(pos, tgt);
        }

        let vertex; // ref to dragged Vertex
        let mouse = new Three.Vector3(); // mouse position in 3-space
        let key_down, mouse_down; // button flags
        
        function moveVertex(locked) {
            vertex.current = mouse;
            vertex.locked = locked;
        };

        function animate() {
            window.requestAnimationFrame(animate);
            network.update(0.001);
            renderer.render(scene, camera);
        }

        $("#noform").on("submit", () => false);
               
        $canvas.on("keydown", function() {
            key_down = true;
        })
                
        .on("keyup", function() {
            key_down = false;
        })
        
        .on("mouseover", function() {
            $canvas.focus();
        })
        
        .on('mousedown', function(event) {
            mouse_down = true;
            let ray = event2ray(event);
            let hit = network.getClosestVertex(ray);
            vertex = hit.vertex;
            mouse.copy(hit.ray);
            moveVertex(true);
        })

        .on('mouseup', function(event) {
            mouse_down = false;
            moveVertex(key_down);
        })
                
        .on('mousemove', function(event) {
            if (!mouse_down) return;
            let ray = event2ray(event);
            ray.closestPointToPoint(vertex.current, false, mouse);
            moveVertex(true);
        });
        
        $('input').each(function(){
            inputs[$(this).prop('id')] = this;
        });

        animate();
    });
});
