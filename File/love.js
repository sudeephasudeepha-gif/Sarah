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
    var z = ((x / r)*(x / r) + (y / r)*(y / r) - 1);
    return z*z*z - (x/r)*(x/r)*(y/r)*(y/r)*(y/r) < 0;
}

Point = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}
Point.prototype = {
    clone: function(){ return new Point(this.x, this.y); },
    add: function(o){ var p=this.clone(); p.x+=o.x; p.y+=o.y; return p; },
    sub: function(o){ var p=this.clone(); p.x-=o.x; p.y-=o.y; return p; },
    div: function(n){ var p=this.clone(); p.x/=n; p.y/=n; return p; },
    mul: function(n){ var p=this.clone(); p.x*=n; p.y*=n; return p; }
}

Heart = function() {
    var points=[],x,y,t;
    for (var i=10;i<30;i+=0.2){
        t=i/Math.PI;
        x=16*Math.pow(Math.sin(t),3);
        y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
        points.push(new Point(x,y));
    }
    this.points=points;
    this.length=points.length;
}
Heart.prototype = {
    get:function(i,scale){ return this.points[i].mul(scale||1); }
}

/* ---------------- TREE ---------------- */

Tree = function(canvas,width,height,opt){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.width=width;
    this.height=height;
    this.opt=opt||{};
    this.branchs=[];
    this.blooms=[];
    this.bloomsCache=[];
    this.initSeed();
    this.initFooter();
    this.initBranch();
    this.initBloom();
}

Tree.prototype = {

initSeed:function(){
    var s=this.opt.seed||{};
    this.seed={ heart:{point:new Point(s.x||this.width/2,s.y||this.height/2)} };
},

initFooter:function(){
    this.footer={ draw:function(){} };
},

initBranch:function(){
    var b=this.opt.branch||[];
    for(var i=0;i<b.length;i++){
        this.branchs.push(new Branch(this,new Point(b[i][0],b[i][1]),
        new Point(b[i][2],b[i][3]),new Point(b[i][4],b[i][5]),b[i][6],b[i][7]));
    }
},

initBloom:function(){
    for(var i=0;i<700;i++){
        this.bloomsCache.push(this.createBloom(this.width,this.height,240,new Heart()));
    }
},

createBloom:function(width,height,r,figure){
    var x,y;
    while(true){
        x=random(20,width-20);
        y=random(20,height-20);
        if(inheart(x-width/2,height/2-y,r)){
            return new Bloom(this,new Point(x,y),figure);
        }
    }
},

canGrow:function(){ return this.branchs.length>0; },

grow:function(){
    for(var i=0;i<this.branchs.length;i++){
        this.branchs[i].grow();
    }
},

canFlower:function(){
    return this.bloomsCache.length>0 || this.blooms.length>0;
},

flower:function(num){
    var newBlooms=this.bloomsCache.splice(0,num);
    this.blooms.push.apply(this.blooms,newBlooms);

    for(var i=0;i<this.blooms.length;i++){
        var b=this.blooms[i];
        if(!b.falling){
            b.flower();
        } else {
            b.jump();
        }
    }
}

}

/* ---------------- BRANCH ---------------- */

Branch = function(tree,p1,p2,p3,r,l){
    this.tree=tree;
    this.p1=p1; this.p2=p2; this.p3=p3;
    this.radius=r;
    this.length=l||100;
    this.len=0;
    this.t=1/(this.length-1);
}

Branch.prototype={
    grow:function(){
        if(this.len<=this.length){
            var p=bezier([this.p1,this.p2,this.p3],this.len*this.t);
            var ctx=this.tree.ctx;
            ctx.beginPath();
            ctx.fillStyle='#FFC0CB';
            ctx.arc(p.x,p.y,this.radius,0,2*Math.PI);
            ctx.fill();
            this.len++;
            this.radius*=0.97;
        }
    }
}

/* ---------------- BLOOM (FALLING PETALS) ---------------- */

Bloom = function(tree,point,figure){
    this.tree=tree;
    this.point=point;
    this.figure=figure;
    this.color='rgb(255,'+random(0,255)+','+random(0,255)+')';
    this.alpha=1;
    this.angle=random(0,360);
    this.scale=0.1;
    this.falling=false;   // ⭐ important
}

Bloom.prototype={

draw:function(){
    var ctx=this.tree.ctx;
    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.translate(this.point.x,this.point.y);
    ctx.scale(this.scale,this.scale);
    ctx.rotate(this.angle);
    ctx.beginPath();
    for(var i=0;i<this.figure.length;i++){
        var p=this.figure.get(i);
        ctx.lineTo(p.x,-p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
},

flower:function(){
    this.draw();
    this.scale += 0.05;

    // start falling after full bloom
    if(this.scale > 1){
        this.falling = true;
    }
},

jump:function(){
    this.draw();

    // 🌸 FALL
    this.point.y += 1.5 + Math.random();

    // 🌬️ SWAY
    this.point.x += Math.sin(this.angle) * 0.5;

    // 🔄 ROTATE
    this.angle += 0.05;

    // ✨ FADE
    this.alpha -= 0.003;

    // REMOVE
    if(this.point.y > this.tree.height || this.alpha <= 0){
        var i = this.tree.blooms.indexOf(this);
        if(i > -1) this.tree.blooms.splice(i,1);
    }
}

}

window.Tree = Tree;

})(window);
