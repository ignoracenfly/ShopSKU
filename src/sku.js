(function ($, template) {
    "use strict"

    // skus : 所有组合
    // sku : 当前的sku
    // properties : 所有属性
    var ShopSKU = function(options){
        this.skus = (options.skus || {}), this.sku = (options.sku || ''), this.properties = (options.properties || {});
        this.selector = options.selector || '',
            this.tpl_selector = options.tpl_selector || '',
        this.redirect = options.redirect || '';

        if(!this.selector)
            throw '缺少 selector 参数';
        if(!this.tpl_selector)
            throw '缺少 tpl_selector 参数';
        if($===undefined)
            throw '缺少 jQuery@1.* 依赖';
        if(template===undefined || typeof template !== 'function')
            throw '缺少 art-template@4.13.1 依赖，source: https://github.com/aui/art-template';

        this._render(function(_this){
            _this._initial(_this.sku, true);
        });

    };

    ShopSKU.prototype.constructor = this;

    /**
     * 有效的sku数组
     * ['sku1','sku2','sku3']
     * */
    ShopSKU.prototype._get_valid_skus = function(part_sku){
        var valid_skus = [];
        for (var item in this.skus){
            if(item.indexOf(part_sku)!=-1)
                valid_skus.push(item);
        }
        return valid_skus;
    };

    /**
     * sku: 一个sku组合
     * is_select: 是否选中该选中的项，默认false即不选中
     * */
    ShopSKU.prototype._initial = function(sku, is_select){
        sku = sku.split('|');
        if(sku.length != this.properties.length + 2){
            console.log('sku不正确, 正确结构为"|a:b|c:d|e:f|"');
        }
        var prefix_sku = '|';
        for(var i=1, l = sku.length-2; i<=l; i++){
            prefix_sku += sku[i] + '|';

            // 选中
            if(is_select){
                var item = sku[i].split(':');
                $(this.selector + ' .line .item-values>div[data-id="'+item[1]+'"][data-pid="'+item[0]+'"]').addClass('selected').removeClass('disable')
            }

            // 前缀查询, 排除无效项
            var _valid_sku_arr = this._get_valid_skus(prefix_sku);
            for(var k in _valid_sku_arr){
                // 下一选项 处理
                var _one_sku_options = _valid_sku_arr[k].replace(prefix_sku, '').split('|');
                if(_one_sku_options[0]){
                    var _temp = _one_sku_options[0].split(':');
                    $(this.selector + ' .line .item-values>div[data-pid="'+_temp[0]+'"]').addClass('disable');
                    $(this.selector + ' .line .item-values>div[data-id="'+_temp[1]+'"][data-pid="'+_temp[0]+'"]').removeClass('disable');
                }
            }
        }
    };

    /*
    * 初始化展示内容
    * */
    ShopSKU.prototype._render = function(callback){
        var __this = this;

        // 模板引擎渲染
        var render = template.compile($(__this.tpl_selector).html());
        var _tpl = render({list: __this.properties});
        $(__this.selector).append(_tpl);

        $(document).ready(function () {
            $('body').on('click', __this.selector + ' .item-values>div', function(e){
                var _this = $(e.currentTarget), tips = _this.attr('data-tips');
                if(tips !=undefined){
                    var tips_dom = _this.parents('.line').find('.item-values-tips');
                    tips_dom.length ? tips_dom.text(tips) : _this.parents('.line').append('<div></div><div class="item-values-tips">'+tips+'</div>');
                }
                if(_this.hasClass('disable') || _this.hasClass('selected'))return;
                _this.addClass('selected').siblings().removeClass('selected');
                // 处理sku组合
                var part_sku = '|'+_this.attr('data-pid') +':'+ _this.attr('data-id')+'|';

                // 组装所有选择的sku
                var _selectedDom = $('.item-values>div.selected');
                var prefix_sku = '|';
                for(var i in _selectedDom){
                    var cur_selected = $(_selectedDom[i]);
                    prefix_sku += cur_selected.attr('data-pid') + ':' + cur_selected.attr('data-id') + '|';
                    if('|'+cur_selected.attr('data-pid') + ':' + cur_selected.attr('data-id') + '|' == part_sku){
                        break;
                    }
                }

                // 前缀查询, 排除无效项
                var _valid_sku_arr = __this._get_valid_skus(prefix_sku);
                // 特殊： 如果只命中一种，跳转页面
                if(_valid_sku_arr.length==1){
                    __this.redirect ? __this.redirect(skus[_valid_sku_arr[0]]) : (location = skus[_valid_sku_arr[0]]);
                    return;
                }

                // step1 全部disable
                for(var k=0, l=_valid_sku_arr.length; k<l; k++){
                    if(prefix_sku == _valid_sku_arr[k]){
                        __this.redirect ? __this.redirect(skus[_valid_sku_arr[k]]) : (location = skus[_valid_sku_arr[k]]);
                        return;
                    }
                    // 下一选项 处理
                    var next_item = _valid_sku_arr[k].replace(prefix_sku, '').split('|');
                    if(next_item[0]){
                        var _temp = next_item[0].split(':');
                        $(__this.selector + ' .line .item-values>div[data-pid="'+_temp[0]+'"]').addClass('disable');
                    }
                }

                // step2 挑出真正的disable
                for(var k=0, l=_valid_sku_arr.length; k<l; k++){
                    // 下一选项 处理
                    var next_item = _valid_sku_arr[k].replace(prefix_sku, '').split('|');
                    if(next_item[0]){
                        var _temp = next_item[0].split(':');
                        $(__this.selector + ' .line .item-values>div[data-id="'+_temp[1]+'"][data-pid="'+_temp[0]+'"]').removeClass('disable');
                    }
                }

                // step3 可选项重新设置selected
                $(__this.selector + ' .line .item-values>div.disable').removeClass('selected');
                for(var k=0, l=_valid_sku_arr.length; k<l; k++){
                    // 下一选项 处理
                    var next_item = _valid_sku_arr[k].replace(prefix_sku, '').split('|');
                    if(next_item[0]){
                        var _temp = next_item[0].split(':'), next_item = $(__this.selector + ' .line .item-values>div[data-pid="'+_temp[0]+'"].selected');
                        if(next_item.length>0){
                            next_item.removeClass('selected').trigger('click');
                        }else{
                            next_item = $(__this.selector + ' .line .item-values>div[data-pid="'+_temp[0]+'"]:not(.disable)');
                            $(next_item[0]).trigger('click');
                        }
                        break;
                    }
                }

            });
        });
        callback && callback(__this);
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ShopSKU;
    } else if (typeof define === "function" && define.amd) {
        define(function(){return ShopSKU;});
    } else {
        window.ShopSKU = ShopSKU;
    }
})(jQuery, template);
