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
        var z = ((x / r) * (x / r) + (y / r) * (y / r) - 1) *
                ((x / r) * (x / r) + (y / r) * (y / r) - 1) *
                ((x / r) * (x / r) + (y / r) * (y / r) - 1) -
                (x / r) * (x / r) * (y / r) * (y / r) * (y / r);
        return z < 0;
    }

    // ---------------- POINT ----------------
    Point = function(x, y) {
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
    }

    // ---------------- HEART ----------------
    Heart = function() {
        var points = [], x, y, t;
        for (var i = 10; i < 30; i += 0.2) {
            t = i / Math.PI;
            x = 16 * Math.pow(Math.sin(t), 3);
            y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            points.push(new Point(x, y));
        }
        this.points = points;
        this.length = points.length;
    }
    Heart.prototype = {
        get: function(i, scale) {
            return this.points[i].mul(scale || 1);
        }
    }

    // ---------------- SEED ----------------
    Seed = function(tree, point, scale, color) {
        this.tree = tree;

        this.heart = {
            point  : point,
            scale  : scale || 1,
            color  : color || '#FFC0CB',
            figure : new Heart(),
        }

        this.cirle = {
            point  : point,
            scale  : scale || 1,
            color  : color || '#FFC0CB',
            radius : 5,
        }
    }

    Seed.prototype = {
        draw: function() {
            this.drawHeart();
        },

        drawHeart: function() {
            var ctx = this.tree.ctx, heart = this.heart;
            ctx.save();
            ctx.fillStyle = heart.color;
            ctx.translate(heart.point.x, heart.point.y);
            ctx.beginPath();
            for (var i = 0; i < heart.figure.length; i++) {
                var p = heart.figure.get(i, heart.scale);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // ---------------- TREE ----------------
    Tree = function(canvas, width, height, opt) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.opt = opt || {};

        this.initSeed();
        this.initBloom();
    }

    Tree.prototype = {

        initSeed: function() {
            var x = this.width / 2;
            var y = this.height / 2;
            this.seed = new Seed(this, new Point(x, y), 0.8, '#FF69B4');
        },

        initBloom: function() {
            var cache = [],
                num = 1200, // 🔥 increased flowers
                width = this.width,
                height = this.height,
                figure = this.seed.heart.figure;

            var r = 240, x, y;

            for (var i = 0; i < num; i++) {
                cache.push(this.createBloom(width, height, r, figure));
            }

            this.blooms = [];
            this.bloomsCache = cache;
        },

        createBloom: function(width, height, radius, figure) {
            var x, y;
            while (true) {
                x = random(20, width - 20);
                y = random(20, height - 20);
                if (inheart(x - width / 2, height / 2 - y, radius)) {
                    return new Bloom(this, new Point(x, y), figure);
                }
            }
        },

        addBloom: function (bloom) {
            this.blooms.push(bloom);
        },

        removeBloom: function (bloom) {
            var blooms = this.blooms;
            blooms.splice(blooms.indexOf(bloom), 1);
        },

        flower: function(num) {
            var blooms = this.bloomsCache.splice(0, num);
            for (var i = 0; i < blooms.length; i++) {
                this.addBloom(blooms[i]);
            }

            for (var j = 0; j < this.blooms.length; j++) {
                this.blooms[j].flower();
            }
        },

        jump: function() {
            var blooms = this.blooms;

            // existing flowers fall
            for (var i = 0; i < blooms.length; i++) {
                blooms[i].jump();
            }

            // 🔥 spawn more falling flowers
            for (var i = 0; i < random(3, 6); i++) {
                blooms.push(this.createBloom(this.width, this.height, 240, this.seed.heart.figure));
            }
        }
    }

    // ---------------- BLOOM ----------------
    Bloom = function(tree, point, figure) {
        this.tree = tree;
        this.point = point;
        this.figure = figure;

        this.color = 'rgb(255,' + random(100, 255) + ',' + random(150, 255) + ')';
        this.alpha = random(0.5, 1);
        this.angle = random(0, 360);
        this.scale = 0.05;
    }

    Bloom.prototype = {

        flower: function() {
            this.draw();
            this.scale += 0.08;

            if (this.scale > 1) {
                this.tree.removeBloom(this);
            }
        },

        draw: function() {
            var ctx = this.tree.ctx;

            ctx.save();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;

            ctx.translate(this.point.x, this.point.y);
            ctx.scale(this.scale, this.scale);
            ctx.rotate(this.angle);

            ctx.beginPath();
            for (var i = 0; i < this.figure.length; i++) {
                var p = this.figure.get(i);
                ctx.lineTo(p.x, -p.y);
            }

            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },

        jump: function() {
            var height = this.tree.height;

            if (this.point.y > height + 20) {
                this.tree.removeBloom(this);
                return;
            }

            this.draw();

            // 🌸 smooth falling
            this.point.y += random(2, 4);

            // 🌸 side drift
            this.point.x += Math.sin(this.point.y * 0.05);

            // 🌸 rotation
            this.angle += 0.02;
        }
    }

    window.Tree = Tree;

})(window);
