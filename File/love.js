     (function(window){

    function random(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    function bezier(cp, t) {  
        var p1 = cp[0].mul((1 - t) * (1 - t));
        var p2 = cp[1].mul(2 * t * (1 - t));
        var p3 = cp[2].mul(t * t); 
        return p1.add(p2).add(p3);
    }  

    function inheart(x, y, r) {
        var z = Math.pow((x/r)*(x/r)+(y/r)*(y/r)-1,3) - (x/r)*(x/r)*(y/r)*(y/r)*(y/r);
        return z < 0;
    }

    // ================= POINT =================
    function Point(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    Point.prototype = {
        clone: function() {
            return new Point(this.x, this.y);
        },
        add: function(o) {
            var p = this.clone();
            p.x += o.x;
            p.y += o.y;
            return p;
        },
        sub: function(o) {
            var p = this.clone();
            p.x -= o.x;
            p.y -= o.y;
            return p;
        },
        div: function(n) {
            var p = this.clone();
            p.x /= n;
            p.y /= n;
            return p;
        },
        mul: function(n) {
            var p = this.clone();
            p.x *= n;
            p.y *= n;
            return p;
        }
    };

    // ================= HEART =================
    function Heart() {
        var points = [], x, y, t;

        for (var i = 10; i < 30; i += 0.2) {
            t = i / Math.PI;
            x = 16 * Math.pow(Math.sin(t), 3);
            y = 13 * Math.cos(t)
              - 5 * Math.cos(2 * t)
              - 2 * Math.cos(3 * t)
              - Math.cos(4 * t);
            points.push(new Point(x, y));
        }

        this.points = points;
        this.length = points.length;
    }

    Heart.prototype.get = function(i, scale) {
        return this.points[i].mul(scale || 1);
    };

    // ================= SEED =================
    function Seed(tree, point, scale, color) {
        this.tree = tree;

        var autoScale = Math.min(window.innerWidth, window.innerHeight) / 600;
        scale = scale || autoScale;
        color = color || '#FF69B4';

        this.heart = {
            point  : point,
            scale  : scale,
            color  : color,
            figure : new Heart(),
        };

        this.circle = {
            point  : point,
            scale  : scale,
            color  : color,
            radius : 5,
        };
    }

    Seed.prototype = {
        draw: function() {
            this.drawHeart();
            this.drawText();
        },

        drawHeart: function() {
            var ctx = this.tree.ctx;
            var h = this.heart;

            ctx.save();
            ctx.fillStyle = h.color;
            ctx.translate(h.point.x, h.point.y);

            ctx.beginPath();
            for (var i = 0; i < h.figure.length; i++) {
                var p = h.figure.get(i, h.scale);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        },

        drawText: function() {
            var ctx = this.tree.ctx;
            var scaleFactor = window.innerWidth / 400;

            ctx.save();
            ctx.fillStyle = "#FF69B4";
            ctx.font = (12 * scaleFactor) + "px Verdana";

            ctx.fillText("Click Me :)", 20, -10);
            ctx.fillText("Birthday Queen!", 20, 10);

            ctx.restore();
        }
    };

    // ================= BLOOM =================
    function Bloom(tree, point, figure) {
        this.tree = tree;
        this.point = point;
        this.figure = figure;

        this.scale = Math.min(window.innerWidth, window.innerHeight) / 20000;
        this.alpha = Math.random();
    }

    Bloom.prototype = {
        draw: function() {
            var ctx = this.tree.ctx;

            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = "pink";

            ctx.translate(this.point.x, this.point.y);
            ctx.scale(this.scale, this.scale);

            ctx.beginPath();
            for (var i = 0; i < this.figure.length; i++) {
                var p = this.figure.get(i);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    };

    // ================= TREE =================
    function Tree(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.width = canvas.width;
        this.height = canvas.height;

        this.seed = new Seed(
            this,
            new Point(this.width / 2, this.height / 2)
        );
    }

    Tree.prototype = {
        draw: function() {
            this.seed.draw();
        }
    };

    // ================= EXPORT =================
    window.random = random;
    window.bezier = bezier;
    window.Point = Point;
    window.Tree = Tree;

})(window);
