
phina.globalize();

(function(phina, global){
  var ASSETS = {
    image: {
      nnokogiri: 'nnokogiri',
      snokogiri: 'snokogiri',
      saw: 'chain_saw',
    }
  };
  
  ASSETS.image.forIn(function(k, v){
    this[k] = 'images/' + v + '.png';
  });
  
  
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
  
  
  var app;
  phina.main(function(){
    app = GameApp({
      assets: ASSETS,
      fps: 60,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
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
        y: CY        
      }).addChildTo(this);
    }
  });
  
}(phina, phina.global));