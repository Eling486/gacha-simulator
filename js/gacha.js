function gachaOnce() {
    var char_id = gacha()
    var gacha_result = []
    var char_obj = window.chars_json.characters[char_id]
    gacha_result.push(char_obj)
    window.last_gacha_result = gacha_result
    window.gacha_results.push(gacha_result)
    return gacha_result
}

function gachaTenTimes() {
    var char_arr = []
    for (var i = 0; i < 10; i++) {
        var char_id = gacha()
        char_arr.push(char_id)
    }
    var gacha_result = []
    for(i in char_arr){
        var gacha_char_id = char_arr[i]
        var char_obj = window.chars_json.characters[gacha_char_id]
        gacha_result.push(char_obj)
    }
    window.last_gacha_result = gacha_result
    window.gacha_results.push(gacha_result)
    return gacha_result
}

function gacha() {
    window.gacha_times += 1
    window.real_gacha_times +=1
    for (index in window.pools_json.pools) {
        if (window.pools_json.pools[index].id == window.pool_id) {
            var pool_json = window.pools_json.pools[index]
            break
        }
    }

    var all = pool_json.rules.all
    var star_rate = {}
    window.six_rate = pool_json.rules['six'].all
    if (window.last_six_star > 50) { // 根据寻访次数计算6星概率
        window.six_rate = (window.last_six_star - 49) * pool_json.rules['six'].all
    }
    if (window.real_gacha_times == 10 && window.six_num == 0 && window.five_num == 0) { // 前十抽保底
        star_rate['six'] = window.six_rate * all
        star_rate['five'] = (1 - window.six_rate) * all
    } else {
        for (key in pool_json.rules) { // 累加出其他星级的概率
            if (pool_json.rules[key].all) {
                if (key == 'six') {
                    star_rate[key] = window.six_rate * all
                } else {
                    star_rate[key] = ((1 - window.six_rate) * pool_json.rules[key].all / (1 - pool_json.rules['six'].all)) * all
                }
            }
        }
    }
    var star_max = {}
    var _count = 0
    for (key in star_rate) {
        star_max[key] = star_rate[key] + _count
        _count += star_rate[key]
    }
    var random_star = getRandom(1, all)
    var _max = all
    var result_star = ""
    for (key in star_max) { // 判断寻访到的星级
        if (Math.min(star_max[key], random_star) == random_star && star_max[key] <= _max + 0.00000001) {// 避免四舍五入的影响
            result_star = key
            _max = star_max[key]
        }
    }

    if (result_star == 'six') {
        window.last_six_star = 0
        window.six_num += 1
    }
    if (result_star == 'five') {
        window.last_six_star += 1
        window.five_num += 1
    }
    if (result_star == 'four') {
        window.last_six_star += 1
        window.four_num += 1
    }
    if (result_star == 'three') {
        window.last_six_star += 1
        window.three_num += 1
    }

    if (pool_json.rules[result_star].rate_up) { // 若某星干员存在概率提升
        var char_max = {}
        var star_all = 100
        var rate_up_all = 0
        for (var i = 0; i < pool_json.rules[result_star].rate_up.length; i++) {
            rate_up_all += pool_json.rules[result_star].rate_up[i].rate * star_all
            char_max[pool_json.rules[result_star].rate_up[i].char_id] = rate_up_all
        }
        char_max[result_star] = star_all
        var random_char = getRandom(1, star_all)
        var _max_char = all
        var result_char = ""
        for (key in char_max) {
            if (Math.min(char_max[key], random_char) == random_char && char_max[key] <= _max_char) {
                result_char = key
                _max_char = char_max[key]
            }
        }
        if (result_char == 'six' || result_char == 'five' || result_char == 'four' || result_char == 'three') {
            var char_arr = pool_json.content[result_star]
            for (var j = 0; j < pool_json.rules[result_star].rate_up.length; j++) { // 移除当期的up干员
                var char_index = char_arr.indexOf(pool_json.rules[result_star].rate_up[j].char_id)
                if (char_index >= 0) {
                    char_arr.splice(char_index, 1)
                }
            }
            if (pool_json.rules[result_star].weight_up) { // 若有加权的干员
                for (index in pool_json.rules[result_star].weight_up) {
                    for (var i = 0; i < pool_json.rules[result_star].weight_up[index].weight - 1; i++) {
                        char_arr.push(pool_json.rules[result_star].weight_up[index].char_id)
                    }
                }
            }
            var random_char2 = getRandom(1, char_arr.length)
            result_char = char_arr[random_char2 - 1]
        }
    } else {
        var char_arr = pool_json.content[result_star]
        if (pool_json.rules[result_star].weight_up) {
            for (index in pool_json.rules[result_star].weight_up) {
                for (var i = 0; i < pool_json.rules[result_star].weight_up[index].weight - 1; i++) {
                    char_arr.push(pool_json.rules[result_star].weight_up[index].char_id)
                }
            }
        }
        var random_char2 = getRandom(1, char_arr.length)
        var result_char = char_arr[random_char2 - 1]
    }
    return result_char // 返回寻访到的干员id
}

function getRandom(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min)
}