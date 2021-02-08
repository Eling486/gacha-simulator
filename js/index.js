let Application = PIXI.Application,
  Container = PIXI.Container,
  loader = new PIXI.Loader(),
  resources = loader.resources,
  TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle,
  state = PIXI.state

PIXI.settings.SORTABLE_CHILDREN = true

let c = new Charm(PIXI);
let d = new Dust(PIXI);

let app, bg, grid_w, grid_h, pool_ui_data, basic_pool_ui_data, single_ui_data, starContainer
let sprites_on_stage = [],
  single_effect_sprites = []
let UI_single, UI_pool_basic, UI_pool

function loadJson(path) {
  return new Promise(resolve => {
    var request = new XMLHttpRequest();
    request.open("get", path);
    request.send(null);
    request.onload = function () {
      if (request.status == 200) {
        resolve(JSON.parse(request.responseText))
      }
    }
  })
}

function resetStatistics() {
  window.gacha_times = 0
  window.real_gacha_times = 0
  window.gacha_results = []
  window.last_gacha_result = []
  window.last_six_star = 0
  window.six_num = 0
  window.five_num = 0
  window.four_num = 0
  window.three_num = 0
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  c.update();
  d.update();
  // renderer.render(app.stage);
}

window.onload = async function () {
  window.first_load = true
  window.resources_json = await loadJson('./asstes/json/resources.json')
  window.pools_json = await loadJson('./asstes/json/pools.json')
  window.pool_id = window.pools_json.default
  resetStatistics()
  window.chars_json = await loadJson('./asstes/json/characters.json')
  loadGachaPage()
  gameLoop()
}

function updatePageSize() {
  window.app_h = 650
  window.app_w = window.app_h * 16 / 9
  grid_w = parseInt(window.app_w / 100)
  grid_h = parseInt(window.app_h / 100)
  /*
  const w = window.innerWidth
  const h = window.innerHeight
  console.log(Math.min(w, h * 16 / 9) == w)
  if(Math.min(w, h * 9 / 16) == w){
    window.app_w = w
    window.app_h = w * 9 / 16
    grid_w = parseInt(window.app_w / 100)
    grid_h = parseInt(window.app_h / 100)
  }else{
    window.app_h = h
    window.app_w = h * 16 / 9
    grid_w = parseInt(window.app_w / 100)
    grid_h = parseInt(window.app_h / 100)
  }*/
}

function addSprite(ui_data, index, UI_res) {
  let _position = ui_data[index] // 下行用'0'分割字符串是用来进行相同纹理的元素区分的
  sprites_on_stage.push(index)
  let _add = `${index} = new Sprite(${UI_res}["${index.split('0')[0]}.png"]);
        app.stage.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
  window.eval(_add)
}

function addSpriteWithAni(ui_data, index, UI_res, type = 'normal') {
  addSprite(ui_data, index, UI_res)
  if (type == 'effect') {
    single_effect_sprites.push(index)
  }
  if (ui_data[index].rotation) {
    eval(`${index}.rotation = ${ui_data[index].rotation}`)
  }
  if (ui_data[index].tint) {
    eval(`${index}.tint = ${ui_data[index].tint}`)
  }
  if (ui_data[index].alpha) {
    eval(`${index}.alpha = ${ui_data[index].alpha}`)
  }
  if (ui_data[index].ani_type) {
    if (ui_data[index].ani_type.indexOf('slide') >= 0) {
      eval(`c.slide(${index}, grid_w * ${ui_data[index].end_x} - ${index}.width / 2, grid_h * ${ui_data[index].end_y} - ${index}.height / 2, 60 * ${ui_data[index].time})`)
    }
    if (ui_data[index].ani_type.indexOf('scale') >= 0) {
      setTimeout(function () {
        eval(`c.scale(${index}, ${ui_data[index].end_scale_x}, ${ui_data[index].end_scale_y}, 60 * ${ui_data[index].time - ui_data[index].before_scale_time})`)
      }, ui_data[index].before_scale_time * 1000)
    }
    if (ui_data[index].ani_type.indexOf('fadeOut') >= 0) {
      setTimeout(function () {
        eval(`c.fadeOut(${index}, 60 * ${ui_data[index].time - ui_data[index].before_fade_time})`)
      }, ui_data[index].before_fade_time * 1000)
    }
    if (ui_data[index].ani_type.indexOf('fadeLoop') >= 0) {
      setTimeout(function () {
        eval(`c.pulse(${index}, ${ui_data[index].time / 2} * 60, 0)`)
      }, (ui_data[index].delay_time + ui_data[index].time / 2) * 1000)
    }
  }
}

function addText(text_data, index) {
  let _position = text_data[index].position
  sprites_on_stage.push(index)
  let _add = `let ${index}_style = new TextStyle(${JSON.stringify(text_data[index].style)});
        ${index} = new Text(${JSON.stringify(text_data[index].content)}, ${index}_style);
        app.stage.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
  window.eval(_add)
}

async function loadGachaPage() {
  basic_pool_ui_data = await loadJson('./asstes/json/ui/pools/basic.json')
  pool_ui_data = await loadJson(`./asstes/json/ui/pools/${window.pool_id}.json`)
  updatePageSize()
  if (window.first_load == true) {
    app = new Application({
      width: window.app_w,
      height: window.app_h,
      antialias: true,
      transparent: false,
      resolution: 1
    });
    document.body.appendChild(app.view);
  }
  app.stage.interactive = true;
  let font_load_style_1 = new TextStyle({
    "fontFamily": "TeYaSong",
    "fontSize": 10,
    "lineHeight": 10,
    "fill": "white"
  });
  let font_load_style_2 = new TextStyle({
    "fontFamily": "NovecentoWide",
    "fontSize": 10,
    "lineHeight": 10,
    "fill": "white"
  });
  load_font_1 = new Text('Load Font', font_load_style_1);
  load_font_2 = new Text('Load Font', font_load_style_2);
  load_font_1.alpha = 0.01
  load_font_2.alpha = 0.01
  app.stage.addChild(load_font_1);
  app.stage.addChild(load_font_2);
  loadGachaPageRes();
}

function loadGachaPageRes() {
  if (window.first_load == true) {
    loader
      .add(resources_json.resources)
      .load(setup);
  } else {
    setup()
  }

  function setup() {
    window.first_load = false
    UI_pool = loader.resources['pool_ui'].textures;
    UI_pool_basic = loader.resources['basic_pool_ui'].textures;

    // return showGachaResult() //调试用

    // 背景元素提前加载
    for (index in basic_pool_ui_data.preload) {
      addSprite(basic_pool_ui_data.preload, index, 'UI_pool_basic')
    }

    for (index in pool_ui_data.position) {
      addSprite(pool_ui_data.position, index, 'UI_pool')
    }

    for (index in basic_pool_ui_data.position) {
      addSprite(basic_pool_ui_data.position, index, 'UI_pool_basic')
    }

    details_box.alpha = 0.5 // 为详情框设置不透明度

    if (pool_ui_data.add_from_basic) {
      for (index in pool_ui_data.add_from_basic) {
        addSprite(pool_ui_data.add_from_basic, index, 'UI_pool_basic')
      }
    }

    for (index in basic_pool_ui_data.text) {
      addText(basic_pool_ui_data.text, index)
    }

    if (pool_ui_data.text) {
      for (index in pool_ui_data.text) {
        addText(pool_ui_data.text, index)
      }
    }
    if (window.gacha_times >= 10 || window.six_num > 0 || window.five_num > 0) {
      tentimes_up.alpha = 0
      tentimes_up_text.alpha = 0
    }
    btn_once.interactive = true;
    btn_once.buttonMode = true
    btn_once.on('pointerdown', function () {
      btn_once.tint = 0xBBBBBB
    })
    btn_once.on('pointertap', function () {
      btn_once.tint = 0xFFFFFF
      gachaConfirm('once')
    })
    btn_once.on('pointerout', function () {
      btn_once.tint = 0xFFFFFF
    })

    btn_ten_times.interactive = true;
    btn_ten_times.buttonMode = true
    btn_ten_times.on('pointerdown', function () {
      btn_ten_times.tint = 0xBBBBBB
    })
    btn_ten_times.on('pointertap', function () {
      btn_ten_times.tint = 0xFFFFFF
      gachaConfirm('tentimes')
    })
    btn_ten_times.on('pointerout', function () {
      btn_ten_times.tint = 0xFFFFFF
    })
  }
}

function gachaConfirm(type) {
  if (type == 'once') {
    result = gachaOnce()
    app.stage.children = []
    sprites_on_stage = []
    /*
    let char_id = '136_hoshiguma' // 调试用
    let gacha_result = []
    let char_obj = window.chars_json.characters[char_id]
    gacha_result.push(char_obj)
    result = gacha_result
    */
    // console.log(result)
    if (!loader.resources[result[0].id.split('_')[1]]) {
      console.log('need load')
      loader
        .add(result[0].id.split('_')[1], `https://eling-1258601402.file.myqcloud.com/gacha-simulator/asstes/characters/standing/${result[0].id}.png`)
        //.add(result[0].id.split('_')[1], `./asstes/characters/standing/${result[0].id}.png`)
        .load(loadOrganization);
    } else {
      console.log('exist')
      app.stage.children = []
      showGachaResult()
    }
  }
  if (type == 'tentimes') {
    result = gachaTenTimes()

    showGachaResult()
  }
}

function loadOrganization(){
  let result = window.last_gacha_result
  if (!loader.resources[window.chars_json.organizations[result[0].organization].icon_name]) {
    loader
      //.add(result[0].id.split('_')[1], `https://eling-1258601402.file.myqcloud.com/gacha-simulator/asstes/characters/standing/${result[0].id}.png`)
      .add(window.chars_json.organizations[result[0].organization].icon_name, `./asstes/img/organizations/${window.chars_json.organizations[result[0].organization].icon_name}.png`)
      .load(showGachaResult);
  } else {
    console.log('exist')
    app.stage.children = []
    showGachaResult()
  }
}

async function showGachaResult() {
  let result = window.last_gacha_result
  //app.stage.children = []
  single_ui_data = await loadJson(`./asstes/json/ui/single.json`)
  UI_single = loader.resources['single_ui'].textures;
  if (result.length == 1) {
    for (index in single_ui_data.preload) {
      addSpriteWithAni(single_ui_data.preload, index, 'UI_single')
    }
    mg.alpha = 0
    for (index in single_ui_data.effect1) {
      addSpriteWithAni(single_ui_data.effect1, index, 'UI_single')
    }
    addSpriteWithAni(single_ui_data.char_any, 'char_any', 'UI_single')

    for (index in single_ui_data.effect2) {
      addSpriteWithAni(single_ui_data.effect2, index, 'UI_single')
      eval(`${index}.blendMode = PIXI.BLEND_MODES.HARD_LIGHT;`)
    }
    s_1.blendMode = PIXI.BLEND_MODES.SATURATION;
    starContainer = new PIXI.ParticleContainer(1500, { alpha: true, scale: true, rotation: true, uvs: true });
    app.stage.addChild(starContainer);

    function showStars(i) {
      let _position = single_ui_data.effect_stars
      i -= 1
      d.create(grid_w * _position[i].x, grid_h * _position[i].y, () => new Sprite(UI_single["s_2.png"]), starContainer, 12, 0, false, 0, 6.28, 30, 40, 3, 8, 0.01, 0.05, 0.02, 0.08);
    }

    let one_star_time = 70
    let num = result[0].stars
    // num = 6 // 调试用
    let star_order = [4, 3, 2, 1, 5, 6]
    for (i = 0; i < 6; i++) {
      if (star_order[i] <= num) {
        let n = i
        c.wait(600 + one_star_time * n).then(() => {
          showStars(star_order[n])
          c.wait(50).then(() => {
            addSpriteWithAni(single_ui_data.stars, `star0${star_order[n]}`, 'UI_single')
            window.eval(`star0${star_order[n]}.anchor.set(0.5, 0.5);
            c.scale(star0${star_order[n]}, 0.58, 0.58, 60 * 0.1);
            c.wait(105).then(() => {
              c.scale(star0${star_order[n]}, 0.5, 0.5, 60 * 0.1);
            });`)
          })
        })
      }
    }

    c.wait(1500).then(() => {
      addSpriteWithAni(single_ui_data.mask, `mask_r_1`, 'UI_single')
      mask_r_1.anchor.set(0.5, 0.5)
      mask_r_1.alpha = 0
      c.scale(mask_r_1, 10, 10, 60 * 0.8)
      c.fadeIn(mask_r_1, 60 * 0.5)
      mask_r_1.zIndex = 999
      c.wait(800).then(() => {
        c.fadeOut(mask_r_1, 60 * 0.4)
        /*
        c.wait(200).then(() => {
          addSpriteWithAni(single_ui_data.mask, `shanshuo_1`, 'UI_single')
          c.wait(100).then(() => {
            shanshuo_1.position.set(grid_w * single_ui_data.mask['shanshuo_1'].x_2, grid_h * single_ui_data.mask['shanshuo_1'].y_2)
          })
        })*/

        char_any.alpha = 0
        mg.alpha = 1

        let organization = window.chars_json.organizations[result[0].organization].icon_name
        let name = result[0].id.split('_')[1]
        let _add = `${organization} = new Sprite(loader.resources['${organization}'].texture);
          app.stage.addChild(${organization});
          ${organization}.scale.set(0.7, 0.7);
          ${organization}.position.set(grid_w * 38 - ${organization}.width / 2, grid_h * 40 - ${organization}.height / 2);
          c.slide(${organization}, grid_w * (38 + 10) - ${organization}.width / 2, grid_h * 40 - ${organization}.height / 2, 60 * 30, 'linear');
          ${name} = new Sprite(loader.resources['${name}'].texture);
          app.stage.addChild(${name});
          ${name}.scale.set(0.8, 0.8);
          ${name}.position.set(grid_w * 56 - ${name}.width / 2, grid_h * 70 - ${name}.height / 2);
          c.slide(${name}, grid_w * (56 + 10) - ${name}.width / 2, grid_h * 70 - ${name}.height / 2, 60 * 30, 'linear');`;
        window.eval(_add)

        for (var i = 1; i < num + 1; i++) {
          let _position = single_ui_data.stars_2
          eval(`if(star0${i}){
            star0${i}.anchor.set(0.5, 0.5)
            star0${i}.position.set(grid_w * ${_position[`star0${i}`].x} - star0${i}.width / 2, grid_h * ${_position[`star0${i}`].y} - star0${i}.height / 2);
            star0${i}.zIndex = 100;
            c.slide(star0${i}, grid_w * ${_position[`star0${i}`].x + 25} - star0${i}.width / 2, grid_h * ${_position[`star0${i}`].y} - star0${i}.height / 2, 60 * 20, 'linear');
          }`)
        }
        
        let occupation = window.chars_json.occupation[result[0].occupation].icon_name
        occupation_img = new Sprite(UI_single[`${occupation}_b.png`])
        app.stage.addChild(occupation_img);
        occupation_img.anchor.set(1, 0.5)
        occupation_img.position.set(grid_w * 48, grid_h * 81.5);
        c.slide(occupation_img, grid_w * (48 + 20), grid_h * 81.5, 60 * 30, 'linear');

        let name_zh_style = new TextStyle({
          fontFamily: "TeYaSong",
          fontSize: 70,
          lineHeight: 30,
          fill: "white",
          stroke: '#000000',
          strokeThickness: 1,
          dropShadow: true,
          dropShadowColor: "#000000",
          dropShadowBlur: 4,
          dropShadowAngle: 0,
          dropShadowDistance: 0
        });
        let name_en_style = new TextStyle({
          fontFamily: "NovecentoWide",
          fontSize: 30,
          lineHeight: 30,
          fill: "white",
          stroke: '#000000',
          strokeThickness: 1,
          dropShadow: true,
          dropShadowColor: "#000000",
          dropShadowBlur: 2,
          dropShadowAngle: 0,
          dropShadowDistance: 0
        });
        name_en = new Text(result[0].name.en.toUpperCase(), name_en_style);
        name_zh = new Text(result[0].name.zh, name_zh_style);
        name_zh.anchor.set(0, 0.5)
        name_en.anchor.set(0, 0.5)
        name_zh.position.set(grid_w * 48, grid_h * 81);
        name_en.position.set(grid_w * 48.5, grid_h * 88);
        app.stage.addChild(name_zh);
        app.stage.addChild(name_en);
        c.slide(name_zh, grid_w * (48 + 20), grid_h * 81, 60 * 30, 'linear');
        c.slide(name_en, grid_w * (48.5 + 20), grid_h * 88, 60 * 30, 'linear');
        c.wait(800).then(() => {
          app.stage.on('pointertap', function () {
            app.stage.children = []
            app.stage._events = {}
            loadGachaPage()
          })
        })
      })
    })
  }
}