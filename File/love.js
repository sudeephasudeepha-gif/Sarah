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
    var z = ((x/r)*(x/r)+(y/r)*(y/r)-1)**3 - (x/r)*(x/r)*(y/r)*(y/r)*(y/r);
    return z < 0;
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

Seed = function(tree, point, scale, color) {
    this.tree = tree;
    this.heart = { point: point, scale: scale||1, color: color||'#FFC0CB', figure: new Heart() };
    this.cirle = { point: point, scale: scale||1, color: color||'#FFC0CB', radius:5 };
}

Seed.prototype = {
    draw:function(){ this.drawHeart(); this.drawText(); },
    addPosition:function(x,y){ this.cirle.point=this.cirle.point.add(new Point(x,y)); },
    canMove:function(){ return this.cirle.point.y < (this.tree.height+20); },
    move:function(x,y){ this.clear(); this.drawCirle(); this.addPosition(x,y); },
    canScale:function(){ return this.heart.scale>0.2; },
    scale:function(s){ this.clear(); this.drawCirle(); this.drawHeart(); this.heart.scale*=s; },

    drawHeart:function(){
        var ctx=this.tree.ctx,h=this.heart;
        ctx.save();
        ctx.fillStyle=h.color;
        ctx.translate(h.point.x,h.point.y);
        ctx.beginPath();
        for(var i=0;i<h.figure.length;i++){
            var p=h.figure.get(i,h.scale);
            ctx.lineTo(p.x,-p.y);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
    },

    drawCirle:function(){
        var ctx=this.tree.ctx,c=this.cirle;
        ctx.save();
        ctx.fillStyle=c.color;
        ctx.translate(c.point.x,c.point.y);
        ctx.beginPath();
        ctx.arc(0,0,c.radius,0,2*Math.PI);
        ctx.fill(); ctx.restore();
    },

    drawText:function(){
        var ctx=this.tree.ctx,h=this.heart;
        ctx.save();
        ctx.fillStyle=h.color;
        ctx.translate(h.point.x,h.point.y);
        ctx.scale(h.scale,h.scale);
        ctx.font="12px Verdana";
        ctx.fillText("Click Me :) ",30,-5);
        ctx.fillText("Birthday Queen!",28,10);
        ctx.restore();
    },

    clear:function(){
        var ctx=this.tree.ctx,c=this.cirle;
        ctx.clearRect(c.point.x-30,c.point.y-30,60,60);
    }
}

Footer = function(tree,width,height,speed){
    this.tree=tree;
    this.point=new Point(tree.seed.heart.point.x,tree.height-height/2);
    this.width=width; this.height=height; this.speed=speed||2; this.length=0;
}
Footer.prototype={
    draw:function(){
        var ctx=this.tree.ctx,p=this.point,len=this.length/2;
        ctx.save();
        ctx.strokeStyle='#FFF';
        ctx.lineWidth=this.height;
        ctx.lineCap='round';
        ctx.translate(p.x,p.y);
        ctx.beginPath();
        ctx.moveTo(-len,0); ctx.lineTo(len,0);
        ctx.stroke(); ctx.restore();
        if(this.length<this.width) this.length+=this.speed;
    }
}

Tree = function(canvas,width,height,opt){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.width=width;
    this.height=height;
    this.opt=opt||{};
    this.initSeed();
    this.initFooter();
    this.initBranch();
    this.initBloom();
}

Tree.prototype = {

initSeed:function(){
    var s=this.opt.seed||{};
    this.seed=new Seed(this,new Point(s.x||this.width/2,s.y||this.height/2),s.scale,s.color);
},

initFooter:function(){
    var f=this.opt.footer||{};
    this.footer=new Footer(this,f.width||this.width,f.height||5,f.speed||2);
},

initBranch:function(){
    this.branchs=[];
    this.addBranchs(this.opt.branch||[]);
},

initBloom:function(){
    var b=this.opt.bloom||{},cache=[];
    for(var i=0;i<(b.num||500);i++){
        cache.push(this.createBloom(this.width,this.height,240,this.seed.heart.figure));
    }
    this.blooms=[];
    this.bloomsCache=cache;
},

addBranchs:function(arr){
    for(var i=0;i<arr.length;i++){
        var b=arr[i];
        this.branchs.push(new Branch(this,new Point(b[0],b[1]),new Point(b[2],b[3]),new Point(b[4],b[5]),b[6],b[7]));
    }
},

grow:function(){ this.branchs.forEach(b=>b.grow()); },

flower:function(num){
    var newBlooms=this.bloomsCache.splice(0,num);
    this.blooms.push(...newBlooms);

    this.blooms.forEach(b=>{
        if(!b.falling){
            b.flower();
        } else {
            b.jump();
        }
    });
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
}

}

Branch = function(tree,p1,p2,p3,r,l){
    this.tree=tree; this.p1=p1; this.p2=p2; this.p3=p3;
    this.radius=r; this.length=l||100; this.len=0; this.t=1/(this.length-1);
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
            this.len++; this.radius*=0.97;
        }
    }
}

/* 🌸 BLOOM (UPDATED FALLING PETALS) */

Bloom = function(tree,point,figure){
    this.tree=tree;
    this.point=point;
    this.figure=figure;
    this.color='rgb(255,'+random(0,255)+','+random(0,255)+')';
    this.alpha=1;
    this.angle=random(0,360);
    this.scale=0.1;
    this.falling=false;
}

Bloom.prototype={

flower:function(){
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

    this.scale+=0.05;

    // start falling after bloom
    if(this.scale>1){
        this.falling=true;
    }
},

jump:function(){
    var ctx=this.tree.ctx;

    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.translate(this.point.x,this.point.y);
    ctx.scale(1,1);
    ctx.rotate(this.angle);

    ctx.beginPath();
    for(var i=0;i<this.figure.length;i++){
        var p=this.figure.get(i);
        ctx.lineTo(p.x,-p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 🌸 FALL DOWN
    this.point.y += 1.5 + Math.random();

    // 🌬️ SWAY
    this.point.x += Math.sin(this.angle) * 0.5;

    // 🔄 ROTATE
    this.angle += 0.05;

    // ✨ FADE
    this.alpha -= 0.003;

    // REMOVE
    if(this.point.y > this.tree.height || this.alpha <= 0){
        this.tree.blooms.splice(this.tree.blooms.indexOf(this),1);
    }
}

}

window.Tree = Tree;

})(window);
