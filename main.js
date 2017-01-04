
phina.globalize();

(function(phina, global){
  var ASSETS = {
    image: {
      nnokogiri: 'nnokogiri',
      snokogiri: 'snokogiri',
      saw: 'chain_saw',
      santab:'santa_b',
      santaf:'santa_f',
      attackeffect: 'attackeffect',
      treeD: 'tree_d',
      treeN: 'tree_n',
    }
  };
  
  ASSETS.image.forIn(function(k, v){
    this[k] = 'images/' + v + '.png';
  });
  
  
  var MOVE_RATE = 1.5;
  
  var SCREEN_WIDTH = 640;
  var SCREEN_HEIGHT = 960;
  
  var gx = Grid(SCREEN_WIDTH, 100);
  var gy = Grid(SCREEN_HEIGHT, 100);
  
  function sx(i){return gx.span(i);}
  function sy(i){return gy.span(i);}
  function cx(i){return gx.center(i);}
  function cy(i){return gy.center(i);}
  
  var CX = cx();
  var CY = cy();
  var UY = sy(15);
  var DY = sy(85);
  
  var score = 0;
  
  
  var app;
  phina.main(function(){
    app = GameApp({
      assets: ASSETS,
      fps: 60,
      startLabel: 'main',
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: '#eee'
    });
    
    app.run();
  });
  
  function def(name, params){return phina.define(name, params);}
  function sceneDef(name, params){
    var _static = params._static || {};
    var defaults = _static.defaults || {};
    params.superClass = params.superClass || phina.display.DisplayScene;
    var enter = params.init;
    params.init = function (opts){
      opts = {}.$safe(defaults, opts || {});
      this.superInit(opts);
      this.one('enter', function(e){
        enter.call(this, e.app, params.opts);
      });
    };
    
    return phina.define(name, params);
  }
  
  //#scenes
  sceneDef('TitleScene', {
    init: function(app, opts){
      Label({
        text: 'クリスマスツリーを切り倒そーぜ!!',
        x: CX,
        y: CY,  
      }).addChildTo(this);
    }
  });
  
  sceneDef('MainScene', {
    init: function(app, opts){
      
      
      this.textLayer = DisplayElement().addChildTo(this);
      this.targetLayer = DisplayElement().addChildTo(this);
      this.destroyLayer = DisplayElement().addChildTo(this);
      this.enemyLayer = DisplayElement().addChildTo(this);
      this.playerLayer = DisplayElement().addChildTo(this);
      this.weaponLayer = DisplayElement().addChildTo(this);
      this.enemyAttackLayer = DisplayElement().addChildTo(this);
      this.messageLayer = DisplayElement().addChildTo(this);
      
      this.player = Player({
        x: CX,
        y: sy(80),
        weapon: ChainSaw().addChildTo(this.weaponLayer),
        targets: this.targetLayer.children,
        destroyLayer: this.destroyLayer,
      }).addChildTo(this.playerLayer);
      
      TreeN({
        x: 300,
        y: 200,
      }).addChildTo(this.targetLayer)
      .on('destroy', function(e){
        console.log(this.score);
      })
      .on('destroy', this.__addScore);
      
      TreeD({
        x: 400,
        y: 600,
      }).addChildTo(this.targetLayer)
      .on('destroy', function(e){
        console.log(this.score);
      })
      .on('destroy', this.__addScore);
      
    },
    __addScore: function(e){
      score += this.score;
    },
    
    update: function(app){
    }
  });
  
  
  //#objects
  def('Player', {
    superClass: DisplayElement,
    weapon: null,
    init: function(opts){
      this.superInit(opts);
      this.elm = Sprite('santab').addChildTo(this).setSize(60, 80);
      this.width = 4;
      this.height = 4;
      
      this.pid = -1;
      this.prevx = this.x;
      this.prevy = this.y;
      
      this.isMobile = phina.isMobile();
      this.weapon = opts.weapon.setTarget(this);
      this.destroyLayer = opts.destroyLayer;
      this.tester = HitTester(opts.targets);
    },
    
    update: function(app){
      this.move(app).checkPosition(app);
      this.attackCheck(app);
      this.weapon.neutral();
      return this;
    },
    
    attackCheck: function(app){
      if(!this.isMobile){
        var kb = app.keyboard;
        if(kb.getKey('z')){
          this.weapon.attack();
        }
      }
      
    },
    
    move: function(app){
      var ps = app.pointers;
      if(ps && ps.length > 0) {
        var p = ps[0];
        if(p.now){
          if(p instanceof phina.input.Mouse && p.start){
            // 一度話してからもう一度クリックした場合ワープする対策
          }
          else if(p.id === this.pid){
            this.x += (p.x - this.prevx) * MOVE_RATE;
            this.y += (p.y - this.prevy) * MOVE_RATE;
          } 
          else {
            this.pid = p.id;
          }
          this.prevx = p.x;
          this.prevy = p.y;
        }
      }
      
      if(!this.isMobile){
        // PCでデバッグ用にキーボード操作
        var angle = app.keyboard.getKeyAngle();
        if(typeof angle === 'number'){
          var rad = (angle + 90).toRadian();
          var cos = Math.cos(rad);
          var sin = Math.sin(rad);
          this.position.add({x: sin * 5 * MOVE_RATE, y: cos * 5 * MOVE_RATE});
        }
      }
      return this;
    },
    
    checkPosition: function(){
      if(this.x < this.width) this.x = this.width;
      else if(this.x > SCREEN_WIDTH - this.width) this.x = SCREEN_WIDTH - this.width;
      
      if(this.y < UY) this.y = UY;
      else if(this.y > DY) this.y = DY;
      
      return this;
    }
  });
  
  def('Weapon', {
    superClass: DisplayElement,
    
    // 装備してるオブジェクト
    target: null,
    // target からの相対位置
    ox:0,
    oy:0,
    state: 0,
    NEUTRAL: 0,
    ATTACK: 1,
    power: 1,
    speed: 1,
    range: 1,
    
    init: function(opts){
      this.superInit(opts);
      this.target = opts.target;
      this.elm = opts.elm.addChildTo(this);
      this.elm.originX = opts.ox;
      this.elm.originY = opts.oy;
      this.speed = opts.speed;
      this.range = opts.range;
      this.power = opts.power;
      this.scaleX = opts.scaleX || 1;
    },
    
    setTarget: function(target){
      this.target = target;
      return this;
    },
    
    neutral: function(){
      this.x = this.target.x;
      this.y = this.target.y;
      return this;
    },
    
    isAttack: function(){
      return this.ATTACK === this.state;
    },
    
    isNeutral: function(){
      return this.NEUTRAL === this.state;
    },
    
    attack: function(){
      if(this.isAttack()) return this;
      this.state = this.ATTACK;
      var s = this;
      var attackeffect = AttackEffect(this.target)
        .addChildTo(this.parent)
        .setRange(this.range)
        .setPower(this.power);
      this.tweener.clear().to({
        rotation: - 180
      }, 10 * this.speed, 'swing').call(function(){
        s.state = s.NEUTRAL;
        s.rotation = 0;
        attackeffect.remove();
      });
      return this;
    },
    
    
    
  });
  
  def('ChainSaw', {
    superClass: Weapon,
    
    init: function(opts){
      this.superInit({
        elm: Sprite('saw').setSize(60, 52),
      }.$safe(ChainSaw.defaults, opts || {}));
      
    },
    
    _static: {
      defaults: {
        ox: 1.5,
        oy: 0.5,
        scaleX: -1, 
        range: 200,
        power: 5,
        speed: 30,
      }
    }
  });
  
  def('AttackEffect', {
    superClass: DisplayElement,
    range:1,
    power:1,
    init: function(opts){
      this.superInit();
      var e = this.effect = Sprite('attackeffect').addChildTo(this);
      this.x = opts.x;
      this.bottom = opts.top;
      this.tester = opts.tester;
      this.setSize(e.width, e.height);
      this.hits = [];
    },
    
    update: function(){
      var power = this.power;
      var hits = this.hits;
      this.tester.test({
        left: this.left,
        top: this.top,
        bottom: this.bottom,
        right: this.right,
        isHited: function(elm){
          return hits.indexOf(elm) !== -1;
        },
      }, function(o){
        hits.push(o);
        o.damage(power);
      });
    },
    
    isHited: function(elm) {
      return this.hits.indexOf(elm) !== -1;
    },
    
    setRange: function(range){
      this.width = this.height = range;
      this.setScale(range / 100);
      return this;
    },
    setPower: function(p){
      this.power = p;
      return this;
    },
    
  });
  
  def('TargetElement', {
    superClass: DisplayElement,
    hp: 100,
    score: 1,
    init: function(opts){
      this.superInit(opts);
      this.hp = opts.hp || 100;
      this.score = opts.score || 1;
    },
    
    damage: function(d){
      if(this.isDestroyed()) return this;
      this.hp -= d;
      this.flare('damage', {damage: d});
      if(this.hp <= 0){
        this.flare('destroy', {damage: d});
      }
      return this;
    },
    
    isDestroyed: function(){
      return this.hp <= 0;
    }
  });
  
  def('TargetSprite', {
    superClass: TargetElement,
    
    init: function(opts){
      this.superInit(opts);
      this.sprite = Sprite(opts.image).addChildTo(this);
      if(opts.size){
        this.sprite.setSize(opts.size.width, opts.size.height);
        this.setSize(opts.size.width, opts.size.height);
      }
    },
    
    gatagata: function(n){
      n = n || 1;
      var c = 3;
      this.sprite.setPosition(0, 0).tweener.setUpdateType('fps').clear().to({
        x: 2 * n,
        y: 0.2 * n,
      }, 2).to({
        x: -2 * n,
        y: -0.2 * n,
      }, 2)
      .call(function(){
        if(--c < 0) {
          this.setLoop(false);
          this.target.setPosition(0, 0);
        }
      }).setLoop(true);
    },
  });
  
  def('StaticTarget', {
    superClass: TargetSprite,
    
    init: function(opts){
      this.superInit(opts);
      this.on('damage', function(e){
        this.gatagata(this.width * 0.01);
      });
    }
  });
  
  def('TreeN', {
    superClass: 'StaticTarget',
    
    init: function(opts){
      opts.image = 'treeN';
      opts.hp = 10;
      opts.score = 1;
      opts.size = opts.size || {
        width: 80,
        height: 170,
      };
      this.superInit(opts);
    }
  });
  
  def('TreeD', {
    superClass: 'StaticTarget',
    
    init: function(opts){
      opts.image = 'treeD';
      opts.hp = 15;
      opts.score = 3;
      opts.size = opts.size || {
        width: 80,
        height: 170,
      };
      this.superInit(opts);
    }
  });
  
  //#utils
  def('HitTester', {
    superClass: phina.util.EventDispatcher,
    
    init: function(targets){
      this.targets = targets;
    },
    
    add: function(tester){
      this.targets.push(tester);
      return this;
    },
    
    test: function(target, fn){
      var targets = this.targets.slice();
      for(var i = 0, len = targets.length; i < len; ++i){
        var t = targets[i];
        if(!target.isHited(t) && t.hitTestElement(target)){
          fn(t);
        }
      }
      return this;
    },
    
    erase: function(tester){
      this.targets.erase(tester);
      return this;
    }
    
  });

  
}(phina, phina.global));