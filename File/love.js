(function(window){

/* RANDOM */
function random(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/* BEZIER */
function bezier(cp, t) {  
    var p1 = cp[0].mul((1 - t) * (1 - t));
    var p2 = cp[1].mul(2 * t * (1 - t));
    var p3 = cp[2].mul(t * t); 
    return p1.add(p2).add(p3);
}  

/* HEART RANGE */
function inheart(x, y, r) {
    var z = ((x/r)*(x/r)+(y/r)*(y/r)-1)**3 - (x/r)*(x/r)*(y/r)*(y/r)*(y/r);
    return z < 0;
}

/* POINT */
var Point = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}
Point.prototype = {
    clone(){ return new Point(this.x,this.y); },
    add(o){ return new Point(this.x+o.x,this.y+o.y); },
    sub(o){ return new Point(this.x-o.x,this.y-o.y); },
    mul(n){ return new Point(this.x*n,this.y*n); },
    div(n){ return new Point(this.x/n,this.y/n); }
}

/* HEART SHAPE */
var Heart = function() {
    var points = [];
    for (var i = 10; i < 30; i += 0.2) {
        var t = i / Math.PI;
        var x = 16 * Math.pow(Math.sin(t), 3);
        var y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        points.push(new Point(x,y));
    }
    this.points = points;
    this.length = points.length;
}
Heart.prototype.get = function(i, scale){
    return this.points[i].mul(scale || 1);
}

/* SEED */
var Seed = function(tree, point, scale, color) {
    this.tree = tree;
    this.heart = { point, scale, color, figure:new Heart() };
    this.circle = { point, scale, color, radius:6 };
}

Seed.prototype = {

    draw(){
        this.drawHeart();
    },

    drawHeart(){
        var ctx = this.tree.ctx;
        var h = this.heart;

        ctx.save();
        ctx.fillStyle = h.color;
        ctx.translate(h.point.x, h.point.y);

        ctx.beginPath();
        ctx.moveTo(0,0);

        for(let i=0;i<h.figure.length;i++){
            let p = h.figure.get(i, h.scale);
            ctx.lineTo(p.x, -p.y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    canScale(){
        return this.heart.scale > 0.3;
    },

    scale(s){
        this.heart.scale *= s;
    },

    canMove(){
        return this.heart.point.y < this.tree.height - 80;
    },

    move(x,y){
        this.heart.point = this.heart.point.add(new Point(x,y));
    }
}

/* FOOTER LINE */
var Footer = function(tree,width,height,speed){
    this.tree=tree;
    this.width=width;
    this.height=height;
    this.speed=speed||2;
    this.length=0;
}
Footer.prototype.draw=function(){
    var ctx=this.tree.ctx;
    var len=this.length/2;

    ctx.save();
    ctx.strokeStyle="#fff";
    ctx.lineWidth=this.height;
    ctx.translate(this.tree.width/2,this.tree.height-10);

    ctx.beginPath();
    ctx.moveTo(-len,0);
    ctx.lineTo(len,0);
    ctx.stroke();

    ctx.restore();

    if(this.length < this.width){
        this.length += this.speed;
    }
}

/* TREE */
var Tree = function(canvas,width,height,opt){
    this.canvas=canvas;
    this.ctx=canvas.getContext("2d");
    this.width=width;
    this.height=height;
    this.opt=opt||{};

    this.initSeed();
    this.initFooter();
    this.initBranch();
    this.initBloom();
}

/* TREE METHODS */
Tree.prototype = {

    initSeed(){
        var seed = this.opt.seed || {};
        this.seed = new Seed(
            this,
            new Point(seed.x || this.width/2, seed.y || this.height/2),
            seed.scale || 1,
            seed.color || "#ff4d6d"
        );
    },

    initFooter(){
        var f = this.opt.footer || {};
        this.footer = new Footer(this, f.width||this.width, f.height||5, f.speed||2);
    },

    initBranch(){
        this.branchs=[];
        this.addBranchs(this.opt.branch||[]);
    },

    initBloom(){
        var bloom=this.opt.bloom||{};
        var num=bloom.num||1000;

        this.blooms=[];
        this.bloomsCache=[];

        var r=360; // BIG HEART

        for(let i=0;i<num;i++){
            this.bloomsCache.push(this.createBloom(
                this.width,
                this.height,
                r,
                this.seed.heart.figure
            ));
        }
    },

    addBranch(b){ this.branchs.push(b); },

    addBranchs(branchs){
        for(let b of branchs){
            this.addBranch(new Branch(
                this,
                new Point(b[0],b[1]),
                new Point(b[2],b[3]),
                new Point(b[4],b[5]),
                b[6],b[7],b[8]
            ));
        }
    },

    removeBranch(b){
        this.branchs = this.branchs.filter(x=>x!==b);
    },

    canGrow(){ return this.branchs.length>0; },

    grow(){
        this.branchs.forEach(b=>b.grow());
    },

    createBloom(width,height,r,figure){
        while(true){
            let x=random(0,width);
            let y=random(0,height);
            if(inheart(x-width/2, height/2-y, r)){
                return new Bloom(this,new Point(x,y),figure);
            }
        }
    },

    canFlower(){ return this.bloomsCache.length>0 || this.blooms.length>0; },

    flower(n){
        var newb=this.bloomsCache.splice(0,n);
        this.blooms.push(...newb);

        this.blooms.forEach(b=>b.flower());
    }
}

/* BRANCH */
var Branch = function(tree,p1,p2,p3,r,l,branchs){
    this.tree=tree;
    this.p1=p1; this.p2=p2; this.p3=p3;
    this.radius=r;
    this.length=l||100;
    this.len=0;
    this.t=1/(this.length-1);
    this.branchs=branchs||[];
}

Branch.prototype.grow=function(){
    if(this.len<=this.length){
        let p=bezier([this.p1,this.p2,this.p3],this.len*this.t);
        this.draw(p);
        this.len++;
        this.radius*=0.97;
    } else {
        this.tree.removeBranch(this);
        this.tree.addBranchs(this.branchs);
    }
}

Branch.prototype.draw=function(p){
    var ctx=this.tree.ctx;
    ctx.save();
    ctx.fillStyle="#ff85a2";
    ctx.beginPath();
    ctx.arc(p.x,p.y,this.radius,0,2*Math.PI);
    ctx.fill();
    ctx.restore();
}

/* BLOOM */
var Bloom = function(tree,point,figure){
    this.tree=tree;
    this.point=point;
    this.figure=figure;

    this.scale=0.09; // BIG FLOWER
    this.alpha=random(0.6,1);
    this.angle=random(0,360);
    this.speed=random(10,20);

    this.color=['#ff4d6d','#ff85a2','#ff99c8','#ffccd5'][random(0,3)];
}

Bloom.prototype.flower=function(){
    this.draw();
    this.scale+=0.02;
    if(this.scale>0.5){
        this.tree.blooms.shift();
    }
}

Bloom.prototype.draw=function(){
    var ctx=this.tree.ctx;

    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;

    ctx.translate(this.point.x,this.point.y);
    ctx.scale(this.scale,this.scale);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.moveTo(0,0);

    for(let i=0;i<this.figure.length;i++){
        let p=this.figure.get(i);
        ctx.lineTo(p.x,-p.y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

/* EXPORT */
window.Tree = Tree;

})(window);
