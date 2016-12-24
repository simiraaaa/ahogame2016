
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
      this.enemyLayer = DisplayElement().addChildTo(this);
      this.playerLayer = DisplayElement().addChildTo(this);
      this.weaponLayer = DisplayElement().addChildTo(this);
      this.enemyAttackLayer = DisplayElement().addChildTo(this);
      this.messageLayer = DisplayElement().addChildTo(this);
      
      this.player = Player({
        x: CX,
        y: sy(80),
        weapon: ChainSaw().addChildTo(this.weaponLayer),
      }).addChildTo(this.playerLayer);
      
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
    nx:0,
    ny:0,
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
        .addChildTo(app.currentScene.weaponLayer)
        .setRange(this.range);
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
    
    init: function(opts){
      this.superInit();
      this.effect = Sprite('attackeffect').addChildTo(this);
      this.x = opts.x;
      this.bottom = opts.top;
    },
    
    setRange: function(range){
      this.width = this.height = range;
      this.setScale(range / 100);
      return this;
    }
    
  });
  
  //#utils
  def('HitTester', {
    superClass: phina.util.EventDispatcher,
    
    init: function(target){
      this.testers = [];
      this.target = target;
    },
    
    add: function(tester){
      this.testers.push(tester);
      return this;
    },
    
    // 一度でもヒットするとヒットしたオブジェクトを返し終了する
    test: function(){
      var target = this.target;
      var testers = this.testers.slice();
      for(var i = 0, len = testers.length; i < len; ++i){
        var t = testers[i];
        if(target.hitTestElement(t)){
          return t;
        }
      }
      return false;
    },
    
    erase: function(tester){
      this.testers.erase(tester);
      return this;
    }
    
  });

  
}(phina, phina.global));