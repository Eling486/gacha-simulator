let Application = PIXI.Application,
  Container = PIXI.Container,
  loader = new PIXI.Loader(),
  resources = loader.resources,
  TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle,
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

  function addSprite(ui_data, index, UI_res) {
    let _position = ui_data[index] // 下行用'0'分割字符串是用来进行相同纹理的元素区分的
    let _add = `${index} = new Sprite(${UI_res}["${index.split('0')[0]}.png"]);
        app.stage.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
    eval(_add)
  }

  function setup() {
    UI_pools = loader.resources['pool_ui'].textures;
    UI_basic = loader.resources['basic_ui'].textures;

    // 背景元素提前加载
    for (index in basic_ui_data.preload) {
      addSprite(basic_ui_data.preload, index, 'UI_basic')
    }

    for (index in pool_ui_data.position) {
      addSprite(pool_ui_data.position, index, 'UI_pools')
    }

    for (index in basic_ui_data.position) {
      addSprite(basic_ui_data.position, index, 'UI_basic')
    }

    if (pool_ui_data.add_from_basic) {
      for (index in pool_ui_data.add_from_basic) {
        addSprite(pool_ui_data.add_from_basic, index, 'UI_basic')
      }
    }
    /*
    let style = new TextStyle({
      fontFamily: "Arial",
      fontSize: 36,
      fill: "white",
      stroke: '#ff3300',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
    });
    let message = new Text("Hello Pixi!", style);
    app.stage.addChild(message);*/
  }
}

