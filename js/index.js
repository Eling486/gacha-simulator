let Application = PIXI.Application,
  Container = PIXI.Container,
  loader = new PIXI.Loader(),
  resources = loader.resources,
  TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite,
  Rectangle = PIXI.Rectangle;

let app, bg, grid_w, grid_h, pool_ui_data, basic_ui_data

window.onresize = updatePageSize()

function updatePageSize() {
  const w = window.innerWidth
  const h = window.innerHeight
  grid_w = parseInt(w / 100)
  grid_h = parseInt(h / 100)
  /*
  if(Math.min(w, h) == w){
    window.app_w = w
    window.app_h = w * 9 / 16
  }else{
    window.app_h = h - 50
    window.app_w = (h - 50) * 16 / 9
  }*/
}

async function loadGachaPage() {
  basic_ui_data = await loadJson('./asstes/json/ui/pools/basic.json')
  pool_ui_data = await loadJson(`./asstes/json/ui/pools/${window.pool_id}.json`)
  updatePageSize()
  loadGachaPageRes();
}

function loadGachaPageRes() {
  app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    resolution: 1
  });

  document.body.appendChild(app.view);

  loader
    .add(pool_ui_data.resources)
    .load(setup);

  function setup() {
    UI_pools = loader.resources['pool_ui'].textures;
    UI_basic = loader.resources['basic_ui'].textures;

    for(index in pool_ui_data.position){
      let _position = pool_ui_data.position[index]
      let _add = `${index} = new Sprite(UI_pools["${index.split('-')[0]}.png"]);
        app.stage.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
      eval(_add)
    }

    for(index in basic_ui_data.position){
      let _position = basic_ui_data.position[index] // 下行用'-'分割字符串是用来进行相同纹理的元素区分的
      let _add = `${index} = new Sprite(UI_basic["${index.split('-')[0]}.png"]);
        app.stage.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
      eval(_add)
    }
    
    /*
    //Make the treasure box using the alias
    bg = new Sprite(UI_pools["bg.png"]);
    app.stage.addChild(bg);
    bg.scale.set(1.7, 1.3);
    bg.position.set(grid_w * 50 - bg.width / 2, grid_h * 70 - bg.height / 2)*/
  }
}

